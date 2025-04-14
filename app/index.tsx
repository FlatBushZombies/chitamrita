"use client"

import { useEffect } from "react"

import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, SafeAreaView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "@clerk/clerk-expo"
import { COLORS } from "@/config/config"
import { images } from "@/constants/images"
import { router } from "expo-router"

const LandingScreen = () => {
  const navigation = useNavigation()
  const { isSignedIn } = useAuth()

  // If user is already signed in, redirect to main app
  useEffect(() => {
    if (isSignedIn) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      })
    }
  }, [isSignedIn])

  const handleSignUp = () => {
    router.push("/(auth)/sign-up")
  }

  const handleLogin = () => {
    router.push("/(auth)/LoginScreen")
  }

  const viewTerms = () => {
    router.replace("/(auth)/get-started")
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={images.background}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo} />
            </View>
            <Text style={styles.appName}>Chitamrita</Text>
            <View style={styles.authButtons}>
              <TouchableOpacity style={styles.authButton} onPress={handleSignUp}>
                <Text style={styles.authButtonText}>sign up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.authButton} onPress={handleLogin}>
                <Text style={styles.authButtonText}>log in</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.getStartedButton} onPress={viewTerms}>
              <Text style={styles.getStartedText}>Swipe to get started</Text>
              <Ionicons name="arrow-forward-circle" size={24} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.bottomBar}>
              <View style={styles.languageSelector}>
                <Text style={styles.languageText}>english</Text>
                <Ionicons name="globe-outline" size={20} color={COLORS.text} />
              </View>
              <TouchableOpacity style={styles.bottomButton}>
                <Text style={styles.bottomButtonText}>premium</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bottomButton}>
                <Text style={styles.bottomButtonText}>support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundImage: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  appName: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  authButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: -25,
  },
  authButton: {
    marginLeft: 15,
  },
  authButtonText: {
    color: COLORS.text,
    fontSize: 16,
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  getStartedButton: {
    backgroundColor: "rgba(168, 85, 247, 0.8)",
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  getStartedText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
    marginRight: 10,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(168, 85, 247, 0.8)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  languageText: {
    color: COLORS.text,
    marginRight: 5,
  },
  bottomButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  bottomButtonText: {
    color: COLORS.text,
  },
})

export default LandingScreen
