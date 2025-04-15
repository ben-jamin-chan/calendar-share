"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "./AuthContext"

const SharedCalendarsContext = createContext()

export function useSharedCalendars() {
  return useContext(SharedCalendarsContext)
}

export function SharedCalendarsProvider({ children }) {
  const [sharedCalendars, setSharedCalendars] = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchSharedCalendars = async () => {
      if (!currentUser) {
        setSharedCalendars([])
        setLoading(false)
        return
      }

      try {
        // Get calendars shared with the user
        const calendarsRef = collection(db, "calendars")
        const q = query(calendarsRef, where("sharedEmails", "array-contains", currentUser.email))
        const querySnapshot = await getDocs(q)

        const calendarsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }))

        setSharedCalendars(calendarsData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching shared calendars:", error)
        setLoading(false)
      }
    }

    fetchSharedCalendars()
  }, [currentUser])

  const value = {
    sharedCalendars,
    loading,
    refreshSharedCalendars: async () => {
      setLoading(true)
      try {
        const calendarsRef = collection(db, "calendars")
        const q = query(calendarsRef, where("sharedEmails", "array-contains", currentUser.email))
        const querySnapshot = await getDocs(q)

        const calendarsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }))

        setSharedCalendars(calendarsData)
      } catch (error) {
        console.error("Error refreshing shared calendars:", error)
      } finally {
        setLoading(false)
      }
    },
  }

  return <SharedCalendarsContext.Provider value={value}>{children}</SharedCalendarsContext.Provider>
}
