import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgblhbzzjbzalbyrdrmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_uavtVkJMgXLpNgk43O6OAw_xPGtTe9s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getAllKeys() {
  const { data, error } = await supabase
    .from('escolas_2025_to')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data[0]) {
    console.log(JSON.stringify(Object.keys(data[0]), null, 2));
  }
}

getAllKeys();
