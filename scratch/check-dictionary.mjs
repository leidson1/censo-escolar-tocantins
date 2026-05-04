import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zgblhbzzjbzalbyrdrmi.supabase.co'
const supabaseKey = 'sb_publishable_uavtVkJMgXLpNgk43O6OAw_xPGtTe9s'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDictionary() {
  const { data, error } = await supabase.from('dicionario_censo').select('*').limit(5)
  if (error) {
    console.error(error)
    return
  }
  console.log('Sample data:', JSON.stringify(data, null, 2))
}

checkDictionary()
