import { collection, addDoc } from "firebase/firestore"
import { db } from "../firebase"

/**
 * Creates a new notification in Firestore
 * @param {Object} notification - The notification object
 * @param {string} notification.userId - The user ID to send the notification to
 * @param {string} notification.title - The notification title
 * @param {string} notification.message - The notification message
 * @param {string} notification.type - The notification type (event_reminder, shared_calendar, new_event)
 * @param {string} notification.eventId - Optional: The related event ID
 * @returns {Promise<string>} - The notification ID
 */
export const createNotification = async (notification) => {
  try {
    const notificationData = {
      ...notification,
      read: false,
      createdAt: new Date(),
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    return docRef.id
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

/**
 * Creates an event reminder notification
 * @param {Object} event - The event object
 * @param {string} userId - The user ID to send the notification to
 * @returns {Promise<string>} - The notification ID
 */
export const createEventReminderNotification = async (event, userId) => {
  return createNotification({
    userId,
    title: "Upcoming Event Reminder",
    message: `Your event "${event.title}" is coming up soon.`,
    type: "event_reminder",
    eventId: event.id,
  })
}

/**
 * Creates a shared calendar notification
 * @param {string} sharedByUserId - The user ID who shared the calendar
 * @param {string} sharedWithUserId - The user ID to share with
 * @param {string} calendarName - The name of the shared calendar
 * @returns {Promise<string>} - The notification ID
 */
export const createSharedCalendarNotification = async (sharedByUserId, sharedWithUserId, calendarName) => {
  return createNotification({
    userId: sharedWithUserId,
    title: "Calendar Shared With You",
    message: `${sharedByUserId} has shared their "${calendarName}" calendar with you.`,
    type: "shared_calendar",
  })
}

/**
 * Creates a new event notification
 * @param {Object} event - The event object
 * @param {string} userId - The user ID to send the notification to
 * @returns {Promise<string>} - The notification ID
 */
export const createNewEventNotification = async (event, userId) => {
  return createNotification({
    userId,
    title: "New Event Added",
    message: `A new event "${event.title}" has been added to your calendar.`,
    type: "new_event",
    eventId: event.id,
  })
}
