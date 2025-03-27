import * as AuthSession from "expo-auth-session"

// This function will handle the URL for deep linking
export const handleDeepLink = (url: string) => {
  // Extract the token from the URL
  const extractParamsFromUrl = (url: string) => {
    const params = new URLSearchParams(url.split("#")[1])
    const token = params.get("token")
    return token
  }

  // Get the token from the URL
  const token = extractParamsFromUrl(url)
  return token
}

// Get the redirect URL for OAuth
export const getRedirectUrl = () => {
  // For standalone apps, use the defined scheme
  const scheme = process.env.EXPO_PUBLIC_APP_SCHEME || "chitamrita"

  // Use the appropriate URL based on the platform
  const redirectUrl = AuthSession.makeRedirectUri({
    scheme,
    path: "clerk-auth",
    native: `${scheme}://clerk-auth`,
  })

  return redirectUrl
}

// Configure Clerk for your app
export const clerkConfig = {
  // Get publishable key from environment variables
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "",

  // The URL to redirect to after authentication
  redirectUrl: getRedirectUrl(),

  // The URL to redirect to after sign out
  signOutUrl: getRedirectUrl(),
}

