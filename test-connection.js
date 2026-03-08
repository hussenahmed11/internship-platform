#!/usr/bin/env node

/**
 * Test Supabase Connection
 * This script tests if your Supabase configuration is working
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
console.log('1. Checking environment variables...');
if (!SUPABASE_URL) {
  console.error('   ❌ VITE_SUPABASE_URL is not set');
  process.exit(1);
}
if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your_anon_key_from_supabase_dashboard') {
  console.error('   ❌ VITE_SUPABASE_ANON_KEY is not set or is placeholder');
  console.log('\n📝 To fix this:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/settings/api');
  console.log('   2. Copy the "anon public" key');
  console.log('   3. Update .env file with the actual key');
  process.exit(1);
}
console.log('   ✅ Environment variables are set');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

// Create Supabase client
console.log('\n2. Creating Supabase client...');
let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('   ✅ Supabase client created');
} catch (error) {
  console.error('   ❌ Failed to create client:', error.message);
  process.exit(1);
}

// Test connection
console.log('\n3. Testing connection...');
try {
  const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
  
  if (error) {
    if (error.message.includes('relation "public.profiles" does not exist')) {
      console.log('   ⚠️  Connection works, but database tables not created yet');
      console.log('\n📝 Next steps:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/sql/new');
      console.log('   2. Open SUPABASE_SETUP.md');
      console.log('   3. Copy and run the SQL from Step 1 (Create Database Schema)');
      console.log('   4. Copy and run the SQL from Step 2 (Enable RLS)');
      process.exit(0);
    }
    throw error;
  }
  
  console.log('   ✅ Connection successful!');
  console.log(`   Found ${data || 0} profiles in database`);
  
  if (data === 0) {
    console.log('\n📝 Database is empty. Next steps:');
    console.log('   1. Open CREATE_ADMIN_USER.md');
    console.log('   2. Follow the instructions to create your first admin user');
  }
} catch (error) {
  console.error('   ❌ Connection failed:', error.message);
  console.log('\n📝 Possible issues:');
  console.log('   - Invalid anon key');
  console.log('   - Supabase project is paused');
  console.log('   - Network connectivity issues');
  process.exit(1);
}

// Check for users
console.log('\n4. Checking for users...');
try {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  if (error) throw error;
  
  if (count === 0) {
    console.log('   ⚠️  No users found');
    console.log('\n📝 Create your first admin user:');
    console.log('   See CREATE_ADMIN_USER.md for instructions');
  } else {
    console.log(`   ✅ Found ${count} user(s)`);
    
    // List users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('email, full_name, role')
      .limit(5);
    
    if (!usersError && users) {
      console.log('\n   Users:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ${user.full_name || 'No name'}`);
      });
    }
  }
} catch (error) {
  console.error('   ❌ Error checking users:', error.message);
}

console.log('\n✅ Test complete!\n');
