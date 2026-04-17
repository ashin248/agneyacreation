import axios from 'axios';
import { auth } from '../Client/firebase';
axios.defaults.baseURL = '';

// Global HTTP Dispatch Interceptor injecting Cryptographic JSON Web Tokens implicitly explicitly securely natively 
axios.interceptors.request.use(
    async (config) => {
        // Multi-tier token resolution for maximum reliability across legacy and modern components
        let token = localStorage.getItem('adminToken');
        
        if (!token) {
            // Check session storage as fallback (handling both raw and JSON-serialized versions)
            const sessionToken = sessionStorage.getItem('adminToken');
            if (sessionToken) {
                try {
                    token = JSON.parse(sessionToken);
                } catch {
                    token = sessionToken;
                }
            }
        }

        // Authenticate requests if a token exists. 
        // Previously we whitelisted public routes, but several /api/public routes (sync-user, etc.)
        // are protected by protectUser middleware and require the Firebase ID token.
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else if (auth && auth.currentUser) {
            try {
                const userToken = await auth.currentUser.getIdToken();
                config.headers.Authorization = `Bearer ${userToken}`;
            } catch (err) {
                console.error("Error getting Firebase token", err);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Global Response Interceptor handling session expiry and cryptographic rejections seamlessly
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // High-security session purge upon invalid identity detection
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminProfile');
            sessionStorage.removeItem('adminToken');
            
            // Redirect to login if user is in an admin route Barrier
            if (window.location.pathname.startsWith('/admin')) {
                window.location.href = '/admin/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axios;
