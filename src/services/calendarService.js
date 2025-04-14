import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../firebase"

/**
 * Creates a new calendar
 * @param {string} userId - The user ID who owns the calendar
 * @param {string} name - The calendar name
 * @param {string} color - The calendar color
 * @param {boolean} isDefault - Whether this is the default calendar
 * @returns {Promise<string>} - The calendar ID
 */
export const createCalendar = async (userId, name, color, isDefault = false) => {
  try {
    const calendarRef = await addDoc(collection(db, "calendars"), {
      name,
      color,
      ownerId: userId,
      isDefault,
      members: [userId], // Owner is always a member
      sharedEmails: [], // Emails of users this calendar is shared with
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return calendarRef.id
  } catch (error) {
    console.error("Error creating calendar:", error)
    throw error
  }
}

/**
 * Creates a default calendar for a new user
 * @param {string} userId - The user ID
 * @param {string} displayName - The user's display name
 * @returns {Promise<string>} - The calendar ID
 */
export const createDefaultCalendar = async (userId, displayName) => {
  const name = `${displayName}'s Calendar`
  return createCalendar(userId, name, "#6366f1", true)
}

/**
 * Gets all calendars for a user (owned and shared)
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of calendar objects
 */
export const getUserCalendars = async (userId) => {
  try {
    const q = query(collection(db, "calendars"), where("members", "array-contains", userId))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }))
  } catch (error) {
    console.error("Error getting user calendars:", error)
    throw error
  }
}

/**
 * Gets a calendar by ID
 * @param {string} calendarId - The calendar ID
 * @returns {Promise<Object>} - The calendar object
 */
export const getCalendarById = async (calendarId) => {
  try {
    const calendarDoc = await getDoc(doc(db, "calendars", calendarId))
    if (!calendarDoc.exists()) {
      throw new Error("Calendar not found")
    }

    return {
      id: calendarDoc.id,
      ...calendarDoc.data(),
      createdAt: calendarDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: calendarDoc.data().updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error("Error getting calendar:", error)
    throw error
  }
}

/**
 * Updates a calendar
 * @param {string} calendarId - The calendar ID
 * @param {Object} data - The data to update
 * @returns {Promise<void>}
 */
export const updateCalendar = async (calendarId, data) => {
  try {
    await updateDoc(doc(db, "calendars", calendarId), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating calendar:", error)
    throw error
  }
}

/**
 * Deletes a calendar
 * @param {string} calendarId - The calendar ID
 * @returns {Promise<void>}
 */
export const deleteCalendar = async (calendarId) => {
  try {
    await deleteDoc(doc(db, "calendars", calendarId))
  } catch (error) {
    console.error("Error deleting calendar:", error)
    throw error
  }
}

/**
 * Shares a calendar with another user
 * @param {string} calendarId - The calendar ID
 * @param {string} email - The email of the user to share with
 * @returns {Promise<void>}
 */
export const shareCalendarWithUser = async (calendarId, email) => {
  try {
    const calendarDoc = await getDoc(doc(db, "calendars", calendarId))
    if (!calendarDoc.exists()) {
      throw new Error("Calendar not found")
    }

    const calendarData = calendarDoc.data()
    const sharedEmails = [...(calendarData.sharedEmails || []), email]

    // Update the calendar with the new shared email
    await updateDoc(doc(db, "calendars", calendarId), {
      sharedEmails,
      updatedAt: serverTimestamp(),
    })

    // Also add the user to the members array so they can access the calendar
    // In a real app, you'd look up the user ID from the email
    // For now, we'll just use the email as a placeholder
    const members = [...(calendarData.members || [])]
    if (!members.includes(email)) {
      members.push(email)
      await updateDoc(doc(db, "calendars", calendarId), {
        members,
        updatedAt: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error("Error sharing calendar:", error)
    throw error
  }
}

/**
 * Removes a user from a shared calendar
 * @param {string} calendarId - The calendar ID
 * @param {string} email - The email of the user to remove
 * @returns {Promise<void>}
 */
export const removeUserFromCalendar = async (calendarId, email) => {
  try {
    const calendarDoc = await getDoc(doc(db, "calendars", calendarId))
    if (!calendarDoc.exists()) {
      throw new Error("Calendar not found")
    }

    const calendarData = calendarDoc.data()
    const sharedEmails = calendarData.sharedEmails.filter((e) => e !== email)
    const members = calendarData.members.filter((m) => m !== email)

    await updateDoc(doc(db, "calendars", calendarId), {
      sharedEmails,
      members,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error removing user from calendar:", error)
    throw error
  }
}

/**
 * Gets all events for a calendar
 * @param {string} calendarId - The calendar ID
 * @returns {Promise<Array>} - Array of event objects
 */
export const getCalendarEvents = async (calendarId) => {
  try {
    const q = query(collection(db, "events"), where("calendarId", "==", calendarId))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      start: doc.data().start.toDate(),
      end: doc.data().end.toDate(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }))
  } catch (error) {
    console.error("Error getting calendar events:", error)
    throw error
  }
}
