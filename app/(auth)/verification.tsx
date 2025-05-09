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
  ViewStyle,
  TextStyle,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useSignIn, useSignUp } from "@clerk/clerk-expo"
import { COLORS, COMMON_STYLES } from "@/config/config"
import { router } from "expo-router"

interface RouteParams {
  email: string;
  verificationStrategy: string;
}

interface Styles {
  container: ViewStyle;
  content: ViewStyle;
  logoContainer: ViewStyle;
  logo: ViewStyle;
  headerText: TextStyle;
  subHeaderText: TextStyle;
  errorText: TextStyle;
  codeContainer: ViewStyle;
  codeInputWrapper: ViewStyle;
  codeInput: TextStyle;
  codeUnderline: ViewStyle;
  verifyButton: ViewStyle;
  verifyButtonDisabled: ViewStyle;
  verifyButtonText: TextStyle;
  resendButton: ViewStyle;
  resendButtonDisabled: ViewStyle;
  resendButtonText: TextStyle;
  keypadContainer: ViewStyle;
  keypad: ViewStyle;
  keypadButton: ViewStyle;
  keypadButtonText: TextStyle;
}

const VerificationScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { email, verificationStrategy } = (route.params || {}) as RouteParams

  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn()

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""])
  const [displayCode, setDisplayCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [timer, setTimer] = useState(60)

  const inputRefs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0))
    }, 1000)

    return () => clearInterval(countdown)
  }, [])

  useEffect(() => {
    setDisplayCode(code.join(""))
  }, [code])

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste of full code
      const pastedCode = text.slice(0, 6).split("")
      const newCode = [...code]

      for (let i = 0; i < pastedCode.length; i++) {
        if (index + i < 6) {
          newCode[index + i] = pastedCode[i]
        }
      }

      setCode(newCode)

      // Focus on last input or dismiss keyboard if complete
      if (index + pastedCode.length >= 6) {
        Keyboard.dismiss()
      } else if (inputRefs.current[index + pastedCode.length]) {
        inputRefs.current[index + pastedCode.length]?.focus()
      }
    } else {
      // Handle single digit input
      const newCode = [...code]
      newCode[index] = text
      setCode(newCode)

      // Auto-advance to next input
      if (text !== "" && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === "Backspace" && index > 0 && code[index] === "") {
      const newCode = [...code]
      newCode[index - 1] = ""
      setCode(newCode)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join("")

    if (fullCode.length !== 6) {
      setError("Please enter the complete verification code")
      return
    }

    try {
      setError("")
      setIsLoading(true)

      if (!isSignUpLoaded && !isSignInLoaded) {
        setError("Authentication service is not ready. Please try again.")
        return
      }

      // Handle sign-up verification
      if (isSignUpLoaded && signUp) {
        const result = await signUp.attemptEmailAddressVerification({
          code: fullCode,
        })

        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId })
          router.replace('/HomeScreen')
        } else {
          setError("Verification failed. Please try again.")
        }
      }
      // Handle sign-in verification
      else if (isSignInLoaded && signIn) {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: fullCode,
        })

        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId })
          router.replace('/HomeScreen')
        } else {
          setError("Verification failed. Please try again.")
        }
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      if (err.errors?.[0]?.code === "form_code_invalid") {
        setError("Invalid verification code. Please try again.")
      } else if (err.errors?.[0]?.code === "form_code_expired") {
        setError("Verification code has expired. Please request a new one.")
      } else {
        setError(err.errors?.[0]?.message || "Verification failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    try {
      setIsLoading(true)
      setError("")

      if (!isSignUpLoaded && !isSignInLoaded) {
        setError("Authentication service is not ready. Please try again.")
        return
      }

      // Handle sign-up resend
      if (isSignUpLoaded && signUp) {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        })
      }
      // Handle sign-in resend
      else if (isSignInLoaded && signIn) {
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
            setError("Email verification is not available. Please try again.")
          }
        }
      }

      setTimer(60)
      // Reset code fields
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      console.error("Failed to resend code:", err)
      setError(err.errors?.[0]?.message || "Failed to resend code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDigitPress = (digit: string) => {
    // Find the first empty slot
    const emptyIndex = code.findIndex((c) => c === "")

    if (emptyIndex !== -1) {
      const newCode = [...code]
      newCode[emptyIndex] = digit
      setCode(newCode)

      // Focus next input or dismiss keyboard if complete
      if (emptyIndex < 5) {
        inputRefs.current[emptyIndex + 1]?.focus()
      } else {
        Keyboard.dismiss()
      }
    }
  }

  const handleBackspace = () => {
    // Find the last non-empty slot
    const lastFilledIndex = [...code].reverse().findIndex((c) => c !== "")

    if (lastFilledIndex !== -1) {
      const actualIndex = 5 - lastFilledIndex
      const newCode = [...code]
      newCode[actualIndex] = ""
      setCode(newCode)
      inputRefs.current[actualIndex]?.focus()
    }
  }

  return (
    <SafeAreaView style={styles.container as ViewStyle}>
      <View style={styles.content as ViewStyle}>
        <View style={styles.logoContainer as ViewStyle}>
          <View style={styles.logo as ViewStyle} />
        </View>

        <Text style={styles.headerText as TextStyle}>Verification Code</Text>
        <Text style={styles.subHeaderText as TextStyle}>
          Please enter the code sent to{"\n"}
          {email}
        </Text>

        {error ? <Text style={styles.errorText as TextStyle}>{error}</Text> : null}

        <View style={styles.codeContainer as ViewStyle}>
          {code.map((digit, index) => (
            <View key={index} style={styles.codeInputWrapper as ViewStyle}>
              <TextInput
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.codeInput as TextStyle}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
              <View style={styles.codeUnderline as ViewStyle} />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.verifyButton as ViewStyle,
            isLoading && (styles.verifyButtonDisabled as ViewStyle),
          ]}
          onPress={handleVerify}
          disabled={isLoading || code.some((digit) => digit === "")}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.verifyButtonText as TextStyle}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.resendButton as ViewStyle,
            (timer > 0 || isLoading) && (styles.resendButtonDisabled as ViewStyle),
          ]}
          onPress={handleResendCode}
          disabled={timer > 0 || isLoading}
        >
          <Text style={styles.resendButtonText as TextStyle}>
            {timer > 0 ? `Resend Code (${timer}s)` : "Resend Code"}
          </Text>
        </TouchableOpacity>

        <View style={styles.keypadContainer as ViewStyle}>
          <View style={styles.keypad as ViewStyle}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.keypadButton as ViewStyle}
                onPress={() => handleDigitPress(digit.toString())}
              >
                <Text style={styles.keypadButtonText as TextStyle}>{digit}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.keypadButton as ViewStyle}
              onPress={() => handleDigitPress("0")}
            >
              <Text style={styles.keypadButtonText as TextStyle}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keypadButton as ViewStyle}
              onPress={handleBackspace}
            >
              <Ionicons name="backspace-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center" as const,
  },
  logoContainer: {
    marginVertical: 20,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  headerText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "bold" as const,
    marginBottom: 10,
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
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 30,
  },
  codeInputWrapper: {
    alignItems: "center" as const,
  },
  codeInput: {
    width: 40,
    height: 50,
    fontSize: 24,
    textAlign: "center",
    color: COLORS.text,
  },
  codeUnderline: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.text,
  },
  verifyButton: {
    width: "80%",
    marginBottom: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold" as const,
  },
  resendButton: {
    padding: 10,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  keypadContainer: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  keypadButton: {
    width: "30%",
    height: 60,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 10,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: COLORS.text,
  },
})

export default VerificationScreen
