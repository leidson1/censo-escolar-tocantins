"use server";


import escolasFixData from '@/data/escolas-fix.json';

// Dados desativados
const gestoresData: any[] = [];

export async function getSchoolDetails(schoolId: number) {
  try {
    return (escolasFixData as any[]).find((s: any) => s.CO_ENTIDADE === schoolId) || null;
  } catch (error) {
    console.error('Error fetching school details:', error);
    return null;
  }
}

export async function getGestoresData() {
  return gestoresData;
}
