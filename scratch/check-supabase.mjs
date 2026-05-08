import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgblhbzzjbzalbyrdrmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_uavtVkJMgXLpNgk43O6OAw_xPGtTe9s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data, error, count } = await supabase
    .from('escolas_2025_to')
    .select('*', { count: 'exact' })
    .limit(5);

  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log('Count:', count);
    console.log('Data Length:', data.length);
    if (data.length > 0) {
      console.log('Sample Row Keys:', Object.keys(data[0]));
      console.log('Sample Row:', data[0]);
    } else {
      console.log('No data found. Check RLS policies or table name.');
    }
  }
}

checkSchema();
