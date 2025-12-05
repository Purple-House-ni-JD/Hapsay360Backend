// migrateBlotterAttachments.js
// Run this once to convert old blotter attachments from URL to binary storage

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve backend root to load .env properly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import Blotter from '../models/Blotter.js';
import fetch from 'node-fetch';

const MONGODB_URI = process.env.MONGO_URI;

async function migrateBlotterAttachments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const blotters = await Blotter.find({
      'attachments.url': { $exists: true }
    });

    console.log(`Found ${blotters.length} blotters with old attachment format`);

    for (const blotter of blotters) {
      console.log(`\nMigrating blotter ${blotter._id} (${blotter.blotterNumber})`);

      const newAttachments = [];

      for (let i = 0; i < blotter.attachments.length; i++) {
        const att = blotter.attachments[i];

        if (att.data) {
          console.log(`  Attachment ${i} already migrated, skipping`);
          newAttachments.push(att);
          continue;
        }

        if (att.url) {
          try {
            console.log(`  Fetching attachment ${i} from: ${att.url}`);

            const response = await fetch(att.url);
            if (!response.ok) {
              console.error(`  Failed to fetch attachment ${i}: ${response.status}`);
              continue;
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            let mimetype = att.type || 'application/octet-stream';
            if (att.type === 'photo') mimetype = 'image/jpeg';
            if (att.type === 'video') mimetype = 'video/mp4';

            const filename = att.name || att.url.split('/').pop() || `attachment_${i}`;

            newAttachments.push({
              filename,
              mimetype,
              data: buffer,
              size: buffer.length,
            });

            console.log(`  ✓ Converted attachment ${i}: ${filename} (${buffer.length} bytes)`);

          } catch (error) {
            console.error(`  ✗ Error converting attachment ${i}:`, error.message);
          }
        }
      }

      if (newAttachments.length > 0) {
        blotter.attachments = newAttachments;
        await blotter.save();
        console.log(`✓ Updated blotter ${blotter._id} with ${newAttachments.length} attachments`);
      }
    }

    console.log('\n✓ Migration completed!');
    await mongoose.disconnect();

  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateBlotterAttachments();
