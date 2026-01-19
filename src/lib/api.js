/**
 * Centralized API client for authenticated requests
 * 
 * This wrapper ensures all API calls include the Supabase access_token
 * in the Authorization header for proper backend authentication.
 */

import { supabase } from '@/lib/supabase';

/**
 * Make an authenticated API request
 * Automatically attaches the Supabase access_token as Authorization header
 * @param {string} url - The API endpoint URL
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function fetchAPI(url, options = {}) {
    // Get the current session to extract access_token
    const { data: { session } } = await supabase.auth.getSession();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Attach Bearer token if user is authenticated
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const config = {
        ...options,
        credentials: 'include', // Keep for compatibility
        headers,
    };

    // Remove Content-Type for FormData (browser sets it automatically with boundary)
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    return fetch(url, config);
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
    get: (url, options = {}) => fetchAPI(url, { ...options, method: 'GET' }),

    post: (url, data, options = {}) => fetchAPI(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
    }),

    put: (url, data, options = {}) => fetchAPI(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    patch: (url, data, options = {}) => fetchAPI(url, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(data),
    }),

    delete: (url, options = {}) => fetchAPI(url, { ...options, method: 'DELETE' }),
};

