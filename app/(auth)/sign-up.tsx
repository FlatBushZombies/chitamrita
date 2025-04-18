"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSignUp } from "@clerk/clerk-expo"
import { COLORS, COMMON_STYLES } from "@/config/config"
import { useRouter

 } from "expo-router"
const SignUpScreen = () => {
  const router = useRouter()
  const { isLoaded, signUp, setActive } = useSignUp()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const validateInputs = () => {
    if (!email) return "Email is required"
    if (!password) return "Password is required"
    if (password.length < 8) return "Password must be at least 8 characters"
    if (!username) return "Username is required"
    if (!fullName) return "Full name is required"
    return null
  }

  const handleSignUp = async () => {
    if (!isLoaded) return

    // Validate inputs
    const validationError = validateInputs()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setError("")
      setIsLoading(true)

      // Extract first and last name from full name
      const nameParts = fullName.trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      // Start the sign-up process with Clerk
      await signUp.create({
        emailAddress: email,
        password,
        username,
        firstName,
        lastName,
      })

      // Prepare verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      // Navigate to verification screen using router.push
      router.push("/verification", {
        email,
        verificationStep: "email",
      })
    } catch (err: any) {
      console.error("Error during sign up:", err)

      // Handle specific Clerk errors
      if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const clerkError = err.errors[0]

        // Handle specific error codes
        if (clerkError.code === "form_identifier_exists") {
          setError("This email or username is already in use")
        } else if (clerkError.code === "form_password_pwned") {
          setError("This password has been compromised. Please choose a stronger password")
        } else {
          setError(clerkError.message || "Failed to create account. Please try again.")
        }
      } else {
        setError("Failed to create account. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logo} />
          </View>

          <Text style={styles.welcomeText}>Welcome!</Text>
          <Text style={styles.headerText}>Sign up</Text>
          <Text style={styles.subHeaderText}>Please fill your information</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Ionicons name="mail-outline" size={20} color={COLORS.text} style={styles.inputIcon} />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
              />
              <TouchableOpacity style={styles.inputIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username"
              />
              <Ionicons name="at-outline" size={20} color={COLORS.text} style={styles.inputIcon} />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={fullName}
                onChangeText={setFullName}
                autoComplete="name"
              />
              <Ionicons name="person-outline" size={20} color={COLORS.text} style={styles.inputIcon} />
            </View>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By signing up, you agree to our{" "}
                <Text style={styles.termsLink} onPress={() => router.push("/(auth)/get-started")}>
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text style={styles.termsLink} onPress={() => router.push("/verification")}>
                  Privacy Policy
                </Text>
              </Text>
            </View>

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/LoginScreen")}>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signupButton} onPress={handleSignUp} disabled={isLoading || !isLoaded}>
              {isLoading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.signupButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  welcomeText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
  },
  headerText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subHeaderText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
  },
  errorText: {
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 15,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    ...COMMON_STYLES.inputContainer,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    ...COMMON_STYLES.input,
    flex: 1,
  },
  inputIcon: {
    marginLeft: 10,
  },
  termsContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  termsText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 15,
  },
  loginLinkText: {
    color: COLORS.textSecondary,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  signupButton: {
    ...COMMON_STYLES.button,
    marginTop: 10,
  },
  signupButtonText: {
    ...COMMON_STYLES.buttonText,
  },
})

export default SignUpScreen
