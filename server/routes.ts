import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertContactSchema, 
  insertDealSchema, 
  insertTaskSchema, 
  insertActivitySchema,
  insertDealStageSchema 
} from "@shared/schema";

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

  return httpServer;
}
