import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Contact schema based on MAbSilico's Streak data
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  name: text("name").notNull(), // Combined name for display
  email: text("email"),
  phone: text("phone"),
  company: text("company").notNull(), // Box Name in Streak
  position: text("position"), // Title in Streak
  notes: text("notes"),
  linkedIn: text("linked_in"),
  address: text("address"), // City, State, Country from Streak
  city: text("city"),
  state: text("state"),
  country: text("country"),
  source: text("source"), // Source from Streak
  status: text("status").default("active"),
  twitterHandle: text("twitter_handle"),
  facebookHandle: text("facebook_handle"),
  instagramHandle: text("instagram_handle"),
  domain: text("domain"), // Company domain
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastContactedAt: timestamp("last_contacted_at"),
  boxKey: text("box_key"), // Streak Box Key
  customFields: jsonb("custom_fields"),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

// Deal stages based on MAbSilico's pipeline
export const dealStages = pgTable("deal_stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color").notNull(),
  probability: integer("probability").notNull(),
  count: integer("count").default(0), // To track number of deals in this stage
});

export const insertDealStageSchema = createInsertSchema(dealStages).omit({
  id: true,
  count: true,
});

// Deals schema based on MAbSilico's Streak data
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Company/Organization name
  contactId: integer("contact_id").notNull(),
  stageId: integer("stage_id").notNull(),
  value: doublePrecision("value").default(0),
  description: text("description"),
  notes: text("notes"),
  done: boolean("done").default(false), // "Done" field from Streak
  nextSteps: text("next_steps"),
  thread: text("thread"), // LinkedIn message thread URL
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastContactedAt: timestamp("last_contacted_at"),
  lastEmailDate: timestamp("last_email_date"),
  nextTaskDueDate: timestamp("next_task_due_date"),
  daysInStage: integer("days_in_stage").default(0),
  emailThreadCount: integer("email_thread_count").default(0),
  assignedTo: text("assigned_to"), // Email of assigned person
  closedAt: timestamp("closed_at"),
  interest: text("interest"), // Low/Medium/High from Streak
  fit: text("fit"), // Low/Medium/High from Streak
  type: text("type"),
  persona: text("persona"),
  category: text("category"),
  boxKey: text("box_key"), // Streak Box Key
  source: text("source"),
  tags: text("tags").array(),
  customFields: jsonb("custom_fields"),
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
});

// Tasks schema based on MAbSilico's Streak data
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date"),
  assignedTo: text("assigned_to"),
  priority: text("priority"), // Low, Medium, High
  contactId: integer("contact_id"),
  dealId: integer("deal_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reminderDate: timestamp("reminder_date"),
  completedAt: timestamp("completed_at"),
  category: text("category"), // For categorizing tasks
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Activity schema based on MAbSilico's Streak data
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // email, call, meeting, note, deal_update, etc.
  description: text("description").notNull(),
  contactId: integer("contact_id"),
  dealId: integer("deal_id"),
  emailSubject: text("email_subject"),
  emailContent: text("email_content"),
  direction: text("direction"), // inbound or outbound for communications
  createdAt: timestamp("created_at").notNull().defaultNow(),
  threadId: text("thread_id"), // For linking related activities
  createdBy: text("created_by"), // Email of person who created the activity
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type DealStage = typeof dealStages.$inferSelect;
export type InsertDealStage = z.infer<typeof insertDealStageSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Extended types with related data
export type DealWithContact = Deal & {
  contact: Contact;
  stage: DealStage;
};

export type TaskWithRelations = Task & {
  contact?: Contact;
  deal?: Deal;
};

export type ActivityWithRelations = Activity & {
  contact?: Contact;
  deal?: Deal;
};
