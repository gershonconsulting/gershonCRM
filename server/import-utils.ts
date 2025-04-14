import { parse } from 'csv-parse';
import { readFileSync } from 'fs';
import { contacts, deals, dealStages, InsertContact, InsertDeal } from '../shared/schema';
import { db } from './db';
import path from 'path';

// Process the contacts CSV file (Export - Contacts)
export async function importContactsFromCSV(filePath: string, userId: number): Promise<number> {
  try {
    console.log('Importing contacts from:', filePath);
    const csvContent = readFileSync(filePath, 'utf8');
    const records = await parseCSV(csvContent);
    
    if (!records || records.length === 0) {
      throw new Error('No valid contact records found in CSV file');
    }
    
    console.log('Found records:', records.length);
    console.log('Sample record:', JSON.stringify(records[0], null, 2));
    
    // Map CSV fields to our schema
    const contactsToInsert: InsertContact[] = records.map((record: any) => {
      // Extract name components
      const firstName = record['First Name'] || '';
      const lastName = record['Last Name'] || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Extract email address - it's in "Email Addresses" field
      let email = '';
      if (record['Email Addresses']) {
        email = record['Email Addresses'];
      }
      
      // Extract phone number - it's in "Phone Numbers" field
      let phone = '';
      if (record['Phone Numbers']) {
        phone = record['Phone Numbers'];
      }
      
      // Extract company from Box Name
      const company = record['Box Name'] || '';
      
      // Extract position from Title
      const position = record['Title'] || '';
      
      // Extract address components
      let address = '';
      let city = '';
      let state = '';
      let country = '';
      
      if (record['Addresses']) {
        address = record['Addresses'];
        
        // Try to parse city, state, country from the address
        const addressParts = address.split(',').map(part => part.trim());
        if (addressParts.length >= 1) city = addressParts[0];
        if (addressParts.length >= 2) state = addressParts[1];
        if (addressParts.length >= 3) country = addressParts[2];
      }
      
      // Extract LinkedIn
      let linkedIn = '';
      if (record['LinkedIn']) {
        linkedIn = record['LinkedIn'];
      }
      
      return {
        name: fullName || 'Unknown',
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
        phone: phone || '',
        company: company || 'Unknown Company',
        position: position || '',
        notes: record['Other'] || '',
        linkedIn: linkedIn || '',
        city: city || '',
        state: state || '',
        country: country || '',
        address: address || '',
        source: 'Import',
        boxKey: record['Box Key'] || record['Key'] || '',
        customFields: {},
        tags: [],
        userId: userId
      };
    });
    
    console.log(`Prepared ${contactsToInsert.length} contacts for import`);
    
    // Insert contacts in batches to avoid database limitations
    const batchSize = 100;
    let successCount = 0;
    
    for (let i = 0; i < contactsToInsert.length; i += batchSize) {
      const batch = contactsToInsert.slice(i, i + batchSize);
      try {
        await db.insert(contacts).values(batch);
        successCount += batch.length;
        console.log(`Imported batch ${i / batchSize + 1}: ${batch.length} contacts`);
      } catch (error) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error);
      }
    }
    
    return successCount;
  } catch (error) {
    console.error('Error importing contacts:', error);
    throw error;
  }
}

// Process the boxes CSV file (Export - Boxes)
export async function importDealsFromCSV(filePath: string, userId: number): Promise<number> {
  try {
    console.log('Importing deals from:', filePath);
    const csvContent = readFileSync(filePath, 'utf8');
    const records = await parseCSV(csvContent);
    
    if (!records || records.length === 0) {
      throw new Error('No valid deal records found in CSV file');
    }
    
    console.log('Found records:', records.length);
    console.log('Sample record:', JSON.stringify(records[0], null, 2));
    
    // Get all stages to link them to deals
    const stagesData = await db.select().from(dealStages);
    const stageMap = new Map();
    stagesData.forEach(stage => {
      stageMap.set(stage.name.toLowerCase(), stage.id);
    });
    
    // Ensure we have a default contact
    let defaultContactId = 1; // Fallback
    const defaultContact = await db.select().from(contacts).limit(1);
    if (defaultContact && defaultContact.length > 0) {
      defaultContactId = defaultContact[0].id;
    }
    
    // Map stage names to our stages
    const mapStageId = (stageName: string) => {
      if (!stageName) return 1; // Default to first stage
      const lowerStageName = stageName.toLowerCase();
      
      // Direct mapping
      if (stageMap.has(lowerStageName)) {
        return stageMap.get(lowerStageName);
      }
      
      // Fuzzy mapping for common stage names
      if (lowerStageName.includes('lead')) return stageMap.get('lead') || 1;
      if (lowerStageName.includes('contact')) return stageMap.get('contacted') || 1;
      if (lowerStageName.includes('recommend')) return stageMap.get('recommend by qc') || 1;
      if (lowerStageName.includes('call schedule')) return stageMap.get('call scheduled') || 1;
      if (lowerStageName.includes('connect')) return stageMap.get('connected') || 1;
      if (lowerStageName.includes('engage')) return stageMap.get('engaged') || 1;
      if (lowerStageName.includes('proposal')) return stageMap.get('proposal sent') || 1;
      if (lowerStageName.includes('won')) return stageMap.get('won') || 1;
      if (lowerStageName.includes('later')) return stageMap.get('later stage') || 1;
      if (lowerStageName.includes('recycl')) return stageMap.get('recycled') || 1;
      
      return 1; // Default to first stage
    };
    
    // Function to parse date strings
    const parseDate = (dateString: string): Date | undefined => {
      if (!dateString) return undefined;
      
      try {
        return new Date(dateString);
      } catch (error) {
        return undefined;
      }
    };
    
    // Helper to map interest/fit levels
    const mapLevel = (value: string): string => {
      if (!value) return 'Medium';
      const lowerValue = value.toLowerCase();
      if (lowerValue.includes('high')) return 'High';
      if (lowerValue.includes('med')) return 'Medium';
      if (lowerValue.includes('low')) return 'Low';
      return 'Medium';
    };
    
    // Get contact mapping (to link deals to contacts)
    // We'll search by both Box Key and Company name
    const allContacts = await db.select().from(contacts);
    const companyToContactMap = new Map();
    const boxKeyToContactMap = new Map();
    
    allContacts.forEach(contact => {
      // Map by company name
      if (contact.company) {
        companyToContactMap.set(contact.company.toLowerCase(), contact.id);
      }
      
      // Map by Box Key - this is our primary joining method
      if (contact.boxKey) {
        boxKeyToContactMap.set(contact.boxKey, contact.id);
      }
    });
    
    // Map CSV fields to our schema
    const dealsToInsert: InsertDeal[] = records
      .filter((record: any) => record['Name']) // Ensure name exists
      .map((record: any) => {
        const companyName = record['Name'] || '';
        
        // Try to find a contact by Box Key first (primary join method)
        let contactId = defaultContactId;
        const boxKey = record['Box Key'] || '';
        
        if (boxKey && boxKeyToContactMap.has(boxKey)) {
          // Box Key match found - this is the most reliable method
          contactId = boxKeyToContactMap.get(boxKey);
          console.log(`Matched deal ${companyName} to contact by Box Key: ${boxKey}`);
        } 
        // Fall back to company name matching
        else if (companyName && companyToContactMap.has(companyName.toLowerCase())) {
          contactId = companyToContactMap.get(companyName.toLowerCase());
          console.log(`Matched deal ${companyName} to contact by company name`);
        }
        
        // Get date of last contact
        let lastContactedAt: Date | undefined;
        if (record['Date of Last Email']) {
          lastContactedAt = parseDate(record['Date of Last Email']);
        }
        
        // Try to parse the value if it exists
        let dealValue = 0;
        if (record['Value'] && !isNaN(parseFloat(record['Value']))) {
          dealValue = parseFloat(record['Value']);
        }
        
        return {
          name: companyName || 'Unknown Deal',
          contactId,
          stageId: mapStageId(record['Stage']),
          value: dealValue,
          description: '',
          notes: record['Notes'] || '',
          done: record['Done'] === 'Checked' || false,
          nextSteps: record['Next Steps'] || '',
          thread: record['Thread'] || '',
          lastContactedAt,
          interest: mapLevel(record['Interest']),
          fit: mapLevel(record['Fit']),
          type: record['Type'] || '',
          persona: record['Persona'] || '',
          boxKey: record['Box Key'] || '',
          source: record['Source'] || '',
          tags: [],
          customFields: {},
          userId: userId
        };
      });
    
    console.log(`Prepared ${dealsToInsert.length} deals for import`);
    
    // Insert deals in batches
    const batchSize = 100;
    let successCount = 0;
    
    for (let i = 0; i < dealsToInsert.length; i += batchSize) {
      const batch = dealsToInsert.slice(i, i + batchSize);
      try {
        await db.insert(deals).values(batch);
        successCount += batch.length;
        console.log(`Imported batch ${i / batchSize + 1}: ${batch.length} deals`);
      } catch (error) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error);
      }
    }
    
    return successCount;
  } catch (error) {
    console.error('Error importing deals:', error);
    throw error;
  }
}

// Combined import function to process both contacts and deals together
export async function importCombinedData(contactsFilePath: string, dealsFilePath: string, userId: number): Promise<{contacts: number, deals: number}> {
  try {
    console.log('Starting combined import process');
    console.log('Contacts file:', contactsFilePath);
    console.log('Deals file:', dealsFilePath);
    
    // First import contacts
    const contactsCount = await importContactsFromCSV(contactsFilePath, userId);
    console.log(`Successfully imported ${contactsCount} contacts`);
    
    // Then import deals (which will now be able to reference the newly imported contacts)
    const dealsCount = await importDealsFromCSV(dealsFilePath, userId);
    console.log(`Successfully imported ${dealsCount} deals`);
    
    return {
      contacts: contactsCount,
      deals: dealsCount
    };
  } catch (error) {
    console.error('Error during combined import:', error);
    throw error;
  }
}

// Helper function to parse CSV content
async function parseCSV(csvContent: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      skip_records_with_empty_values: true
    }, (err, records) => {
      if (err) {
        reject(err);
      } else {
        resolve(records);
      }
    });
  });
}