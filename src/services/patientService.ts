
import { Patient, PaginatedResponse, PatientMeasurement, PatientHistory, FilterOptions } from '../types';
import { supabase, handleSupabaseError } from '../lib/supabase';

class PatientService {
    /**
     * Get all patients for the current tenant with pagination and search
     */
    async getPatients(filters?: FilterOptions): Promise<PaginatedResponse<Patient>> {
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('Não autenticado');

            let query = supabase
                .from('patients')
                .select('*', { count: 'exact' });

            if (filters?.search) {
                query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }

            const page = filters?.page || 1;
            const pageSize = filters?.pageSize || 20;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, count, error } = await query
                .order('name', { ascending: true })
                .range(from, to);

            if (error) throw error;

            return {
                data: (data || []).map(this.mapToPatient),
                total: count || 0,
                page,
                pageSize,
                hasMore: (count || 0) > to + 1
            };
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get a single patient by ID
     */
    async getPatientById(id: string): Promise<Patient | null> {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }

            return this.mapToPatient(data);
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get a patient by their associated User ID
     */
    async getPatientByUserId(userId: string): Promise<Patient | null> {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            return this.mapToPatient(data);
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Create a new patient
     */
    async createPatient(patientData: Omit<Patient, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
        try {
            console.log('PatientService: Criando paciente...', patientData.email);
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('Não autenticado');

            // Get tenant_id from profile
            const { data: profile, error: profileError } = await (supabase
                .from('profiles') as any)
                .select('tenant_id')
                .eq('id', userData.user.id)
                .single();

            if (profileError) throw profileError;

            console.log('PatientService: Profile tenant_id:', profile?.tenant_id);

            if (!profile?.tenant_id) throw new Error('Seu perfil não está vinculado a um consultório. Contate o suporte.');

            const { data, error } = await (supabase
                .from('patients') as any)
                .insert({
                    tenant_id: profile.tenant_id,
                    name: patientData.name,
                    email: patientData.email,
                    weight: patientData.weight,
                    height: patientData.height,
                    birth_date: patientData.birthDate,
                    objective: patientData.objective,
                    last_consultation: patientData.lastConsultation,
                })
                .select()
                .single();

            if (error) {
                console.error('PatientService Insert Error:', error);
                throw error;
            }

            console.log('PatientService: Paciente criado com sucesso:', data.id);
            return this.mapToPatient(data);
        } catch (error) {
            console.error('PatientService Catch Error:', error);
            return handleSupabaseError(error);
        }
    }

    /**
     * Update an existing patient
     */
    async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
        try {
            const { data, error } = await (supabase
                .from('patients') as any)
                .update({
                    name: updates.name,
                    email: updates.email,
                    weight: updates.weight,
                    height: updates.height,
                    birth_date: updates.birthDate,
                    objective: updates.objective,
                    last_consultation: updates.lastConsultation,
                })
                .eq('id', id)
                .select()
                .single();

            if (error || !data) throw error || new Error('Erro ao atualizar paciente');
            return this.mapToPatient(data);
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
    /**
     * Delete a patient (completely wipes out from auth.users too)
     */
    async deletePatient(id: string): Promise<void> {
        try {
            const { error } = await (supabase as any).rpc('delete_patient_completely_rpc', {
                p_patient_id: id
            });

            if (error) throw error;
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get measurements for a patient
     */
    async getMeasurements(patientId: string): Promise<PatientMeasurement[]> {
        try {
            const { data, error } = await supabase
                .from('patient_measurements')
                .select('*')
                .eq('patient_id', patientId)
                .order('measured_at', { ascending: false });

            if (error) throw error;
            return (data || []).map((m: any) => ({
                id: m.id,
                patientId: m.patient_id,
                tenantId: m.tenant_id,
                weight: Number(m.weight),
                bodyFat: m.body_fat ? Number(m.body_fat) : undefined,
                muscleMass: m.muscle_mass ? Number(m.muscle_mass) : undefined,
                waist: m.waist ? Number(m.waist) : undefined,
                hip: m.hip ? Number(m.hip) : undefined,
                notes: m.notes || undefined,
                measuredAt: m.measured_at,
                createdAt: m.created_at,
            }));
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Add a measurement for a patient
     */
    async addMeasurement(patientId: string, measurement: Omit<PatientMeasurement, 'id' | 'patientId' | 'tenantId' | 'createdAt'>): Promise<PatientMeasurement> {
        try {
            const patient = await this.getPatientById(patientId);
            if (!patient) throw new Error('Paciente não encontrado');

            const { data, error } = await (supabase
                .from('patient_measurements') as any)
                .insert({
                    patient_id: patientId,
                    tenant_id: patient.tenantId,
                    weight: measurement.weight,
                    body_fat: measurement.bodyFat,
                    muscle_mass: measurement.muscleMass,
                    waist: measurement.waist,
                    hip: measurement.hip,
                    notes: measurement.notes,
                    measured_at: measurement.measuredAt,
                })
                .select()
                .single();

            if (error || !data) throw error || new Error('Erro ao adicionar medição');
            return {
                id: data.id,
                patientId: data.patient_id,
                tenantId: data.tenant_id,
                weight: Number(data.weight),
                bodyFat: data.body_fat ? Number(data.body_fat) : undefined,
                muscleMass: data.muscle_mass ? Number(data.muscle_mass) : undefined,
                waist: data.waist ? Number(data.waist) : undefined,
                hip: data.hip ? Number(data.hip) : undefined,
                notes: data.notes || undefined,
                measuredAt: data.measured_at,
                createdAt: data.created_at,
            };
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get history for a patient
     */
    async getPatientHistory(patientId: string): Promise<PatientHistory[]> {
        try {
            const { data, error } = await supabase
                .from('patient_history')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map((h: any) => ({
                id: h.id,
                patientId: h.patient_id,
                tenantId: h.tenant_id,
                type: h.type as any,
                title: h.title,
                description: h.description || undefined,
                createdAt: h.created_at,
            }));
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Add history entry
     */
    async addHistoryEntry(patientId: string, entry: Omit<PatientHistory, 'id' | 'patientId' | 'tenantId' | 'createdAt'>): Promise<PatientHistory> {
        try {
            const patient = await this.getPatientById(patientId);
            if (!patient) throw new Error('Paciente não encontrado');

            const { data, error } = await (supabase
                .from('patient_history') as any)
                .insert({
                    patient_id: patientId,
                    tenant_id: patient.tenantId,
                    type: entry.type,
                    title: entry.title,
                    description: entry.description,
                })
                .select()
                .single();

            if (error || !data) throw error || new Error('Erro ao adicionar histórico');
            return {
                id: data.id,
                patientId: data.patient_id,
                tenantId: data.tenant_id,
                type: data.type as any,
                title: data.title,
                description: data.description || undefined,
                createdAt: data.created_at,
            };
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Get prescriptions for a patient
     */
    async getPrescriptions(patientId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('prescriptions')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Add prescription
     */
    async addPrescription(patientId: string, title: string, content: string): Promise<any> {
        try {
            const patient = await this.getPatientById(patientId);
            if (!patient) throw new Error('Paciente não encontrado');

            const { data: userData } = await supabase.auth.getUser();

            const { data, error } = await (supabase
                .from('prescriptions') as any)
                .insert({
                    tenant_id: patient.tenantId,
                    patient_id: patientId,
                    title: title,
                    content: content,
                    created_by: userData.user!.id
                })
                .select()
                .single();

            if (error || !data) throw error || new Error('Erro ao adicionar receita médica');
            return data;
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    /**
     * Helper to map DB record to Patient type
     */
    private mapToPatient(data: any): Patient {
        if (!data) return {} as Patient;
        return {
            id: data.id,
            tenantId: data.tenant_id,
            userId: data.user_id || undefined,
            name: data.name,
            email: data.email,
            birthDate: data.birth_date || undefined,
            weight: data.weight ? Number(data.weight) : undefined,
            height: data.height ? Number(data.height) : undefined,
            objective: data.objective || undefined,
            lastConsultation: data.last_consultation || undefined,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    }
}

export const patientService = new PatientService();
