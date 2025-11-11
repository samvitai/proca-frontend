/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API Configuration using Vite environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://procabackend.up.railway.app";

// Configure axios instance without static token
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add dynamic token interceptor for every request
api.interceptors.request.use(
  (config) => {
    // Get token dynamically on each request
    const authToken = localStorage.getItem('authToken') ||
                     localStorage.getItem('token') ||
                     localStorage.getItem('auth_token') ||
                     localStorage.getItem('access_token') ||
                     sessionStorage.getItem('token') ||
                     sessionStorage.getItem('auth_token');

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    // Add organization context if available
    const userOrg = localStorage.getItem('user_organization');
    const orgId = localStorage.getItem('organization_id');
    
    if (orgId) {
      config.headers['X-Organization-ID'] = orgId;
    }
    
    if (userOrg) {
      config.headers['X-Organization-Context'] = userOrg;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication required. Please log in again.');
      // Clear tokens and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('access_token');
      // You might want to redirect to login page here
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User registration API functions (updated to include organization)
// Organization details (firm_name, address, organization_id) are automatically 
// inherited from the currently logged-in user (super admin/admin/supervisor)
export const registerUser = async (userData: any, userType: string) => {
  try {
    let endpoint = "";
    let payload = {};
    
    // Get current user's organization and id from localStorage
    // This ensures new users are automatically linked to the same organization
    const organizationId = localStorage.getItem('organizationId');
    const currentUserId = localStorage.getItem('userId');
    const firmName = localStorage.getItem('firmName') || "Default Firm";

    // Validate creator_id
    if (!currentUserId) {
      throw new Error('User not authenticated. Please log in again.');
    }

    const creatorId = parseInt(currentUserId);
    if (isNaN(creatorId)) {
      throw new Error('Invalid user ID. Please log in again.');
    }

    switch (userType) {
      case "admin":
        endpoint = "/api/auth/register/admin";
        payload = {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.contact,
          creator_id: creatorId,
        };
        break;
      case "supervisor":
        endpoint = "/api/auth/register/supervisor";
        payload = {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.contact,
          creator_id: creatorId,
        };
        break;
      case "employee":
        endpoint = "/api/auth/register/employee";
        payload = {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.contact,
          creator_id: creatorId,
        };
        break;
      default:
        throw new Error(`Unsupported user type: ${userType}`);
    }

    const response = await api.post(endpoint, payload);
    return response.data;
  } catch (error: any) {
    console.error("Registration error:", error);
    throw new Error(error.response?.data?.detail || "Registration failed");
  }
};

// Helper function to get current user info from localStorage
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// Helper function to get organization info
export const getOrganizationInfo = () => {
  try {
    const org = localStorage.getItem('organization');
    return org ? JSON.parse(org) : null;
  } catch {
    return null;
  }
};

// Helper function to get cached user profile data
export const getCachedUserProfile = () => {
  try {
    const profile = localStorage.getItem('userProfile');
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error parsing cached user profile:', error);
    return null;
  }
};

// Helper function to update cached user profile data
export const updateCachedUserProfile = (profileData: any) => {
  try {
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    
    // Also update individual fields for backward compatibility
    if (profileData.first_name) {
      localStorage.setItem('userFirstName', profileData.first_name);
    }
    if (profileData.last_name) {
      localStorage.setItem('userLastName', profileData.last_name);
    }
    if (profileData.email) {
      localStorage.setItem('userEmail', profileData.email);
    }
    if (profileData.phone) {
      localStorage.setItem('userPhone', profileData.phone);
    }
  } catch (error) {
    console.error('Error updating cached user profile:', error);
  }
};