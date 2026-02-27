// Central export for all types
export * from './user';
export * from './tenant';
export * from './patient';
export * from './plan';
export * from './aiUsage';
export * from './supabase';

// Common utility types
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface FilterOptions {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}
