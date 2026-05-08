"use server";


import { supabase } from '@/lib/supabase';
import { mapSchoolData } from '@/lib/supabase-mapping';

export async function getSchoolDetails(schoolId: number) {
  try {
    const { data, error } = await supabase
      .from('escolas_2025_to')
      .select('*')
      .eq('codigo_da_escola', schoolId)
      .single();

    if (error) throw error;
    return mapSchoolData(data);
  } catch (error) {
    console.error('Error fetching school details:', error);
    return null;
  }
}

export async function getGestoresData() {
  return [];
}
