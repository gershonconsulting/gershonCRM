import { eq, desc, and, or, isNull, sql } from "drizzle-orm";
import {
  User, Contact, Deal, Task, Activity, DealStage,
  InsertUser, InsertContact, InsertDeal, InsertTask, InsertActivity, InsertDealStage,
  DealWithContact, TaskWithRelations, ActivityWithRelations,
  users, contacts, deals, tasks, activities, dealStages
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";

export class DatabaseStorage implements IStorage {
  
  // Initialize default stages based on the provided image
  async initializeDefaultStages(): Promise<void> {
    const existingStages = await db.select().from(dealStages);
    
    if (existingStages.length === 0) {
      // Pipeline has these stages: Lead, Contacted, Reccommend By QC, Call Scheduled, Connected, Engaged, Proposal Sent, WON, Later Stage, Recycled
      const stagesToCreate = [
        { name: "Lead", order: 1, color: "#e74c3c", probability: 0, count: 0 },
        { name: "Contacted", order: 2, color: "#e67e22", probability: 10, count: 0 },
        { name: "Reccommend By QC", order: 3, color: "#f39c12", probability: 20, count: 0 },
        { name: "Call Scheduled", order: 4, color: "#f1c40f", probability: 30, count: 0 },
        { name: "Connected", order: 5, color: "#2ecc71", probability: 40, count: 0 },
        { name: "Engaged", order: 6, color: "#27ae60", probability: 60, count: 0 },
        { name: "Proposal Sent", order: 7, color: "#3498db", probability: 80, count: 0 },
        { name: "WON", order: 8, color: "#2980b9", probability: 100, count: 0 },
        { name: "Later Stage", order: 9, color: "#8e44ad", probability: 50, count: 0 },
        { name: "Recycled", order: 10, color: "#95a5a6", probability: 0, count: 0 }
      ];
      
      for (const stage of stagesToCreate) {
        await db.insert(dealStages).values(stage);
      }
    }
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(contacts.name);
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updatedContact] = await db
      .update(contacts)
      .set(contact)
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    await db.delete(contacts).where(eq(contacts.id, id));
    return true;
  }

  // Deal Stages
  async getDealStages(): Promise<DealStage[]> {
    return await db.select().from(dealStages).orderBy(dealStages.order);
  }

  async getDealStage(id: number): Promise<DealStage | undefined> {
    const [stage] = await db.select().from(dealStages).where(eq(dealStages.id, id));
    return stage;
  }

  async createDealStage(stage: InsertDealStage): Promise<DealStage> {
    const [newStage] = await db.insert(dealStages).values(stage).returning();
    return newStage;
  }

  async updateDealStage(id: number, stage: Partial<InsertDealStage>): Promise<DealStage | undefined> {
    const [updatedStage] = await db
      .update(dealStages)
      .set(stage)
      .where(eq(dealStages.id, id))
      .returning();
    return updatedStage;
  }

  async deleteDealStage(id: number): Promise<boolean> {
    await db.delete(dealStages).where(eq(dealStages.id, id));
    return true;
  }

  // Deals
  async getDeals(): Promise<DealWithContact[]> {
    const result = await db
      .select({
        deal: deals,
        contact: contacts,
        stage: dealStages
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contactId, contacts.id))
      .leftJoin(dealStages, eq(deals.stageId, dealStages.id))
      .orderBy(desc(deals.createdAt));

    return result.map(({ deal, contact, stage }) => ({
      ...deal,
      contact,
      stage
    }));
  }

  async getDeal(id: number): Promise<DealWithContact | undefined> {
    const [result] = await db
      .select({
        deal: deals,
        contact: contacts,
        stage: dealStages
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contactId, contacts.id))
      .leftJoin(dealStages, eq(deals.stageId, dealStages.id))
      .where(eq(deals.id, id));

    if (!result) return undefined;
    
    return {
      ...result.deal,
      contact: result.contact,
      stage: result.stage
    };
  }

  async getDealsByStage(stageId: number): Promise<DealWithContact[]> {
    const result = await db
      .select({
        deal: deals,
        contact: contacts,
        stage: dealStages
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contactId, contacts.id))
      .leftJoin(dealStages, eq(deals.stageId, dealStages.id))
      .where(eq(deals.stageId, stageId))
      .orderBy(desc(deals.createdAt));

    return result.map(({ deal, contact, stage }) => ({
      ...deal,
      contact,
      stage
    }));
  }

  async createDeal(deal: InsertDeal): Promise<DealWithContact> {
    const [newDeal] = await db
      .insert(deals)
      .values({
        ...deal,
        createdAt: new Date()
      })
      .returning();

    const contact = await this.getContact(newDeal.contactId);
    const stage = await this.getDealStage(newDeal.stageId);

    return {
      ...newDeal,
      contact,
      stage
    };
  }

  async updateDeal(id: number, deal: Partial<InsertDeal>): Promise<DealWithContact | undefined> {
    const [updatedDeal] = await db
      .update(deals)
      .set(deal)
      .where(eq(deals.id, id))
      .returning();

    if (!updatedDeal) return undefined;

    const contact = await this.getContact(updatedDeal.contactId);
    const stage = await this.getDealStage(updatedDeal.stageId);

    return {
      ...updatedDeal,
      contact,
      stage
    };
  }

  async deleteDeal(id: number): Promise<boolean> {
    await db.delete(deals).where(eq(deals.id, id));
    return true;
  }

  // Tasks
  async getTasks(): Promise<TaskWithRelations[]> {
    const result = await db
      .select({
        task: tasks,
        contact: contacts,
        deal: deals
      })
      .from(tasks)
      .leftJoin(contacts, eq(tasks.contactId, contacts.id))
      .leftJoin(deals, eq(tasks.dealId, deals.id))
      .orderBy(desc(tasks.createdAt));

    return result.map(({ task, contact, deal }) => ({
      ...task,
      contact,
      deal
    }));
  }

  async getTask(id: number): Promise<TaskWithRelations | undefined> {
    const [result] = await db
      .select({
        task: tasks,
        contact: contacts,
        deal: deals
      })
      .from(tasks)
      .leftJoin(contacts, eq(tasks.contactId, contacts.id))
      .leftJoin(deals, eq(tasks.dealId, deals.id))
      .where(eq(tasks.id, id));

    if (!result) return undefined;
    
    return {
      ...result.task,
      contact: result.contact,
      deal: result.deal
    };
  }

  async getTasksByContact(contactId: number): Promise<TaskWithRelations[]> {
    const result = await db
      .select({
        task: tasks,
        contact: contacts,
        deal: deals
      })
      .from(tasks)
      .leftJoin(contacts, eq(tasks.contactId, contacts.id))
      .leftJoin(deals, eq(tasks.dealId, deals.id))
      .where(eq(tasks.contactId, contactId))
      .orderBy(desc(tasks.createdAt));

    return result.map(({ task, contact, deal }) => ({
      ...task,
      contact,
      deal
    }));
  }

  async getTasksByDeal(dealId: number): Promise<TaskWithRelations[]> {
    const result = await db
      .select({
        task: tasks,
        contact: contacts,
        deal: deals
      })
      .from(tasks)
      .leftJoin(contacts, eq(tasks.contactId, contacts.id))
      .leftJoin(deals, eq(tasks.dealId, deals.id))
      .where(eq(tasks.dealId, dealId))
      .orderBy(desc(tasks.createdAt));

    return result.map(({ task, contact, deal }) => ({
      ...task,
      contact,
      deal
    }));
  }

  async createTask(task: InsertTask): Promise<TaskWithRelations> {
    const [newTask] = await db
      .insert(tasks)
      .values({
        ...task,
        createdAt: new Date()
      })
      .returning();

    const contact = task.contactId ? await this.getContact(task.contactId) : undefined;
    const deal = task.dealId ? await this.getDeal(task.dealId) : undefined;

    return {
      ...newTask,
      contact,
      deal
    };
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<TaskWithRelations | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(task)
      .where(eq(tasks.id, id))
      .returning();

    if (!updatedTask) return undefined;

    const contact = updatedTask.contactId ? await this.getContact(updatedTask.contactId) : undefined;
    const deal = updatedTask.dealId ? await this.getDeal(updatedTask.dealId) : undefined;

    return {
      ...updatedTask,
      contact,
      deal
    };
  }

  async deleteTask(id: number): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.id, id));
    return true;
  }

  // Activities
  async getActivities(): Promise<ActivityWithRelations[]> {
    const result = await db
      .select({
        activity: activities,
        contact: contacts,
        deal: deals
      })
      .from(activities)
      .leftJoin(contacts, eq(activities.contactId, contacts.id))
      .leftJoin(deals, eq(activities.dealId, deals.id))
      .orderBy(desc(activities.createdAt));

    return result.map(({ activity, contact, deal }) => ({
      ...activity,
      contact,
      deal
    }));
  }

  async getActivity(id: number): Promise<ActivityWithRelations | undefined> {
    const [result] = await db
      .select({
        activity: activities,
        contact: contacts,
        deal: deals
      })
      .from(activities)
      .leftJoin(contacts, eq(activities.contactId, contacts.id))
      .leftJoin(deals, eq(activities.dealId, deals.id))
      .where(eq(activities.id, id));

    if (!result) return undefined;
    
    return {
      ...result.activity,
      contact: result.contact,
      deal: result.deal
    };
  }

  async getActivitiesByContact(contactId: number): Promise<ActivityWithRelations[]> {
    const result = await db
      .select({
        activity: activities,
        contact: contacts,
        deal: deals
      })
      .from(activities)
      .leftJoin(contacts, eq(activities.contactId, contacts.id))
      .leftJoin(deals, eq(activities.dealId, deals.id))
      .where(eq(activities.contactId, contactId))
      .orderBy(desc(activities.createdAt));

    return result.map(({ activity, contact, deal }) => ({
      ...activity,
      contact,
      deal
    }));
  }

  async getActivitiesByDeal(dealId: number): Promise<ActivityWithRelations[]> {
    const result = await db
      .select({
        activity: activities,
        contact: contacts,
        deal: deals
      })
      .from(activities)
      .leftJoin(contacts, eq(activities.contactId, contacts.id))
      .leftJoin(deals, eq(activities.dealId, deals.id))
      .where(eq(activities.dealId, dealId))
      .orderBy(desc(activities.createdAt));

    return result.map(({ activity, contact, deal }) => ({
      ...activity,
      contact,
      deal
    }));
  }

  async createActivity(activity: InsertActivity): Promise<ActivityWithRelations> {
    const [newActivity] = await db
      .insert(activities)
      .values({
        ...activity,
        createdAt: new Date()
      })
      .returning();

    const contact = activity.contactId ? await this.getContact(activity.contactId) : undefined;
    const deal = activity.dealId ? await this.getDeal(activity.dealId) : undefined;

    return {
      ...newActivity,
      contact,
      deal
    };
  }

  async deleteActivity(id: number): Promise<boolean> {
    await db.delete(activities).where(eq(activities.id, id));
    return true;
  }

  // User Management
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        createdAt: new Date(),
        isActive: true,
        lastLogin: null
      })
      .returning();
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }
  
  // Dashboard Stats
  async getDashboardStats(): Promise<{
    activeDeals: number;
    pipelineValue: number;
    winRate: number;
    newContacts: number;
  }> {
    try {
      // Simply count all deals for now as activeDeals
      const [activeDealsResult] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(deals);
      
      // Pipeline value (sum of all deals)
      const [pipelineValueResult] = await db
        .select({ sum: sql`COALESCE(sum(${deals.value}), 0)`.mapWith(Number) })
        .from(deals);
      
      // Win rate calculation - simplify for now
      const [totalDealsResult] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(deals);
      
      // Count deals in WON stage
      const wonStage = await db
        .select()
        .from(dealStages)
        .where(eq(dealStages.name, 'WON'));
      
      let wonDeals = 0;
      if (wonStage.length > 0) {
        const [wonResult] = await db
          .select({ count: sql`count(*)`.mapWith(Number) })
          .from(deals)
          .where(eq(deals.stageId, wonStage[0].id));
        
        wonDeals = wonResult?.count || 0;
      }
      
      // Count all contacts
      const [newContactsResult] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(contacts);
      
      const activeDeals = activeDealsResult?.count || 0;
      const pipelineValue = pipelineValueResult?.sum || 0;
      const totalDeals = totalDealsResult?.count || 0;
      const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;
      const newContacts = newContactsResult?.count || 0;
      
      return {
        activeDeals,
        pipelineValue,
        winRate,
        newContacts
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      // Return default values if there's an error
      return {
        activeDeals: 0,
        pipelineValue: 0,
        winRate: 0,
        newContacts: 0
      };
    }
  }
}