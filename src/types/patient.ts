export interface Patient {
    id: string;
    tenantId: string; // Nutritionist who owns this patient
    userId?: string; // Reference to User table
    name: string;
    email: string;
    birthDate?: string;
    weight?: number;
    height?: number;
    objective?: string;
    lastConsultation?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PatientMeasurement {
    id: string;
    patientId: string;
    tenantId: string;
    weight: number;
    bodyFat?: number;
    muscleMass?: number;
    waist?: number;
    hip?: number;
    notes?: string;
    measuredAt: string;
    createdAt: string;
}

export interface PatientHistory {
    id: string;
    patientId: string;
    tenantId: string;
    type: 'consultation' | 'measurement' | 'plan_created' | 'note' | 'anamnesis';
    title: string;
    description: string;
    createdAt: string;
}
