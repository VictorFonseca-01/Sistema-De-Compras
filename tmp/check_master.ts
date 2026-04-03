import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // I might need service_role for this, let's check .env

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const { data, error } = await supabase
    .from('requests')
    .select('*, profiles(full_name, department)')
    .limit(1);

  if (error) {
    console.error('Error fetching requests sample:', error.message);
  } else {
    console.log('Request sample:', JSON.stringify(data, null, 2));
  }
}

checkTable();
