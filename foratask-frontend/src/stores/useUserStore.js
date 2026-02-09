// stores/useUserStore.js
import { create } from "zustand";
import axios from "axios";
import { Platform } from "react-native";
import { Storage } from "../utils/secureStorage";

// Navigation helper - will be set from App.js
let navigationRef = null;

export const setNavigationRef = (ref) => {
  navigationRef = ref;
};

const navigateToLogin = () => {
  if (navigationRef?.current) {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name: "Login" }], // for logout or invalid token
    });
  }
};

const useUserStore = create((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  // Initialize store - call this in your App.js
  initializeStore: async () => {
    set({ isLoading: true });

    try {
      const [storedUser, token] = await Promise.all([
        Storage.getItem("user"),
        Storage.getItem("token")
      ]);

      // If user data is tampered with but token exists, clear everything
      if (!storedUser && token) {
        await Storage.clearAuthData();
        set({ user: null, isLoading: false, isInitialized: true });
        return;
      }

      // If token exists but no user, try to fetch user
      if (token && !storedUser) {
        try {
          console.log(token, "token");

          const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/me/userinfo`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const userData = response.data;
          await Storage.setItem("user", userData);
          set({ user: userData, isLoading: false, isInitialized: true });
          return;
        } catch (error) {
          // Token is invalid, clear everything
          await Storage.clearAuthData();
          set({ user: null, isLoading: false, isInitialized: true });
          return;
        }
      }

      // Set user if both exist
      if (storedUser && token) {
        set({ user: storedUser, isLoading: false, isInitialized: true });
      } else {
        set({ user: null, isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error('Store initialization error:', error);
      await Storage.clearAuthData();
      set({ user: null, isLoading: false, isInitialized: true, error: error.message });
    }
  },

  fetchUser: async () => {
    const token = await Storage.getItem("token");

    if (!token) {
      set({ user: null });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/me/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = response.data;
      set({ user: userData, isLoading: false });
      await Storage.setItem("user", userData);
    } catch (error) {
      console.error('Fetch user error:', error);

      // If unauthorized, clear data and redirect
      if (error.response?.status === 401) {
        useUserStore.getState().logout();
        set({ user: null, isLoading: false });
      }else {
        set({ error: error.message, isLoading: false });
      }
    }
  },

  login: async (credentials) => {
    set({ error: null, isLoading: true });
    console.log("i tried");

    try {
      const loginRes = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, credentials);
      const { token } = loginRes.data;
      console.log(loginRes.data.token);

      console.log(token);


      await Storage.setItem("token", token);

      const userRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/me/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = userRes.data;
      console.log('Login successful:', userData);

      await Storage.setItem("user", userData);
      set({ user: userData, isLoading: false });

      // Navigate to main screen after successful login
      if (Platform.OS === 'web') {
        window.location.href = "/";
      } else {
        if (navigationRef?.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error.response?.data?.message);
      set({
        error: error.response?.data?.message || "Login failed",
        isLoading: false,
      });
    }
  },

  logout: async () => {
    if (get().isLoading) return; // prevent multiple calls

    console.log("🔐 Logging out");

    await Storage.clearAuthData();
    set({ user: null, error: null });

    // navigateToLogin();
  },


  // Helper method to check if user is authenticated
  isAuthenticated: () => {
    const { user } = get();
    return !!user;
  },

  // Clear any errors
  clearError: () => {
    set({ error: null });
  },
}));

export default useUserStore;