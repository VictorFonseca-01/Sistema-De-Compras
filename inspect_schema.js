
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data, error } = await supabase.from('requests').select('*').limit(1);
  if (error) {
    console.error('Error fetching requests:', error);
  } else {
    console.log('Request columns:', Object.keys(data[0] || {}));
  }

  const { data: attData, error: attError } = await supabase.from('request_attachments').select('*').limit(1);
  if (attError) {
    console.error('Error fetching attachments:', attError);
  } else {
    console.log('Attachment columns:', Object.keys(attData[0] || {}));
  }
}

checkSchema();
