import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"

/**
 * Creates a notification for a user
 * @param {string} userId - The user ID to create the notification for
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The notification type (event_reminder, shared_calendar, new_event)
 * @returns {Promise<string>} - The notification ID
 */
export const createNotification = async (userId, title, message, type) => {
  try {
    const notificationRef = await addDoc(collection(db, "notifications"), {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
    })
    return notificationRef.id
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

/**
 * Creates an event reminder notification
 * @param {string} userId - The user ID to create the notification for
 * @param {Object} event - The event object
 * @param {number} minutesBefore - Minutes before the event to send the reminder
 * @returns {Promise<string>} - The notification ID
 */
export const createEventReminderNotification = async (userId, event, minutesBefore = 30) => {
  const title = `Reminder: ${event.title}`
  const message = `Your event "${event.title}" starts in ${minutesBefore} minutes.`
  return createNotification(userId, title, message, "event_reminder")
}

/**
 * Creates a shared calendar notification
 * @param {string} userId - The user ID to create the notification for
 * @param {string} sharerName - The name of the user who shared the calendar
 * @param {string} calendarName - The name of the shared calendar
 * @returns {Promise<string>} - The notification ID
 */
export const createSharedCalendarNotification = async (userId, sharerName, calendarName) => {
  const title = `New Shared Calendar`
  const message = `${sharerName} has shared their calendar "${calendarName}" with you.`
  return createNotification(userId, title, message, "shared_calendar")
}

/**
 * Creates a new event notification
 * @param {string} userId - The user ID to create the notification for
 * @param {Object} event - The event object
 * @param {string} creatorName - The name of the user who created the event
 * @returns {Promise<string>} - The notification ID
 */
export const createNewEventNotification = async (userId, event, creatorName) => {
  const title = `New Event: ${event.title}`
  const message = `${creatorName} has added a new event "${event.title}" to your calendar.`
  return createNotification(userId, title, message, "new_event")
}
