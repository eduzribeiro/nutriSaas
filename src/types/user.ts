export type Role = 'admin' | 'nutritionist' | 'patient';

export interface User {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null; // null for admin, nutritionist ID for patients, own ID for nutritionists
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  phone?: string;
  avatar?: string;
  crn?: string; // For nutritionists
  nutriCode?: string; // For nutritionists
  linkedNutriId?: string; // For patients
}

export interface AuthUser extends User {
  profile: UserProfile;
}
