"use client"

import { Fragment, useState, useEffect } from "react"
import { Menu, Transition } from "@headlessui/react"
import { BellIcon, CheckIcon, CalendarIcon, UsersIcon, ClockIcon } from "@heroicons/react/24/outline"
import { format } from "date-fns"
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"

export default function NotificationsDropdown() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    // Create a simpler query that doesn't require a composite index
    const notificationsRef = collection(db, "notifications")
    const q = query(
      notificationsRef,
      where("userId", "==", currentUser.uid),
      // Removed the orderBy to avoid requiring a composite index
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const notificationsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }))

          // Sort client-side instead of using orderBy in the query
          notificationsData.sort((a, b) => b.createdAt - a.createdAt)

          // Take only the first 10 after sorting
          const limitedData = notificationsData.slice(0, 10)

          setNotifications(limitedData)
          setUnreadCount(limitedData.filter((n) => !n.read).length)
          setLoading(false)
        } catch (err) {
          console.error("Error processing notifications:", err)
          setError(err.message)
          setLoading(false)
        }
      },
      (err) => {
        console.error("Error fetching notifications:", err)
        setError(err.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [currentUser])

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, {
        read: true,
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)

      // Update each unread notification
      const updatePromises = unreadNotifications.map((notification) => {
        const notificationRef = doc(db, "notifications", notification.id)
        return updateDoc(notificationRef, { read: true })
      })

      await Promise.all(updatePromises)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "event_reminder":
        return <ClockIcon className="h-5 w-5 text-purple-500" />
      case "shared_calendar":
        return <UsersIcon className="h-5 w-5 text-blue-500" />
      case "new_event":
        return <CalendarIcon className="h-5 w-5 text-green-500" />
      default:
        return <CalendarIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return format(date, "MMM d")
  }

  // If there's an error, render a simplified version without the query
  if (error) {
    return (
      <Menu as="div" className="relative">
        <div>
          <Menu.Button className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              <div className="flex justify-center mb-3">
                <BellIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p>Unable to load notifications</p>
              <p className="mt-1 text-xs">Please try again later</p>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    )
  }

  return (
    <Menu as="div" className="relative">
      <div>
        <Menu.Button className="relative rounded-full bg-white dark:bg-gray-700 p-1 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
          <span className="sr-only">View notifications</span>
          <BellIcon className="h-6 w-6" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white font-bold flex items-center justify-center transform translate-x-1/2 -translate-y-1/2">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center"
              >
                <CheckIcon className="h-3 w-3 mr-1" />
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <div className="flex justify-center mb-3">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-600 dark:border-purple-400"></div>
              </div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <div className="flex justify-center mb-3">
                <BellIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p>No notifications yet</p>
              <p className="mt-1 text-xs">We'll notify you when something happens</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  {({ active }) => (
                    <div
                      className={`
                        ${active ? "bg-gray-50 dark:bg-gray-700" : ""}
                        ${!notification.read ? "bg-purple-50 dark:bg-purple-900/30" : ""}
                        px-4 py-3 flex cursor-pointer
                      `}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex-shrink-0 mr-3 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${!notification.read ? "font-medium text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </Menu.Item>
              ))}
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
