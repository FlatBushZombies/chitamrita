import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from 'expo-secure-store';
import { UserProvider } from "@/context/userContext"
import { SocketProvider } from "@/context/SocketContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SupabaseProvider } from "@/context/SupabaseContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LogBox } from 'react-native';

// Ignore FontFaceObserver warnings
LogBox.ignoreLogs(['FontFaceObserver']);

// Clerk token cache
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key)
    } catch (err) {
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch (err) {
      return
    }
  },
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache} >
      <SafeAreaProvider>
        <ThemeProvider>
          <SupabaseProvider>
            <UserProvider>
              <SocketProvider>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(root)" options={{ headerShown: false }} />
                </Stack>
              </SocketProvider>
            </UserProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ClerkProvider>
  )
}