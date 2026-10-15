#!/usr/bin/env node

// Utility script to inspect and optionally activate a user's accountStatus
// Usage:
//   node backend/tools/user-status.js                 -> list users
//   node backend/tools/user-status.js <email>         -> show one user
//   node backend/tools/user-status.js <email> activate -> set accountStatus='active' and isEmailVerified=true
//   node backend/tools/user-status.js delete-all confirm -> DELETE ALL users (dangerous)

import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import userModel from '../features/auth/models/userModel.js';

// Ensure backend/.env is loaded regardless of CWD
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Build a safe Mongo URI
const baseUri = (process.env.MONGODB_URI || '').trim();
if (!baseUri) {
  console.error('❌ Missing MONGODB_URI in backend/.env');
  process.exit(1);
}
const defaultDbName = 'ecommerce_kharido';
const hasDbInUri = /mongodb(\+srv)?:\/\/[^/]+\/[^?]+/i.test(baseUri);
const uri = hasDbInUri ? baseUri : `${baseUri.replace(/\/$/, '')}/${defaultDbName}`;

const emailArg = process.argv[2] ? String(process.argv[2]).toLowerCase() : null;
const action = process.argv[3] ? String(process.argv[3]).toLowerCase() : '';

async function main() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');

    if (emailArg === 'delete-all') {
      if (action !== 'confirm') {
        console.log("⚠️ This will delete ALL users. To proceed, run: node backend/tools/user-status.js delete-all confirm");
      } else {
        const totalBefore = await userModel.countDocuments();
        const result = await userModel.deleteMany({});
        console.log(`🗑️ Deleted ${result.deletedCount} users (out of ${totalBefore})`);
      }
    } else if (!emailArg) {
      const users = await userModel.find({}).select('email name accountStatus isEmailVerified lastLogin role').lean();
      if (!users.length) {
        console.log('📭 No users found');
      } else {
        console.log(`📋 Found ${users.length} users:`);
        users.forEach(u => {
          console.log(` - ${u.email} | status: ${u.accountStatus} | verified: ${u.isEmailVerified ? 'yes' : 'no'} | role: ${u.role || 'customer'} | lastLogin: ${u.lastLogin ? new Date(u.lastLogin).toISOString() : 'never'}`);
        });
      }
    } else {
      const user = await userModel.findOne({ email: emailArg });
      if (!user) {
        console.log(`❌ No user found with email: ${emailArg}`);
      } else {
        console.log('👤 User details:');
        console.log(` - name: ${user.name}`);
        console.log(` - email: ${user.email}`);
        console.log(` - accountStatus: ${user.accountStatus}`);
        console.log(` - isEmailVerified: ${user.isEmailVerified}`);
        console.log(` - lastLogin: ${user.lastLogin ? new Date(user.lastLogin).toISOString() : 'never'}`);

        if (action === 'activate' && user.accountStatus !== 'active') {
          user.accountStatus = 'active';
          user.isEmailVerified = true;
          await user.save();
          console.log('✅ User reactivated (accountStatus=active, isEmailVerified=true)');
        } else if (action === 'activate' && user.accountStatus === 'active') {
          console.log('ℹ️ User already active, no changes made');
        }
      }
    }
  } catch (err) {
    console.error('❌ Error:', err?.message || err);
    console.error('➡️ URI used:', uri);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

main();