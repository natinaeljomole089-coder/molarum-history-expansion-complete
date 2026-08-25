import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const isServerRender = typeof window === "undefined";

const sessionStorage = Platform.OS === "web"
  ? AsyncStorage
  : {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };

export const isSupabaseConfigured = Boolean(url && publishableKey);
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, publishableKey!, {
      auth: isServerRender
        ? { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
        : {
            storage: sessionStorage,
            storageKey: "molarum.supabase.session.v1",
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: Platform.OS === "web",
          },
    })
  : null;

export const LEARNER_BACKUP_BUCKET = "molarum-learner-backups";
