import { parse } from 'csv-parse';
import { readFileSync } from 'fs';
import { contacts, deals, InsertContact, InsertDeal } from '../shared/schema';
import { db } from './db';
import path from 'path';

// Process the contacts CSV file (Streak Export - Contacts)
export async function importContactsFromCSV(filePath: string, userId: number): Promise<number> {
  try {
    const csvContent = readFileSync(filePath, 'utf8');
    const records = await parseCSV(csvContent);
    
    if (!records || records.length === 0) {
      throw new Error('No valid contact records found in CSV file');
    }
    
    // Map CSV fields to our schema
    const contactsToInsert: InsertContact[] = records.map((record: any) => {
      const name = record['Contact Name'] || '';
      const [firstName, ...restName] = name.split(' ');
      const lastName = restName.join(' ');
      
      return {
        name: name || 'Unknown',
        firstName: firstName || '',
        lastName: lastName || '',
        email: record['Email'] || '',
        phone: record['Phone'] || '',
        company: record['Organization'] || record['Box Name'] || 'Unknown Company',
        position: record['Title'] || '',
        notes: record['Notes'] || '',
        linkedIn: record['LinkedIn'] || '',
        city: record['City'] || '',
        state: record['State'] || '',
        country: record['Country'] || '',
        address: [record['City'], record['State'], record['Country']].filter(Boolean).join(', '),
        source: record['Source'] || '',
        boxKey: record['Key'] || '',
        customFields: record['Custom Fields'] ? JSON.parse(record['Custom Fields']) : {},
        tags: record['Tags'] ? record['Tags'].split(',').map((tag: string) => tag.trim()) : [],
      };
    });
    
    // Insert contacts
    const result = await db.insert(contacts).values(contactsToInsert);
    return contactsToInsert.length;
  } catch (error) {
    console.error('Error importing contacts:', error);
    throw error;
  }
}

// Process the boxes CSV file (Streak Export - Boxes)
export async function importDealsFromCSV(filePath: string, userId: number): Promise<number> {
  try {
    const csvContent = readFileSync(filePath, 'utf8');
    const records = await parseCSV(csvContent);
    
    if (!records || records.length === 0) {
      throw new Error('No valid deal records found in CSV file');
    }
    
    // Get all contacts to link them to deals
    const contactsData = await db.select().from(contacts);
    
    // Get all stages to link them to deals
    const stagesData = await db.select().from(dealStages);
    const stageMap = new Map();
    stagesData.forEach(stage => {
      stageMap.set(stage.name.toLowerCase(), stage.id);
    });
    
    // Map stage names from Streak to our stages
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
      if (lowerStageName.includes('schedule')) return stageMap.get('call scheduled') || 1;
      if (lowerStageName.includes('connect')) return stageMap.get('connected') || 1;
      if (lowerStageName.includes('engage')) return stageMap.get('engaged') || 1;
      if (lowerStageName.includes('proposal')) return stageMap.get('proposal sent') || 1;
      if (lowerStageName.includes('won')) return stageMap.get('won') || 1;
      if (lowerStageName.includes('later')) return stageMap.get('later stage') || 1;
      if (lowerStageName.includes('recycl')) return stageMap.get('recycled') || 1;
      
      return 1; // Default to first stage
    };
    
    // Helper to find a contact by name or create a placeholder
    const findContactId = (name: string): number => {
      const contact = contactsData.find(c => c.name === name);
      return contact ? contact.id : 1; // Use first contact if not found
    };
    
    // Map CSV fields to our schema
    const dealsToInsert: InsertDeal[] = records
      .filter((record: any) => record['Box Name']) // Ensure box name exists
      .map((record: any) => {
        const contactName = record['Assigned to Contact'] || ''; 
        const contactId = findContactId(contactName);
        
        // Map interest and fit to our schema format (Low, Medium, High)
        const mapLevel = (value: string): string => {
          if (!value) return 'Medium';
          const lowerValue = value.toLowerCase();
          if (lowerValue.includes('high') || lowerValue.includes('3')) return 'High';
          if (lowerValue.includes('med') || lowerValue.includes('2')) return 'Medium';
          if (lowerValue.includes('low') || lowerValue.includes('1')) return 'Low';
          return 'Medium';
        };
        
        return {
          name: record['Box Name'] || 'Unknown Deal',
          contactId,
          stageId: mapStageId(record['Stage']),
          value: parseFloat(record['Value'] || '0') || 0,
          description: record['Description'] || '',
          notes: record['Notes'] || '',
          done: record['Done'] === 'true' || record['Done'] === 'yes' || false,
          nextSteps: record['Next Steps'] || '',
          thread: record['Thread URL'] || '',
          lastContactedAt: record['Last Contacted Date'] ? new Date(record['Last Contacted Date']) : undefined,
          interest: mapLevel(record['Interest']),
          fit: mapLevel(record['Fit']),
          type: record['Type'] || '',
          persona: record['Persona'] || '',
          boxKey: record['Key'] || '',
          source: record['Source'] || '',
          tags: record['Tags'] ? record['Tags'].split(',').map((tag: string) => tag.trim()) : [],
          customFields: record['Custom Fields'] ? JSON.parse(record['Custom Fields']) : {},
        };
      });
    
    // Insert deals
    const result = await db.insert(deals).values(dealsToInsert);
    return dealsToInsert.length;
  } catch (error) {
    console.error('Error importing deals:', error);
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