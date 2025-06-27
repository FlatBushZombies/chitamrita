"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { useSignIn, useAuth as useClerkAuth } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"

const SignInScreen = () => {
  const { colors } = useTheme()
  const navigation = useNavigation()
  const { signIn, setActive, isLoaded } = useSignIn()
  const { isSignedIn } = useClerkAuth()
  const router = useRouter()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Remove: if (!isLoading && user) {
    //   router.replace('/(root)/(tabs)/SearchScreen')
    // }
  }, [])

  const handleSignIn = async () => {
    if (!isLoaded) {
      setError("Authentication service is not ready. Please try again later.")
      return
    }

    // Basic form validation
    if (!identifier.trim()) {
      setError("Please enter your identifier")
      return
    }
    if (!password.trim()) {
      setError("Please enter your password")
      return
    }

    setLoading(true)
    setError("")

    try {
      // If there's an existing session, clear it first
      if (isSignedIn) {
        await setActive({ session: null })
      }

      // Create a new sign-in attempt
      const result = await signIn.create({
        identifier,
        password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.replace('/(root)/(tabs)/SearchScreen')
      } else if (result.status === "needs_first_factor") {
        router.push({
          pathname: "/(auth)/verification",
          params: {
            email: identifier,
            verificationStrategy: "email_code",
          },
        })
      } else {
        console.log("Sign in status:", result.status)
        setError("Sign in was not completed. Please try again.")
      }
    } catch (err: any) {
      console.error("Error signing in:", err)

      if (err.errors?.[0]?.code === "form_identifier_not_found") {
        setError("No account found with this identifier. Please check your input or sign up.")
      } else if (err.errors?.[0]?.code === "form_password_incorrect") {
        setError("Incorrect password. Please try again or use 'Forgot Password'.")
      } else if (err.errors?.[0]?.code === "form_identifier_invalid") {
        setError("Invalid identifier format. Please check your input.")
      } else if (err.errors?.[0]?.code === "form_identifier_required") {
        setError("Please enter your identifier (email or username).")
      } else if (err.errors?.[0]?.code === "form_password_required") {
        setError("Please enter your password.")
      } else if (err.errors?.[0]?.code === "session_exists") {
        // Handle existing session
        try {
          await setActive({ session: null })
          setError("Please try signing in again.")
        } catch (sessionErr) {
          setError("There was an error with your session. Please try again.")
        }
      } else {
        setError(err.errors?.[0]?.message || "Failed to sign in. Please check your credentials and try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword" as never)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]} />
            <Text style={[styles.welcomeText, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.nameText, { color: colors.text }]}>Chitamrita</Text>
            <Text style={[styles.infoText, { color: colors.placeholder }]}>Please fill in your information</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Phone number, username, or email"
                placeholderTextColor={colors.placeholder}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
              <Ionicons name="person-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIcon}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.placeholder}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
              <Text style={[styles.forgotPasswordText, { color: colors.placeholder }]}>Forgot password?</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: colors.primary }]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.signInButtonText}>{loading ? "Signing in..." : "Done"}</Text>
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={[styles.signUpText, { color: colors.placeholder }]}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={[styles.signUpLink, { color: colors.primary }]} > Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "500",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
  },
  formContainer: {
    gap: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  input: {
    flex: 1,
    height: 50,
  },
  inputIcon: {
    padding: 5,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  errorText: {
    color: "#EF4444",
    marginTop: 10,
    textAlign: "center",
  },
  signInButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signInButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: "bold",
  },
})

export default SignInScreen
