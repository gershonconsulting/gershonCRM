import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Contact schema
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  notes: text("notes"),
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  email: true,
  phone: true,
  company: true,
  position: true,
  notes: true,
});

// Deal stages
export const dealStages = pgTable("deal_stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color").notNull(),
  probability: integer("probability").notNull(),
});

export const insertDealStageSchema = createInsertSchema(dealStages).pick({
  name: true,
  order: true,
  color: true,
  probability: true,
});

// Deals schema
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactId: integer("contact_id").notNull(),
  stageId: integer("stage_id").notNull(),
  value: doublePrecision("value").notNull(),
  description: text("description"),
  nextSteps: text("next_steps"),
  createdAt: timestamp("created_at").notNull(),
});

export const insertDealSchema = createInsertSchema(deals).pick({
  name: true,
  contactId: true,
  stageId: true,
  value: true,
  description: true,
  nextSteps: true,
});

// Tasks schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date"),
  contactId: integer("contact_id"),
  dealId: integer("deal_id"),
  createdAt: timestamp("created_at").notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  completed: true,
  dueDate: true,
  contactId: true,
  dealId: true,
});

// Activity schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // email, call, meeting, note, deal_update, etc.
  description: text("description").notNull(),
  contactId: integer("contact_id"),
  dealId: integer("deal_id"),
  createdAt: timestamp("created_at").notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  description: true,
  contactId: true,
  dealId: true,
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
