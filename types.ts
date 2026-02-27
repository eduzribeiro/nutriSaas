
export type Role = 'admin' | 'nutri' | 'paciente';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  nutriCode?: string;
  linkedNutriId?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  nutriId: string;
  weight: number;
  objective: string;
  lastUpdate: string;
}

export interface MealPlan {
  id: string;
  patientId: string;
  content: string;
  createdAt: string;
}

export interface IAUsageRecord {
  id: string;
  userId: string;
  name: string;
  type: Role;
  daily: number;
  monthly: number;
}
