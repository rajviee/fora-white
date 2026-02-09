// utils/secureStorage.js
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Web only
let Cookies;
let CryptoJS;
if (Platform.OS === "web") {
  Cookies = require("js-cookie");
  CryptoJS = require("crypto-js");
}

const SECRET_KEY = process.env.EXPO_PUBLIC_ENCRYPT_KEY || "default-secret-key";
const SIGN_KEY = process.env.EXPO_PUBLIC_SIGN_KEY || "default-sign-key";

// 🔐 Encrypt + Sign
export const encryptAndSign = async (data) => {
  const jsonData = JSON.stringify(data);

  try {
    if (Platform.OS === "web") {
      // Web: AES with crypto-js
      const encrypted = CryptoJS.AES.encrypt(jsonData, SECRET_KEY).toString();
      const signature = CryptoJS.HmacSHA256(encrypted, SIGN_KEY).toString();
      return `web:${encrypted}--${signature}`;
    } else {
      // Mobile: SecureStore handles encryption internally
      return `mobile:${jsonData}`;
    }
  } catch (err) {
    console.error("Encryption error:", err);
    return `plain:${jsonData}`;
  }
};

// 🔓 Decrypt + Verify
export const decryptAndVerify = async (value) => {
  if (!value) return null;

  try {
    if (value.startsWith("web:")) {
      const cleanValue = value.substring(4);
      const [encrypted, signature] = cleanValue.split("--");
      const expectedSig = CryptoJS.HmacSHA256(encrypted, SIGN_KEY).toString();

      if (signature !== expectedSig) {
        console.log("⚠️ Web signature verification failed");
        return null;
      }

      const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } else if (value.startsWith("mobile:")) {
      return JSON.parse(value.substring(7));
    } else if (value.startsWith("plain:")) {
      return JSON.parse(value.substring(6));
    } else {
      // Legacy JSON
      return JSON.parse(value);
    }
  } catch (err) {
    console.error("Decryption error:", err);
    return null;
  }
};

// 📦 Unified Storage
export const Storage = {
  setItem: async (key, value) => {
    const now = Date.now();
    const expiry = now + 90 * 24 * 60 * 60 * 1000;
    const wrapped = {
      data: value,
      expiry
    }
    const processed = await encryptAndSign(wrapped);

    if (Platform.OS === "web") {
      Cookies.set(key, processed, { expires: 90 });
    } else {
      if (key === "token") {
        await SecureStore.setItemAsync(key, processed);
      } else {
        await AsyncStorage.setItem(key, processed);
      }
    }
    console.log(`✅ Stored ${key}`);
  },

  getItem: async (key) => {
    let stored;
    if (Platform.OS === "web") {
      stored = Cookies.get(key);
    } else {
      stored = key === "token"
        ? await SecureStore.getItemAsync(key)
        : await AsyncStorage.getItem(key);
    }

    if (!stored) return null;
    const decoded = await decryptAndVerify(stored);
    if (!decoded) return null;

    // Expiry check
    const now = Date.now();
    if (decoded.expiry && now > decoded.expiry) {
      console.log(`⏳ ${key} expired, removing...`);
      await Storage.removeItem(key);
      return null;
    }

    return decoded.data; // important
  },

  removeItem: async (key) => {
    if (Platform.OS === "web") {
      Cookies.remove(key);
    } else {
      key === "token"
        ? await SecureStore.deleteItemAsync(key)
        : await AsyncStorage.removeItem(key);
    }
    console.log(`🗑️ Removed ${key}`);
  },

  clearAuthData: async () => {
    await Promise.all([
      Storage.removeItem("token"),
      Storage.removeItem("user"),
    ]);
    console.log("🧹 Cleared auth data");
  },
};
