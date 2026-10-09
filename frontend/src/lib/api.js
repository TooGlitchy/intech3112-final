const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');

    const headers = {
        Accept: 'application/json',
        ...options.headers,
    };

    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(
            data?.message || 'An unexpected error occurred.'
        );

        error.status = response.status;
        error.errors = data?.errors || {};

        throw error;
    }

    return data;
}