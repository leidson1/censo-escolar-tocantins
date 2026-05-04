import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgblhbzzjbzalbyrdrmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_uavtVkJMgXLpNgk43O6OAw_xPGtTe9s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  const tables = ['estudantes_2026', 'habilidades_2026', 'resultados_2026', 'estudantes_saep', 'resultados_saep'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`Table found: ${table}`);
      if (data && data.length > 0) {
        console.log(`Columns in ${table}:`, Object.keys(data[0]));
      }
    } else {
      console.log(`Table not found or error for ${table}:`, error.message);
    }
  }
}

checkTables();
