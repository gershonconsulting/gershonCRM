import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function updateSchema() {
  try {
    console.log('Adding missing columns to contacts table...');
    
    // List of columns to add to contacts table
    const contactColumns = [
      'twitter',
      'facebook',
      'instagram',
      'website',
      'location',
      'address',
      'city',
      'state',
      'country',
      'source',
      'status',
      'domain',
      'box_key',
      'notes',
      'linked_in',
      'custom_fields'
    ];
    
    // Add all columns to contacts table
    for (const column of contactColumns) {
      try {
        await db.execute(sql.raw(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ${column} TEXT;`));
        console.log(`Added/verified column ${column} to contacts table`);
      } catch (err) {
        console.error(`Error adding column ${column}:`, err);
      }
    }
    
    // Deal columns
    const dealColumns = [
      'description',
      'notes',
      'done',
      'next_steps',
      'thread',
      'source',
      'interest',
      'fit',
      'type',
      'persona',
      'category',
      'days_in_stage',
      'email_thread_count',
      'assigned_to',
      'box_key',
      'custom_fields'
    ];
    
    // Add all columns to deals table
    for (const column of dealColumns) {
      try {
        // Special case for boolean column
        if (column === 'done') {
          await db.execute(sql.raw(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS ${column} BOOLEAN DEFAULT FALSE;`));
        } 
        // Special case for numeric columns
        else if (column === 'days_in_stage' || column === 'email_thread_count') {
          await db.execute(sql.raw(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS ${column} INTEGER DEFAULT 0;`));
        }
        // Text columns
        else {
          await db.execute(sql.raw(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS ${column} TEXT;`));
        }
        console.log(`Added/verified column ${column} to deals table`);
      } catch (err) {
        console.error(`Error adding column ${column}:`, err);
      }
    }
    
    // Add array columns separately with special syntax
    try {
      await db.execute(sql.raw(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT[];`));
      console.log(`Added/verified column tags (TEXT[]) to contacts table`);
    } catch (err) {
      console.error(`Error adding column tags:`, err);
    }
    
    try {
      await db.execute(sql.raw(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS tags TEXT[];`));
      console.log(`Added/verified column tags (TEXT[]) to deals table`);
    } catch (err) {
      console.error(`Error adding column tags:`, err);
    }
    
    console.log('Schema updated successfully!');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    process.exit(0);
  }
}

updateSchema();