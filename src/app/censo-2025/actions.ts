"use server";


import gestoresData from '@/data/gestores_escolares_2025_TO.json';
import escolasFixData from '@/data/escolas-fix.json';

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
