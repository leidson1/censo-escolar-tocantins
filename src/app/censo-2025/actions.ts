"use server";

import fs from 'fs';
import path from 'path';

export async function getSchoolDetails(schoolId: number) {
  const filePath = path.join(process.cwd(), 'src', 'data', 'escolas-fix.json');
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    return data.find((s: any) => s.CO_ENTIDADE === schoolId) || null;
  } catch (error) {
    console.error('Error fetching school details:', error);
    return null;
  }
}

export async function getGestoresData() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'gestores_escolares_2025_TO.json');
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error fetching gestores data:', error);
    return [];
  }
}
