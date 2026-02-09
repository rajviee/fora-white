import axios from "axios"
import { Storage } from "./secureStorage"
import useUserStore from "../stores/useUserStore"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Create axios instance
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL, // example: http://192.168.0.101:3000
  headers: { "Content-Type": "multipart/form-data" },
})

// Add token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await Storage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // if (error.response?.status === 401) {
    //   await Storage.clearAuthData()
    // }
    if (error.response?.status === 401 && error.response.data.message==="Invalid token") {
      useUserStore.getState().logout()
      console.warn("401 received — letting caller handle it");
    }
    return Promise.reject(error)
  }
)
export const removetoken =async ()=>{
 await api.delete("me/remove-token",{
    headers: { "Content-Type": "application/json" },
  })
  AsyncStorage.removeItem("notificationData");
  console.log("token remove called");
  
}

export default api
