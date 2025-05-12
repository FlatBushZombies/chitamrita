import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { View, StyleSheet } from "react-native"

export default function AppLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#121212",
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#9333EA",
        tabBarInactiveTintColor: "#FFFFFF",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="SearchScreen"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTab : {}}>
              <Ionicons name="home" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTab : {}}>
              <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTab : {}}>
              <Ionicons name="add-circle" size={size + 10} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ChatListScreen"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTab : {}}>
              <Ionicons name="notifications-outline" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTab : {}}>
              <Ionicons name="person-circle-outline" size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: "#1E1E1E",
    borderRadius: 50,
    padding: 8,
  },
})
