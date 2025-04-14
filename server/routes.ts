import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertContactSchema, 
  insertDealSchema, 
  insertTaskSchema, 
  insertActivitySchema,
  insertDealStageSchema,
  InsertContact,
  InsertDeal,
  InsertDealStage
} from "@shared/schema";
import { parse } from 'csv-parse/sync';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { importContactsFromCSV, importDealsFromCSV, importCombinedData } from './import-utils';

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../temp-uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed') as any);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API prefixed routes
  const api = "/api";

  // Dashboard statistics
  app.get(`${api}/dashboard/stats`, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Deal Stages CRUD
  app.get(`${api}/deal-stages`, async (req, res) => {
    try {
      const stages = await storage.getDealStages();
      res.json(stages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal stages" });
    }
  });

  app.get(`${api}/deal-stages/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stage = await storage.getDealStage(id);
      
      if (!stage) {
        return res.status(404).json({ message: "Deal stage not found" });
      }
      
      res.json(stage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal stage" });
    }
  });

  app.post(`${api}/deal-stages`, async (req, res) => {
    try {
      const validationResult = insertDealStageSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid deal stage data", 
          errors: validationResult.error.format() 
        });
      }
      
      const newStage = await storage.createDealStage(validationResult.data);
      res.status(201).json(newStage);
    } catch (error) {
      res.status(500).json({ message: "Failed to create deal stage" });
    }
  });

  app.put(`${api}/deal-stages/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validationResult = insertDealStageSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid deal stage data", 
          errors: validationResult.error.format() 
        });
      }
      
      const updatedStage = await storage.updateDealStage(id, validationResult.data);
      
      if (!updatedStage) {
        return res.status(404).json({ message: "Deal stage not found" });
      }
      
      res.json(updatedStage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update deal stage" });
    }
  });

  app.delete(`${api}/deal-stages/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDealStage(id);
      
      if (!success) {
        return res.status(404).json({ message: "Deal stage not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete deal stage" });
    }
  });

  // Contacts CRUD
  app.get(`${api}/contacts`, async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get(`${api}/contacts/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContact(id);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  app.post(`${api}/contacts`, async (req, res) => {
    try {
      const validationResult = insertContactSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid contact data", 
          errors: validationResult.error.format() 
        });
      }
      
      const newContact = await storage.createContact(validationResult.data);
      res.status(201).json(newContact);
    } catch (error) {
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.put(`${api}/contacts/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validationResult = insertContactSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid contact data", 
          errors: validationResult.error.format() 
        });
      }
      
      const updatedContact = await storage.updateContact(id, validationResult.data);
      
      if (!updatedContact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(updatedContact);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete(`${api}/contacts/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContact(id);
      
      if (!success) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Deals CRUD
  app.get(`${api}/deals`, async (req, res) => {
    try {
      const stageId = req.query.stageId ? parseInt(req.query.stageId as string) : undefined;
      
      if (stageId) {
        const deals = await storage.getDealsByStage(stageId);
        return res.json(deals);
      }
      
      const deals = await storage.getDeals();
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get(`${api}/deals/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deal = await storage.getDeal(id);
      
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.json(deal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  app.post(`${api}/deals`, async (req, res) => {
    try {
      const validationResult = insertDealSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid deal data", 
          errors: validationResult.error.format() 
        });
      }
      
      const newDeal = await storage.createDeal(validationResult.data);
      res.status(201).json(newDeal);
    } catch (error) {
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.put(`${api}/deals/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validationResult = insertDealSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid deal data", 
          errors: validationResult.error.format() 
        });
      }
      
      const updatedDeal = await storage.updateDeal(id, validationResult.data);
      
      if (!updatedDeal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.json(updatedDeal);
    } catch (error) {
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  app.delete(`${api}/deals/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDeal(id);
      
      if (!success) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  // Tasks CRUD
  app.get(`${api}/tasks`, async (req, res) => {
    try {
      const contactId = req.query.contactId ? parseInt(req.query.contactId as string) : undefined;
      const dealId = req.query.dealId ? parseInt(req.query.dealId as string) : undefined;
      
      if (contactId) {
        const tasks = await storage.getTasksByContact(contactId);
        return res.json(tasks);
      }
      
      if (dealId) {
        const tasks = await storage.getTasksByDeal(dealId);
        return res.json(tasks);
      }
      
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get(`${api}/tasks/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post(`${api}/tasks`, async (req, res) => {
    try {
      const validationResult = insertTaskSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid task data", 
          errors: validationResult.error.format() 
        });
      }
      
      const newTask = await storage.createTask(validationResult.data);
      res.status(201).json(newTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put(`${api}/tasks/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validationResult = insertTaskSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid task data", 
          errors: validationResult.error.format() 
        });
      }
      
      const updatedTask = await storage.updateTask(id, validationResult.data);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete(`${api}/tasks/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTask(id);
      
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Activities CRUD
  app.get(`${api}/activities`, async (req, res) => {
    try {
      const contactId = req.query.contactId ? parseInt(req.query.contactId as string) : undefined;
      const dealId = req.query.dealId ? parseInt(req.query.dealId as string) : undefined;
      
      if (contactId) {
        const activities = await storage.getActivitiesByContact(contactId);
        return res.json(activities);
      }
      
      if (dealId) {
        const activities = await storage.getActivitiesByDeal(dealId);
        return res.json(activities);
      }
      
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get(`${api}/activities/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activity = await storage.getActivity(id);
      
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.post(`${api}/activities`, async (req, res) => {
    try {
      const validationResult = insertActivitySchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid activity data", 
          errors: validationResult.error.format() 
        });
      }
      
      const newActivity = await storage.createActivity(validationResult.data);
      res.status(201).json(newActivity);
    } catch (error) {
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.delete(`${api}/activities/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteActivity(id);
      
      if (!success) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // File Upload Endpoints
  app.post(`${api}/import/contacts`, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // TODO: Get actual user ID from auth system
      const userId = 1;
      
      const count = await importContactsFromCSV(req.file.path, userId);
      
      // Clean up the temporary file
      fs.unlinkSync(req.file.path);
      
      res.status(200).json({ 
        message: `Successfully imported ${count} contacts`,
        count
      });
    } catch (error) {
      console.error('Error importing contacts:', error);
      // Create a more detailed error response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      
      res.status(500).json({ 
        message: 'Failed to import contacts', 
        error: errorMessage,
        details: errorStack,
        fileReceived: req.file ? true : false,
        fileName: req.file ? req.file.originalname : 'No file',
        fileSize: req.file ? req.file.size : 0
      });
    }
  });
  
  app.post(`${api}/import/deals`, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // TODO: Get actual user ID from auth system
      const userId = 1;
      
      const count = await importDealsFromCSV(req.file.path, userId);
      
      // Clean up the temporary file
      fs.unlinkSync(req.file.path);
      
      res.status(200).json({ 
        message: `Successfully imported ${count} deals`,
        count
      });
    } catch (error) {
      console.error('Error importing deals:', error);
      // Create a more detailed error response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      
      res.status(500).json({ 
        message: 'Failed to import deals', 
        error: errorMessage,
        details: errorStack,
        fileReceived: req.file ? true : false,
        fileName: req.file ? req.file.originalname : 'No file',
        fileSize: req.file ? req.file.size : 0
      });
    }
  });
  
  // Combined import endpoint (both contacts and deals)
  app.post(`${api}/import/combined`, upload.fields([
    { name: 'contactsFile', maxCount: 1 },
    { name: 'dealsFile', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files || !files.contactsFile || !files.dealsFile) {
        return res.status(400).json({ 
          message: 'Missing files. Both contacts and deals files are required.',
          filesReceived: files ? Object.keys(files) : []
        });
      }
      
      const contactsFile = files.contactsFile[0];
      const dealsFile = files.dealsFile[0];
      
      if (!contactsFile || !dealsFile) {
        return res.status(400).json({ 
          message: 'Missing required files',
          contactsFile: contactsFile ? true : false,
          dealsFile: dealsFile ? true : false
        });
      }
      
      // TODO: Get actual user ID from auth system
      const userId = 1;
      
      console.log('Processing combined import:');
      console.log('Contacts file:', contactsFile.originalname);
      console.log('Deals file:', dealsFile.originalname);
      
      const result = await importCombinedData(contactsFile.path, dealsFile.path, userId);
      
      // Clean up the temporary files
      fs.unlinkSync(contactsFile.path);
      fs.unlinkSync(dealsFile.path);
      
      res.status(200).json({ 
        message: `Successfully imported ${result.contacts} contacts and ${result.deals} deals`,
        ...result
      });
    } catch (error) {
      console.error('Error during combined import:', error);
      // Create a more detailed error response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      
      res.status(500).json({ 
        message: 'Failed to import data', 
        error: errorMessage,
        details: errorStack,
        filesReceived: req.files ? Object.keys(req.files) : []
      });
    }
  });
  
  // Data Import Endpoints (JSON-based)
  app.post(`${api}/import/streak-data`, async (req, res) => {
    try {
      const { boxesData, contactsData } = req.body;
      
      if (!boxesData || !contactsData) {
        return res.status(400).json({ message: "Missing required data" });
      }

      // Parse CSV data from request
      const boxesRecords = parse(boxesData, {
        columns: true,
        skip_empty_lines: true
      });
      
      const contactsRecords = parse(contactsData, {
        columns: true,
        skip_empty_lines: true
      });

      // Process and store stages first
      const stageMap = new Map();
      const stageNames = Array.from(new Set(boxesRecords.map((record: any) => record.Stage)));
      
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
      
      // Create stages in order
      for (let i = 0; i < stageNames.length; i++) {
        const stageName = stageNames[i];
        const stageData: InsertDealStage = {
          name: stageName,
          order: i + 1,
          color: stageColors[i % stageColors.length],
          probability: stageName === "WON" ? 100 : Math.max(10, Math.min(90, (i + 1) * 10)),
          count: boxesRecords.filter((r: any) => r.Stage === stageName).length
        };
        
        try {
          const stage = await storage.createDealStage(stageData);
          stageMap.set(stageName, stage.id);
        } catch (error) {
          console.error(`Failed to create stage ${stageName}:`, error);
        }
      }
      
      // Process contacts
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
          city: "", // These would need to be parsed from the address
          state: "",
          country: "",
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
          const contact = await storage.createContact(contactData);
          contactMap.set(record["Key"], contact.id);
          contactMap.set(record["Box Key"], contact.id); // Map both the contact key and box key
        } catch (error) {
          console.error(`Failed to create contact for ${contactData.name}:`, error);
        }
      }
      
      // Process boxes (deals)
      for (const record of boxesRecords) {
        // Find stage ID
        const stageId = stageMap.get(record.Stage);
        if (!stageId) {
          console.error(`Stage not found: ${record.Stage}`);
          continue;
        }
        
        // Find related contact (by box key)
        const boxKey = record["Box Key"];
        const contactId = contactMap.get(boxKey);
        
        if (!contactId) {
          console.error(`Contact not found for box key: ${boxKey}`);
          continue;
        }
        
        const dealData: InsertDeal = {
          name: record.Name || "",
          contactId: contactId,
          stageId: stageId,
          value: 0, // Default value
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
          await storage.createDeal(dealData);
        } catch (error) {
          console.error(`Failed to create deal for ${dealData.name}:`, error);
        }
      }
      
      res.status(200).json({ 
        message: "Import completed successfully",
        stats: {
          stages: stageNames.length,
          contacts: contactMap.size,
          deals: boxesRecords.length
        }
      });
      
    } catch (error) {
      console.error("Import error:", error);
      // Create a more detailed error response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      
      res.status(500).json({ 
        message: "Failed to import data", 
        error: errorMessage,
        details: errorStack,
        boxesDataReceived: !!req.body.boxesData,
        contactsDataReceived: !!req.body.contactsData,
        boxesDataSize: req.body.boxesData ? req.body.boxesData.length : 0,
        contactsDataSize: req.body.contactsData ? req.body.contactsData.length : 0
      });
    }
  });

  return httpServer;
}
