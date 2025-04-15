import {
  User, Contact, Deal, Task, Activity, DealStage,
  InsertUser, InsertContact, InsertDeal, InsertTask, InsertActivity, InsertDealStage,
  DealWithContact, TaskWithRelations, ActivityWithRelations,
} from "@shared/schema";
import { DatabaseStorage } from "./DatabaseStorage";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Deal Stages
  getDealStages(): Promise<DealStage[]>;
  getDealStage(id: number): Promise<DealStage | undefined>;
  createDealStage(stage: InsertDealStage): Promise<DealStage>;
  updateDealStage(id: number, stage: Partial<InsertDealStage>): Promise<DealStage | undefined>;
  deleteDealStage(id: number): Promise<boolean>;
  
  // Deals
  getDeals(): Promise<DealWithContact[]>;
  getDeal(id: number): Promise<DealWithContact | undefined>;
  getDealsByStage(stageId: number): Promise<DealWithContact[]>;
  createDeal(deal: InsertDeal): Promise<DealWithContact>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<DealWithContact | undefined>;
  deleteDeal(id: number): Promise<boolean>;
  
  // Tasks
  getTasks(): Promise<TaskWithRelations[]>;
  getTask(id: number): Promise<TaskWithRelations | undefined>;
  getTasksByContact(contactId: number): Promise<TaskWithRelations[]>;
  getTasksByDeal(dealId: number): Promise<TaskWithRelations[]>;
  createTask(task: InsertTask): Promise<TaskWithRelations>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<TaskWithRelations | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Activities
  getActivities(): Promise<ActivityWithRelations[]>;
  getActivity(id: number): Promise<ActivityWithRelations | undefined>;
  getActivitiesByContact(contactId: number): Promise<ActivityWithRelations[]>;
  getActivitiesByDeal(dealId: number): Promise<ActivityWithRelations[]>;
  createActivity(activity: InsertActivity): Promise<ActivityWithRelations>;
  deleteActivity(id: number): Promise<boolean>;
  
  // Dashboard Stats
  getDashboardStats(): Promise<{
    activeDeals: number;
    pipelineValue: number;
    winRate: number;
    newContacts: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<number, Contact>;
  private dealStages: Map<number, DealStage>;
  private deals: Map<number, Deal>;
  private tasks: Map<number, Task>;
  private activities: Map<number, Activity>;
  
  private userId: number;
  private contactId: number;
  private dealStageId: number;
  private dealId: number;
  private taskId: number;
  private activityId: number;
  
  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.dealStages = new Map();
    this.deals = new Map();
    this.tasks = new Map();
    this.activities = new Map();
    
    this.userId = 1;
    this.contactId = 1;
    this.dealStageId = 1;
    this.dealId = 1;
    this.taskId = 1;
    this.activityId = 1;
    
    // Initialize with default deal stages
    this.initializeDefaultStages();
    // Add some sample data
    this.addSampleData();
    // Add default users
    this.initializeDefaultUsers();
  }
  
  private initializeDefaultUsers() {
    // Create default admin user
    const adminUser: User = {
      id: this.userId++,
      username: "olivier",
      password: "$2a$10$XLEYVQOyNfhzd7KA9vEFGOJvt7fWbV.IuwOIjKLA5G50OISL2U9KG", // hashed "password"
      email: "olivier@example.com",
      firstName: "Olivier",
      lastName: "Admin",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
      company: "Gershon Consulting",
      position: "Admin"
    };
    this.users.set(adminUser.id, adminUser);
    
    // Create manager users
    const managerUsers = [
      {
        username: "joseph",
        email: "joseph@example.com",
        firstName: "Joseph",
        lastName: "Manager",
        role: "manager",
      },
      {
        username: "aina",
        email: "aina@example.com",
        firstName: "Aina",
        lastName: "Manager",
        role: "manager",
      },
      {
        username: "winnie",
        email: "winnie@example.com",
        firstName: "Winnie",
        lastName: "Manager",
        role: "manager",
      }
    ];
    
    managerUsers.forEach(user => {
      const newUser: User = {
        id: this.userId++,
        username: user.username,
        password: "$2a$10$XLEYVQOyNfhzd7KA9vEFGOJvt7fWbV.IuwOIjKLA5G50OISL2U9KG", // hashed "password"
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: true,
        createdAt: new Date(),
        lastLogin: null,
        company: "Gershon Consulting",
        position: "Manager"
      };
      this.users.set(newUser.id, newUser);
    });
    
    // Create client users
    const clientUsers = [
      {
        username: "zachary",
        email: "zachary@example.com",
        firstName: "Zachary",
        lastName: "Client",
        role: "client",
      },
      {
        username: "vincent",
        email: "vincent@example.com",
        firstName: "Vincent",
        lastName: "Client",
        role: "client",
      }
    ];
    
    clientUsers.forEach(user => {
      const newUser: User = {
        id: this.userId++,
        username: user.username,
        password: "$2a$10$XLEYVQOyNfhzd7KA9vEFGOJvt7fWbV.IuwOIjKLA5G50OISL2U9KG", // hashed "password"
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: true,
        createdAt: new Date(),
        lastLogin: null,
        company: "Client Company",
        position: "User"
      };
      this.users.set(newUser.id, newUser);
    });
  }
  
  private initializeDefaultStages() {
    const defaultStages = [
      { name: "New Leads", order: 1, color: "blue", probability: 25 },
      { name: "Contacted", order: 2, color: "indigo", probability: 40 },
      { name: "Qualified", order: 3, color: "purple", probability: 60 },
      { name: "Proposal", order: 4, color: "pink", probability: 75 },
      { name: "Won", order: 5, color: "green", probability: 100 },
    ];
    
    defaultStages.forEach(stage => {
      const id = this.dealStageId++;
      this.dealStages.set(id, { ...stage, id });
    });
  }
  
  private addSampleData() {
    // Add some sample contacts
    const contactIds = [];
    const sampleContacts = [
      { name: "Jane Cooper", email: "jane@acme.com", company: "Acme Corporation", position: "CTO" },
      { name: "Michael Foster", email: "michael@xyz.com", company: "XYZ Industries", position: "IT Director" },
      { name: "Tom Cook", email: "tom@globaltech.com", company: "Global Tech", position: "VP Operations" },
      { name: "Leslie Alexander", email: "leslie@stellar.com", company: "Stellar Systems", position: "CEO" },
      { name: "Blake Reid", email: "blake@meridian.com", company: "Meridian Partners", position: "CIO" },
      { name: "Lindsay Walton", email: "lindsay@innovate.com", company: "Innovate Inc", position: "Product Manager" },
      { name: "Courtney Henry", email: "courtney@techforward.com", company: "TechForward", position: "IT Manager" },
    ];
    
    sampleContacts.forEach(contact => {
      const id = this.contactId++;
      const newContact = { ...contact, id, phone: "", notes: "" };
      this.contacts.set(id, newContact);
      contactIds.push(id);
    });
    
    // Get stage IDs
    const stageIds = Array.from(this.dealStages.keys());
    
    // Add sample deals
    const dealDescriptions = [
      "Enterprise software solution for inventory management and logistics automation",
      "Security software implementation with advanced threat protection",
      "Cloud migration services for legacy infrastructure",
      "Data analytics platform with real-time reporting capabilities",
      "Digital transformation consulting",
      "Custom software development for internal operations",
      "IT infrastructure upgrade with cloud integration",
    ];
    
    const dealValues = [75000, 45000, 95000, 65000, 120000, 85000, 110000];
    
    contactIds.forEach((contactId, index) => {
      if (index < dealDescriptions.length) {
        const id = this.dealId++;
        const stageId = stageIds[Math.min(index % stageIds.length, stageIds.length - 1)];
        
        this.deals.set(id, {
          id,
          name: this.contacts.get(contactId)?.company || "Unknown Company",
          contactId,
          stageId,
          value: dealValues[index],
          description: dealDescriptions[index],
          nextSteps: "Schedule product demo, Send proposal",
          createdAt: new Date(),
        });
      }
    });
    
    // Add sample tasks
    const taskTitles = [
      "Call with Acme Corporation about proposal",
      "Send proposal to Stellar Systems",
      "Meeting with Global Tech team",
      "Follow up with XYZ Industries",
      "Prepare demo for Meridian Partners",
    ];
    
    taskTitles.forEach((title, index) => {
      const id = this.taskId++;
      const contactId = contactIds[index % contactIds.length];
      const dealIds = Array.from(this.deals.values())
        .filter(deal => deal.contactId === contactId)
        .map(deal => deal.id);
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + index);
      
      this.tasks.set(id, {
        id,
        title,
        completed: false,
        dueDate,
        contactId,
        dealId: dealIds.length > 0 ? dealIds[0] : undefined,
        createdAt: new Date(),
      });
    });
    
    // Add sample activities
    const activityTypes = ["email", "call", "meeting", "note", "deal_update"];
    const activityDescriptions = [
      "Sent an email about the proposal",
      "Had a call to discuss requirements",
      "Scheduled a meeting for product demo",
      "Added notes from client conversation",
      "Updated deal status to Qualified",
    ];
    
    for (let i = 0; i < 8; i++) {
      const id = this.activityId++;
      const contactId = contactIds[i % contactIds.length];
      const dealIds = Array.from(this.deals.values())
        .filter(deal => deal.contactId === contactId)
        .map(deal => deal.id);
      
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - i);
      
      this.activities.set(id, {
        id,
        type: activityTypes[i % activityTypes.length],
        description: activityDescriptions[i % activityDescriptions.length],
        contactId,
        dealId: dealIds.length > 0 ? dealIds[0] : undefined,
        createdAt,
      });
    }
  }
  
  // Contacts
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }
  
  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.contactId++;
    const newContact: Contact = { ...contact, id };
    this.contacts.set(id, newContact);
    return newContact;
  }
  
  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const existingContact = this.contacts.get(id);
    if (!existingContact) return undefined;
    
    const updatedContact = { ...existingContact, ...contact };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }
  
  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }
  
  // Deal Stages
  async getDealStages(): Promise<DealStage[]> {
    return Array.from(this.dealStages.values()).sort((a, b) => a.order - b.order);
  }
  
  async getDealStage(id: number): Promise<DealStage | undefined> {
    return this.dealStages.get(id);
  }
  
  async createDealStage(stage: InsertDealStage): Promise<DealStage> {
    const id = this.dealStageId++;
    const newStage: DealStage = { ...stage, id };
    this.dealStages.set(id, newStage);
    return newStage;
  }
  
  async updateDealStage(id: number, stage: Partial<InsertDealStage>): Promise<DealStage | undefined> {
    const existingStage = this.dealStages.get(id);
    if (!existingStage) return undefined;
    
    const updatedStage = { ...existingStage, ...stage };
    this.dealStages.set(id, updatedStage);
    return updatedStage;
  }
  
  async deleteDealStage(id: number): Promise<boolean> {
    return this.dealStages.delete(id);
  }
  
  // Deals
  async getDeals(): Promise<DealWithContact[]> {
    const deals = Array.from(this.deals.values());
    return deals.map(deal => this.populateDealRelations(deal));
  }
  
  async getDeal(id: number): Promise<DealWithContact | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    return this.populateDealRelations(deal);
  }
  
  async getDealsByStage(stageId: number): Promise<DealWithContact[]> {
    const deals = Array.from(this.deals.values()).filter(deal => deal.stageId === stageId);
    return deals.map(deal => this.populateDealRelations(deal));
  }
  
  async createDeal(deal: InsertDeal): Promise<DealWithContact> {
    const id = this.dealId++;
    const newDeal: Deal = { ...deal, id, createdAt: new Date() };
    this.deals.set(id, newDeal);
    return this.populateDealRelations(newDeal);
  }
  
  async updateDeal(id: number, deal: Partial<InsertDeal>): Promise<DealWithContact | undefined> {
    const existingDeal = this.deals.get(id);
    if (!existingDeal) return undefined;
    
    const updatedDeal = { ...existingDeal, ...deal };
    this.deals.set(id, updatedDeal);
    return this.populateDealRelations(updatedDeal);
  }
  
  async deleteDeal(id: number): Promise<boolean> {
    return this.deals.delete(id);
  }
  
  // Tasks
  async getTasks(): Promise<TaskWithRelations[]> {
    const tasks = Array.from(this.tasks.values());
    return tasks.map(task => this.populateTaskRelations(task))
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
  }
  
  async getTask(id: number): Promise<TaskWithRelations | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    return this.populateTaskRelations(task);
  }
  
  async getTasksByContact(contactId: number): Promise<TaskWithRelations[]> {
    const tasks = Array.from(this.tasks.values()).filter(task => task.contactId === contactId);
    return tasks.map(task => this.populateTaskRelations(task));
  }
  
  async getTasksByDeal(dealId: number): Promise<TaskWithRelations[]> {
    const tasks = Array.from(this.tasks.values()).filter(task => task.dealId === dealId);
    return tasks.map(task => this.populateTaskRelations(task));
  }
  
  async createTask(task: InsertTask): Promise<TaskWithRelations> {
    const id = this.taskId++;
    const newTask: Task = { ...task, id, createdAt: new Date() };
    this.tasks.set(id, newTask);
    return this.populateTaskRelations(newTask);
  }
  
  async updateTask(id: number, task: Partial<InsertTask>): Promise<TaskWithRelations | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...task };
    this.tasks.set(id, updatedTask);
    return this.populateTaskRelations(updatedTask);
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Activities
  async getActivities(): Promise<ActivityWithRelations[]> {
    const activities = Array.from(this.activities.values());
    return activities
      .map(activity => this.populateActivityRelations(activity))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getActivity(id: number): Promise<ActivityWithRelations | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;
    return this.populateActivityRelations(activity);
  }
  
  async getActivitiesByContact(contactId: number): Promise<ActivityWithRelations[]> {
    const activities = Array.from(this.activities.values()).filter(activity => activity.contactId === contactId);
    return activities.map(activity => this.populateActivityRelations(activity));
  }
  
  async getActivitiesByDeal(dealId: number): Promise<ActivityWithRelations[]> {
    const activities = Array.from(this.activities.values()).filter(activity => activity.dealId === dealId);
    return activities.map(activity => this.populateActivityRelations(activity));
  }
  
  async createActivity(activity: InsertActivity): Promise<ActivityWithRelations> {
    const id = this.activityId++;
    const newActivity: Activity = { ...activity, id, createdAt: new Date() };
    this.activities.set(id, newActivity);
    return this.populateActivityRelations(newActivity);
  }
  
  async deleteActivity(id: number): Promise<boolean> {
    return this.activities.delete(id);
  }
  
  // User management
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => a.username.localeCompare(b.username));
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { 
      ...user, 
      id, 
      createdAt: new Date(),
      lastLogin: null,
      isActive: true
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeDeals: number;
    pipelineValue: number;
    winRate: number;
    newContacts: number;
  }> {
    const deals = Array.from(this.deals.values());
    const totalDeals = deals.length;
    const wonDeals = deals.filter(
      deal => this.dealStages.get(deal.stageId)?.name === "Won"
    ).length;
    
    const pipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    
    const newContacts = Array.from(this.contacts.values()).length;
    
    return {
      activeDeals: totalDeals,
      pipelineValue,
      winRate: totalDeals ? Math.round((wonDeals / totalDeals) * 100) : 0,
      newContacts,
    };
  }
  
  // Helper methods to populate relations
  private populateDealRelations(deal: Deal): DealWithContact {
    const contact = this.contacts.get(deal.contactId);
    const stage = this.dealStages.get(deal.stageId);
    
    if (!contact || !stage) {
      throw new Error(`Deal ${deal.id} has invalid relations`);
    }
    
    return {
      ...deal,
      contact,
      stage,
    };
  }
  
  private populateTaskRelations(task: Task): TaskWithRelations {
    const result: TaskWithRelations = { ...task };
    
    if (task.contactId) {
      result.contact = this.contacts.get(task.contactId);
    }
    
    if (task.dealId) {
      result.deal = this.deals.get(task.dealId);
    }
    
    return result;
  }
  
  private populateActivityRelations(activity: Activity): ActivityWithRelations {
    const result: ActivityWithRelations = { ...activity };
    
    if (activity.contactId) {
      result.contact = this.contacts.get(activity.contactId);
    }
    
    if (activity.dealId) {
      result.deal = this.deals.get(activity.dealId);
    }
    
    return result;
  }
}

// Create a new DatabaseStorage instance
const dbStorage = new DatabaseStorage();

// Initialize deal stages based on the provided pipeline
dbStorage.initializeDefaultStages()
  .then(() => console.log('Default deal stages initialized'))
  .catch(error => console.error('Error initializing default deal stages:', error));

// Export the database storage instance
export const storage = dbStorage;
