// Default to local development URL if REACT_APP_API_URL is not set
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Remove any trailing slashes for consistency
const normalizedApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

export const config = {
    apiUrl: normalizedApiUrl,
    // Add other configuration values here
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