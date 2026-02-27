import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

console.log('Iniciando cliente Supabase...');

/// <reference types="vite/client" />

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env file.\n' +
        'Required variables:\n' +
        '- VITE_SUPABASE_URL\n' +
        '- VITE_SUPABASE_ANON_KEY'
    );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

// Helper to handle Supabase errors
export function handleSupabaseError(error: any): never {
    console.error('Supabase Error:', error);

    if (error.message) {
        throw new Error(error.message);
    }

    if (error.error_description) {
        throw new Error(error.error_description);
    }

    throw new Error('Ocorreu um erro inesperado. Tente novamente.');
}

// Helper to check if user is authenticated
export async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        handleSupabaseError(error);
    }

    return session;
}

// Helper to get current user
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        handleSupabaseError(error);
    }

    return user;
}
