import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zgblhbzzjbzalbyrdrmi.supabase.co'
const supabaseKey = 'sb_publishable_uavtVkJMgXLpNgk43O6OAw_xPGtTe9s'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  const { data, error } = await supabase.from('gestores_2025_to').select('*').limit(1)
  if (error) {
    console.error(error)
    return
  }
  console.log(JSON.stringify(Object.keys(data[0]), null, 2))
}

checkColumns()
