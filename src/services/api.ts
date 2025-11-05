import axios from "axios";
import { clearCookies, getCookie } from "../helper/cookieHelper";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 100000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Handles user authentication.
api.interceptors.request.use(config => {
    const token = getCookie('user_token');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, error => {
    return Promise.reject(error);
});

// Interceptor to handle responses and errors.
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            if(error.config?.url !== "/administrator/auth/login"){
                clearCookies();
                window.location.href = "/auth/sign-in";
            }
        }

        console.error("Api Error: ", error.response);
        return Promise.reject(error);
    }
)

export default api;