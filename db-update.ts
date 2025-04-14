import { sql } from 'drizzle-orm';
import { db, pool } from './server/db';

async function updateDatabase() {
  try {
    console.log('Starting database update...');
    
    // Updating contacts table
    await db.execute(sql`
      ALTER TABLE contacts
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT,
      ADD COLUMN IF NOT EXISTS city TEXT,
      ADD COLUMN IF NOT EXISTS state TEXT, 
      ADD COLUMN IF NOT EXISTS country TEXT,
      ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
      ADD COLUMN IF NOT EXISTS facebook_handle TEXT,
      ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
      ADD COLUMN IF NOT EXISTS domain TEXT,
      ADD COLUMN IF NOT EXISTS box_key TEXT;
    `);
    console.log('Contacts table updated');

    // Updating activities table
    await db.execute(sql`
      ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS email_subject TEXT,
      ADD COLUMN IF NOT EXISTS email_content TEXT,
      ADD COLUMN IF NOT EXISTS direction TEXT,
      ADD COLUMN IF NOT EXISTS thread_id TEXT,
      ADD COLUMN IF NOT EXISTS created_by TEXT;
    `);
    console.log('Activities table updated');

    // Updating deals table
    await db.execute(sql`
      ALTER TABLE deals
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS thread TEXT,
      ADD COLUMN IF NOT EXISTS last_email_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS next_task_due_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS days_in_stage INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS email_thread_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS assigned_to TEXT,
      ADD COLUMN IF NOT EXISTS interest TEXT,
      ADD COLUMN IF NOT EXISTS fit TEXT,
      ADD COLUMN IF NOT EXISTS type TEXT,
      ADD COLUMN IF NOT EXISTS persona TEXT,
      ADD COLUMN IF NOT EXISTS category TEXT,
      ADD COLUMN IF NOT EXISTS box_key TEXT;
    `);
    console.log('Deals table updated');

    // Updating tasks table
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS assigned_to TEXT,
      ADD COLUMN IF NOT EXISTS priority TEXT,
      ADD COLUMN IF NOT EXISTS reminder_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS category TEXT;
    `);
    console.log('Tasks table updated');

    console.log('Database update completed');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    await pool.end();
  }
}

updateDatabase();