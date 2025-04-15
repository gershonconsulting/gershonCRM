import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db';
import { contacts, deals, dealStages } from '@shared/schema';
import { InsertContact, InsertDeal, InsertDealStage } from '@shared/schema';

/**
 * Loads initial data from CSV files into the database
 */
export async function loadInitialData() {
  console.log("Starting to load initial data from CSV files...");
  
  try {
    // Get the directory name in ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const rootDir = path.join(__dirname, '..');
    
    // Define file paths
    const contactsFilePath = path.join(rootDir, 'attached_assets/Streak Export_ MAbSilico - LG (4-14-25, 3_32 PM) - Contacts (MAbSilico - LG).csv');
    const boxesFilePath = path.join(rootDir, 'attached_assets/Streak Export_ MAbSilico - LG (4-14-25, 3_32 PM) - Boxes (MAbSilico - LG).csv');
    
    // Check if files exist
    if (!fs.existsSync(contactsFilePath)) {
      throw new Error(`Contacts file not found at: ${contactsFilePath}`);
    }
    
    if (!fs.existsSync(boxesFilePath)) {
      throw new Error(`Boxes file not found at: ${boxesFilePath}`);
    }
    
    // Read and parse CSV files
    const contactsContent = fs.readFileSync(contactsFilePath, 'utf8');
    const boxesContent = fs.readFileSync(boxesFilePath, 'utf8');
    
    const contactsRecords = parse(contactsContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });
    
    const boxesRecords = parse(boxesContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });
    
    console.log(`Parsed ${contactsRecords.length} contacts and ${boxesRecords.length} boxes`);
    
    // Process and store stages first
    const stageMap = new Map();
    const stageSets = new Set<string>();
    
    boxesRecords.forEach((record: any) => {
      if (record.Stage && typeof record.Stage === 'string') {
        stageSets.add(record.Stage);
      }
    });
    
    const stageNames = Array.from(stageSets);
    
    // Create default colors for stages
    const stageColors = [
      "#FF5630", // Lead - red
      "#FCA44C", // Contacted - orange
      "#C054BE", // Recommend By QC - purple
      "#4C9AFF", // Call Scheduled - blue
      "#FFAB00", // Connected - yellow
      "#36B37E", // Engaged - green
      "#00B8D9", // Proposal Sent - cyan
      "#00875A", // WON - green
      "#253858", // Later Stage - dark blue
      "#505F79"  // Recycled - gray
    ];
    
    // First delete all existing data
    console.log("Deleting existing data...");
    await db.delete(deals);
    await db.delete(contacts);
    await db.delete(dealStages);
    
    // Create stages in order
    console.log("Creating stages...");
    for (let i = 0; i < stageNames.length; i++) {
      const stageName = stageNames[i];
      if (!stageName) continue;
      
      const count = boxesRecords.filter((r: any) => r.Stage === stageName).length;
      
      const stageData: InsertDealStage = {
        name: stageName,
        order: i + 1,
        color: stageColors[i % stageColors.length],
        probability: stageName === "WON" ? 100 : Math.max(10, Math.min(90, (i + 1) * 10)),
        count
      };
      
      try {
        const [stage] = await db.insert(dealStages).values(stageData).returning();
        stageMap.set(stageName, stage.id);
      } catch (error) {
        console.error(`Failed to create stage ${stageName}:`, error);
      }
    }
    
    // Process contacts
    console.log("Creating contacts...");
    const contactMap = new Map();
    for (const record of contactsRecords) {
      const contactData: InsertContact = {
        firstName: record["First Name"] || "",
        lastName: record["Last Name"] || "",
        name: `${record["First Name"] || ""} ${record["Last Name"] || ""}`.trim(),
        company: record["Box Name"] || "",
        position: record["Title"] || "",
        email: record["Email Addresses"] || "",
        phone: record["Phone Numbers"] || "",
        address: record["Addresses"] || "",
        city: "", 
        state: "",
        country: record["Country"] || "",
        source: "Streak Import",
        linkedIn: record["LinkedIn"] || "",
        twitterHandle: record["Twitter"] || "",
        facebookHandle: record["Facebook"] || "",
        instagramHandle: record["Instagram"] || "",
        status: "active",
        boxKey: record["Box Key"] || "",
        tags: []
      };
      
      try {
        const [contact] = await db.insert(contacts).values(contactData).returning();
        contactMap.set(record["Key"], contact.id);
        contactMap.set(record["Box Key"], contact.id); // Map both the contact key and box key
      } catch (error) {
        console.error(`Failed to create contact for ${contactData.name}:`, error);
      }
    }
    
    // Process boxes (deals)
    console.log("Creating deals...");
    let dealsCreated = 0;
    for (const record of boxesRecords) {
      // Find stage ID
      const stageId = stageMap.get(record.Stage);
      if (!stageId) {
        console.error(`Stage not found: ${record.Stage}`);
        continue;
      }
      
      // Find related contact (by box key)
      const boxKey = record["Box Key"];
      if (!boxKey) {
        console.error(`No box key for deal: ${record.Name}`);
        continue;
      }
      
      const contactId = contactMap.get(boxKey);
      
      if (!contactId) {
        console.error(`Contact not found for box key: ${boxKey}`);
        continue;
      }
      
      // Calculate value from the Value field if present, otherwise default to 0
      let value = 0;
      if (record.Value && !isNaN(parseFloat(record.Value))) {
        value = parseFloat(record.Value);
      }
      
      const dealData: InsertDeal = {
        name: record.Name || "",
        contactId: contactId,
        stageId: stageId,
        value: value,
        notes: record.Notes || "",
        description: "", 
        done: record.Done === "Checked",
        nextSteps: record["Next Steps"] || "",
        thread: record.Thread || "",
        source: record.Source || "",
        interest: record.Interest || "",
        fit: record.Fit || "",
        type: record.Type || "",
        persona: record.Persona || "",
        category: record.Category || "",
        daysInStage: parseInt(record["Days in Stage"] || "0"),
        emailThreadCount: parseInt(record["Email Thread Count"] || "0"),
        assignedTo: record["Assigned To"] || "",
        boxKey: boxKey,
        tags: []
      };
      
      try {
        await db.insert(deals).values(dealData);
        dealsCreated++;
      } catch (error) {
        console.error(`Failed to create deal for ${dealData.name}:`, error);
      }
    }
    
    console.log("Initial data loading completed successfully!");
    console.log(`Created: ${stageNames.length} stages, ${contactMap.size} contacts, ${dealsCreated} deals`);
    
    return {
      stages: stageNames.length,
      contacts: contactMap.size,
      deals: dealsCreated
    };
    
  } catch (error) {
    console.error("Failed to load initial data:", error);
    throw error;
  }
}