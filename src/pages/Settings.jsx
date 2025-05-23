"use client"

import { useState } from "react"
import { updateProfile } from "firebase/auth"
import { auth } from "../firebase"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import toast from "react-hot-toast"
import { useMediaQuery } from "../hooks/useMediaQuery"
import { useNavigate } from "react-router-dom"

export default function Settings() {
  const { currentUser } = useAuth()
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "")
  const [loading, setLoading] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const navigate = useNavigate()
  const [selectedCalendars, setSelectedCalendars] = useState([])

  // Add a function to navigate to the calendar page
  const navigateToCalendar = () => {
    navigate("/")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      await updateProfile(auth.currentUser, { displayName })
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const toggleMobileSidebar = (value) => {
    setMobileSidebarOpen(typeof value === "boolean" ? value : !mobileSidebarOpen)
  }

  // Dummy function for calendar toggle since we don't need it in settings
  const handleCalendarToggle = (calendar) => {
    setSelectedCalendars((prev) => {
      if (prev.includes(calendar.id)) {
        return prev.filter((id) => id !== calendar.id)
      } else {
        return [...prev, calendar.id]
      }
    })
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        isMobile={isMobile}
        toggleMobileSidebar={mobileSidebarOpen}
        onCreateEvent={navigateToCalendar}
        selectedCalendars={selectedCalendars}
        onCalendarToggle={handleCalendarToggle}
      />

      {/* Mobile sidebar backdrop */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75" onClick={() => toggleMobileSidebar(false)}></div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Navbar toggleMobileSidebar={toggleMobileSidebar} />

        <main className="flex-1 overflow-y-auto p-4 pb-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h1>

            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Profile Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Update your personal details.</p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={currentUser?.email || ""}
                      disabled
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed.</p>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Display name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Notification Settings</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Manage your notification preferences.
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="notifications"
                        name="notifications"
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={(e) => setNotificationsEnabled(e.target.checked)}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 dark:border-gray-600 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="notifications" className="font-medium text-gray-700 dark:text-gray-300">
                        Enable notifications
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Receive in-app notifications for calendar events and updates.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email-notifications"
                        name="email-notifications"
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 dark:border-gray-600 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="email-notifications" className="font-medium text-gray-700 dark:text-gray-300">
                        Email notifications
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Receive email notifications for shared calendar events.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification types</h4>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="event-reminders"
                            name="event-reminders"
                            type="checkbox"
                            defaultChecked={true}
                            className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 dark:border-gray-600 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="event-reminders" className="font-medium text-gray-700 dark:text-gray-300">
                            Event reminders
                          </label>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="shared-calendars"
                            name="shared-calendars"
                            type="checkbox"
                            defaultChecked={true}
                            className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 dark:border-gray-600 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="shared-calendars" className="font-medium text-gray-700 dark:text-gray-300">
                            Shared calendars
                          </label>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="new-events"
                            name="new-events"
                            type="checkbox"
                            defaultChecked={true}
                            className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 dark:border-gray-600 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="new-events" className="font-medium text-gray-700 dark:text-gray-300">
                            New events
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5">
                    <button
                      type="button"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-900"
                    >
                      Save notification settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
