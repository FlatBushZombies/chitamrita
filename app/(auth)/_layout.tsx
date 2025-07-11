import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from 'expo-secure-store';

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
    
    <Stack>
      <Stack.Screen name="get-started" options={{ headerShown: false}}  />
      <Stack.Screen name="ForgotPassword" options={{ headerShown: false}}/>
      <Stack.Screen name="ChatListScreen" options={{ headerShown: false}}/>
      <Stack.Screen name="LoginScreen" options={{ headerShown: false}}/>
      <Stack.Screen name="SearchScreen" options={{ headerShown: false}}/>
      <Stack.Screen name="ProfileScreen" options={{ headerShown: false}}/>
      <Stack.Screen name="verification" options={{ headerShown: false}}/>
      <Stack.Screen name="sign-up" options={{ headerShown: false}}/>
    </Stack>
  )
}