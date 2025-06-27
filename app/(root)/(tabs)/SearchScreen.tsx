"use client"

import { useState, useRef } from "react"
import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import Icon from "react-native-vector-icons/Ionicons"
import UserItem from "@/components/user-item"

const API_BASE_URL = "https://chitamrita-backend.vercel.app/api";

export default function SearchScreen() {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    if (!query) {
      setUsers([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceTimeout.current = setTimeout(() => {
      fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setUsers(data.users || [])
        })
        .catch(() => setUsers([]))
        .finally(() => setLoading(false))
    }, 400)
  }

  const renderUser = ({ item }: { item: any }) => (
    <UserItem user={item} />
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meet new people</Text>
        <Text style={styles.subtitle}>Build connections</Text>
      </View>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      {loading && <ActivityIndicator size="large" color="#9333EA" style={{ marginTop: 20 }} />}
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.usersList}
        ListEmptyComponent={!loading && searchQuery ? <Text style={styles.noResults}>No users found.</Text> : null}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  usersList: {
    paddingBottom: 100,
  },
  noResults: {
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
})
