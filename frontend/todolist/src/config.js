// Check if we have the API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
    console.error('REACT_APP_API_URL is not set in environment variables');
}

// Remove any trailing slashes for consistency
const normalizedApiUrl = API_URL?.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

// Default fetch options for all API calls
export const defaultFetchOptions = {
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
    },
};

export const config = {
    apiUrl: normalizedApiUrl,
    fetchOptions: defaultFetchOptions,
    isDevelopment: process.env.NODE_ENV === 'development',
};

// Helper function to construct API endpoints
export const endpoints = {
    auth: {
        login: `${normalizedApiUrl}/auth/login`,
        register: `${normalizedApiUrl}/auth/register`,
    },
    tasks: {
        base: `${normalizedApiUrl}/tasks`,
        single: (id) => `${normalizedApiUrl}/tasks/${id}`,
    },
    health: `${normalizedApiUrl}/health`,
}; 