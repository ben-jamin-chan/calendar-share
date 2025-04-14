"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { getUserCalendars, createCalendar, updateCalendar, deleteCalendar, shareCalendarWithUsers } from "../services/calendarService"
import { collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"

const CalendarContext = createContext()

export function useCalendar() {
  return useContext(CalendarContext)
}

export function CalendarProvider({ children }) {
  const [userCalendars, setUserCalendars] = useState([])
  const [selectedCalendarId, setSelectedCalendarId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [defaultCalendarCreated, setDefaultCalendarCreated] = useState(false)
  const [calendarCheckCompleted, setCalendarCheckCompleted] = useState(false)
  const { currentUser } = useAuth()

  // Load user calendars when user logs in
  useEffect(() => {
    if (!currentUser) return
    
    setLoading(true)
    
    console.log("Setting up calendar subscriptions for:", currentUser.uid)
    
    // Listen for calendars where user is the owner
    const calendarRef = collection(db, "calendars")
    const ownedQuery = query(calendarRef, where("ownerId", "==", currentUser.uid))
    
    const unsubscribeOwned = onSnapshot(ownedQuery, 
      (snapshot) => {
        try {
          if (snapshot.empty && !defaultCalendarCreated) {
            console.log("No owned calendars found, creating default calendar")
            createDefaultCalendar()
          } else {
            const ownedCalendars = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              isOwner: true
            }))
            
            console.log("Owned calendars loaded:", ownedCalendars.length)
            
            // Set first owned calendar as selected if none is selected yet
            if (ownedCalendars.length > 0 && (!selectedCalendarId || !userCalendars.some(cal => cal.id === selectedCalendarId))) {
              console.log("Setting selected calendar to:", ownedCalendars[0].id)
              setSelectedCalendarId(ownedCalendars[0].id)
            }
            
            setUserCalendars(ownedCalendars)
          }
          
          setCalendarCheckCompleted(true)
          setLoading(false)
        } catch (error) {
          console.error("Error processing owned calendars:", error)
          setLoading(false)
          setCalendarCheckCompleted(true)
        }
      },
      (error) => {
        console.error("Error listening to owned calendars:", error)
        setLoading(false)
        setCalendarCheckCompleted(true)
      }
    )
    
    // Shared calendars listener can be added later
    
    return () => {
      console.log("Cleaning up calendar subscriptions")
      unsubscribeOwned()
    }
  }, [currentUser, defaultCalendarCreated])

  // Create a default calendar if none exists
  const createDefaultCalendar = async () => {
    if (defaultCalendarCreated) {
      console.log("Default calendar already created - skipping")
      return
    }
    
    console.log("Creating default calendar for user:", currentUser.uid)
    setDefaultCalendarCreated(true)  // Mark as created right away to prevent duplicate attempts
    
    try {
      const newCalendar = {
        name: "My Calendar",
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
        color: "#4285F4"
      }
      
      const docRef = await addDoc(collection(db, "calendars"), newCalendar)
      console.log("Default calendar created with ID:", docRef.id)
      
      // No need to manually update local state since the onSnapshot listener will catch this
    } catch (error) {
      console.error("Error creating default calendar:", error)
    }
  }

  // Helper function to update calendars without duplicates
  const updateCalendars = (newCalendars, type) => {
    setUserCalendars(prevCalendars => {
      // Remove calendars of the same type (owned/shared)
      const filteredCalendars = prevCalendars.filter(cal => 
        type === "owned" ? !cal.isOwner : cal.isOwner
      )
      
      // Combine with new calendars
      const updated = [...filteredCalendars, ...newCalendars]
      
      // If no calendar is selected, select the first one
      if (!selectedCalendarId && updated.length > 0) {
        setSelectedCalendarId(updated[0].id)
      }
      
      setLoading(false)
      return updated
    })
  }

  // Create a new calendar
  const createNewCalendar = async (name, color, sharedWith = []) => {
    if (!currentUser) return null
    
    try {
      return await createCalendar(
        name,
        currentUser.uid,
        currentUser.email,
        currentUser.displayName || currentUser.email,
        sharedWith,
        color
      )
    } catch (error) {
      console.error("Error creating calendar:", error)
      throw error
    }
  }
  
  // Update calendar
  const updateUserCalendar = async (calendarId, calendarData) => {
    try {
      await updateCalendar(calendarId, calendarData)
    } catch (error) {
      console.error("Error updating calendar:", error)
      throw error
    }
  }
  
  // Delete calendar
  const deleteUserCalendar = async (calendarId) => {
    try {
      await deleteCalendar(calendarId)
      
      if (selectedCalendarId === calendarId) {
        // If deleted calendar was selected, select another one
        const remainingCalendars = userCalendars.filter(cal => cal.id !== calendarId)
        setSelectedCalendarId(remainingCalendars.length > 0 ? remainingCalendars[0].id : null)
      }
    } catch (error) {
      console.error("Error deleting calendar:", error)
      throw error
    }
  }
  
  // Share calendar with users
  const shareCalendar = async (calendarId, emails) => {
    try {
      await shareCalendarWithUsers(calendarId, emails)
    } catch (error) {
      console.error("Error sharing calendar:", error)
      throw error
    }
  }

  // Get the currently selected calendar
  const getSelectedCalendar = () => {
    return userCalendars.find(cal => cal.id === selectedCalendarId) || null
  }

  const value = {
    userCalendars,
    selectedCalendarId,
    setSelectedCalendarId,
    loading,
    createNewCalendar,
    updateUserCalendar,
    deleteUserCalendar,
    shareCalendar,
    getSelectedCalendar,
    defaultCalendarCreated,
    createDefaultCalendar
  }

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
} 