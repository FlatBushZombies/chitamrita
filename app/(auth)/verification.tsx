"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSignIn, useSignUp } from "@clerk/clerk-expo"
import { COLORS } from "@/config/config"
import { useLocalSearchParams, router } from "expo-router"

const VerificationScreen = () => {
  const { email, verificationStrategy } = useLocalSearchParams<{
    email: string
    verificationStrategy: string
  }>()

  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn()

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [timer, setTimer] = useState(30)
  const [isCodeComplete, setIsCodeComplete] = useState(false)

  const inputRefs = useRef<(TextInput | null)[]>([])

  // Fixed timer implementation
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (timer > 0) {
      intervalId = setInterval(() => setTimer(prev => prev - 1), 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [timer])

  useEffect(() => {
    setIsCodeComplete(code.every(digit => digit !== "") && code.length === 6)
  }, [code])

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code]

    if (text.length > 1) {
      const pastedCode = text.split("").slice(0, 6 - index)
      pastedCode.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char
      })
    } else {
      newCode[index] = text
    }

    setCode(newCode)

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleBackspace = (index: number) => {
    if (code[index] === "" && index > 0) {
      const newCode = [...code]
      newCode[index - 1] = ""
      setCode(newCode)
      inputRefs.current[index - 1]?.focus()
    } else if (code[index] !== "") {
      const newCode = [...code]
      newCode[index] = ""
      setCode(newCode)
    }
  }

  const verifyCode = async () => {
    if (!isCodeComplete) {
      setError("Please enter the complete 6-digit code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const fullCode = code.join("")

      if (verificationStrategy === "sign_up") {
        if (!isSignUpLoaded) throw new Error("Sign up service not ready")

        const result = await signUp.attemptEmailAddressVerification({ code: fullCode })

        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId })
          router.replace("/(root)/(tabs)/SearchScreen")
        } else {
          throw new Error("Verification failed. Please try again.")
        }
      } else {
        if (!isSignInLoaded) throw new Error("Sign in service not ready")

        // First create the sign-in attempt
        const firstFactor = await signIn.create({
          identifier: email,
        })

        if (firstFactor.status === "needs_first_factor") {
          const result = await signIn.attemptFirstFactor({
            strategy: "email_code",
            code: fullCode,
          })

          if (result.status === "complete") {
            await setSignInActive({ session: result.createdSessionId })
            router.replace("/(root)/(tabs)/SearchScreen")
          } else {
            throw new Error("Verification failed. Please try again.")
          }
        } else {
          throw new Error("Invalid sign-in state")
        }
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      setError(
        err.errors?.[0]?.message ||
        err.message ||
        "Verification failed. Please try again."
      )
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const resendCode = async () => {
    setIsLoading(true)
    setError("")

    try {
      if (verificationStrategy === "sign_up") {
        if (!isSignUpLoaded) throw new Error("Sign up service not ready")
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      } else {
        if (!isSignInLoaded) throw new Error("Sign in service not ready")

        // Create a new sign-in attempt
        const firstFactor = await signIn.create({
          identifier: email,
        })

        if (firstFactor.status === "needs_first_factor" && firstFactor.supportedFirstFactors) {
          const emailFactor = firstFactor.supportedFirstFactors.find(
            (factor) => factor.strategy === "email_code"
          )

          if (emailFactor?.emailAddressId) {
            await signIn.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: emailFactor.emailAddressId,
            })
          } else {
            throw new Error("Email verification is not available")
          }
        } else {
          throw new Error("Invalid sign-in state")
        }
      }

      setTimer(30)
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      console.error("Resend error:", err)
      setError(err.errors?.[0]?.message || "Failed to resend code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeypadPress = (digit: string) => {
    const emptyIndex = code.findIndex(d => d === "")
    if (emptyIndex !== -1) {
      const newCode = [...code]
      newCode[emptyIndex] = digit
      setCode(newCode)
      if (emptyIndex < 5) inputRefs.current[emptyIndex + 1]?.focus()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <View key={index} style={styles.codeInputContainer}>
              <TextInput
                ref={ref => (inputRefs.current[index] = ref)}
                style={styles.codeInput}
                value={digit}
                onChangeText={text => handleCodeChange(text, index)}
                onKeyPress={({ nativeEvent }) =>
                  nativeEvent.key === "Backspace" && handleBackspace(index)
                }
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
              />
              <View style={[styles.underline, digit && styles.underlineActive]} />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!isCodeComplete || isLoading) && styles.buttonDisabled
          ]}
          onPress={verifyCode}
          disabled={!isCodeComplete || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resendButton, (timer > 0 || isLoading) && styles.resendButtonDisabled]}
          onPress={resendCode}
          disabled={timer > 0 || isLoading}
        >
          <Text style={styles.resendText}>
            {timer > 0 ? `Resend code in ${timer}s` : "Resend code"}
          </Text>
        </TouchableOpacity>

        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <TouchableOpacity
              key={num}
              style={styles.keypadButton}
              onPress={() => handleKeypadPress(num.toString())}
              disabled={isLoading}
            >
              <Text style={styles.keypadText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.keypadButton} />
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleKeypadPress("0")}
            disabled={isLoading}
          >
            <Text style={styles.keypadText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleBackspace(code.findIndex(d => d === "") - 1 || 0)}
            disabled={isLoading}
          >
            <Ionicons name="backspace-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  email: {
    fontWeight: "bold",
    color: COLORS.text,
  },
  error: {
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  codeInputContainer: {
    width: 40,
    alignItems: "center",
  },
  codeInput: {
    width: "100%",
    height: 50,
    fontSize: 24,
    textAlign: "center",
    color: COLORS.text,
  },
  underline: {
    height: 2,
    width: "100%",
    backgroundColor: COLORS.border,
    marginTop: 8,
  },
  underlineActive: {
    backgroundColor: COLORS.primary,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  resendButton: {
    alignItems: "center",
    padding: 8,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: COLORS.textSecondary,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
  },
  keypadButton: {
    width: 72,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: COLORS.card,
  },
  keypadText: {
    fontSize: 24,
    color: COLORS.text,
  },
})

export default VerificationScreen