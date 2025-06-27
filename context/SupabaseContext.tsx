"use client"

import { createContext } from "react"

const SupabaseContext = createContext({})

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  return <SupabaseContext.Provider value={{}}>{children}</SupabaseContext.Provider>
}

export const useSupabase = () => {
  throw new Error("Supabase has been removed from this app.")
}