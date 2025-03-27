import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native"
import * as WebBrowser from "expo-web-browser"

import { useOAuth, useSignIn, useSignUp} from '@clerk/clerk-expo';

import { Ionicons } from "@expo/vector-icons"
import { Redirect, router} from "expo-router"
import { useNavigation } from "@react-navigation/native";
import { images } from "@/constants/images"
import { SafeAreaView } from "react-native-safe-area-context"

import { makeRedirectUri } from "expo-auth-session"

const { width } = Dimensions.get("window")

WebBrowser.maybeCompleteAuthSession()

export default function SignIn() {

  /* const {isLoaded , signUp} = useSignUp()
  const { signIn } = useSignIn()
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" })
  const navigation = useNavigation() */

  const redirectUrl = makeRedirectUri({
    scheme: process.env.EXPO_PUBLIC_APP_SCHEME || "chitamrita",
  })

 /* const handleGoogleSignIn = async () => {
    if (!isLoaded) {
      return
    }

    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl,
      })

      if (createdSessionId) {
        await setActive({ session: createdSessionId })
        navigation.navigate("Chat" as never)
      }
    } catch (err) {
      console.error("OAuth error", err)
    }
  }
    */


 const handleSignIn = () => {
 }

  return (
    <SafeAreaView>
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={images.illustration}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.welcomeText}>WELCOME TO VIBEX</Text>

      <View style={styles.taglineContainer}>
        <Text style={styles.purpleText}>Secure, Private, </Text>
        <Text style={styles.blackText}>Connected</Text>
      </View>

      <Text style={styles.signupText}>SignUp to chitamrita</Text>
      <TouchableOpacity style={styles.googleButton} onPress={handleSignIn} >
        <Ionicons name="logo-google" size={20} color="#000" />
        <Text style={styles.buttonText}>Sign Up with Google</Text>
      </TouchableOpacity>

      <View style={styles.paginationContainer}>
        <View style={styles.paginationIndicator} />
      </View>
    </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  welcomeText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
    letterSpacing: 1,
  },
  taglineContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  purpleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#9370DB",
  },
  blackText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  signupText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: "100%",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
  },
  paginationIndicator: {
    width: 50,
    height: 4,
    backgroundColor: "#000",
    borderRadius: 2,
  },
})
