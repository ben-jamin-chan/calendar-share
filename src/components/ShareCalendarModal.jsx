"use client"

import { useState } from "react"
import { XMarkIcon, UserPlusIcon } from "@heroicons/react/24/outline"
import { shareCalendarWithUser, removeUserFromCalendar } from "../services/calendarService"
import toast from "react-hot-toast"
import { createSharedCalendarNotification } from "../services/notificationService"
import { useAuth } from "../contexts/AuthContext"

export default function ShareCalendarModal({ isOpen, onClose, calendar }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const { currentUser } = useAuth()

  const handleShare = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    // Check if already shared
    if (calendar.sharedEmails.includes(email)) {
      toast.error("Calendar already shared with this email")
      return
    }

    try {
      setLoading(true)
      
      // Make sure we're passing the owner's email and name when sharing
      const ownerInfo = {
        ownerEmail: currentUser.email,
        ownerName: currentUser.displayName || currentUser.email.split("@")[0],
      }
      
      await shareCalendarWithUser(calendar.id, email, ownerInfo)

      // Create notification for the shared user
      // In a real app, you would get the user ID from the email
      // For now, we'll just use the email as a placeholder
      await createSharedCalendarNotification(
        email, // This should be the user ID in a real app
        currentUser.displayName || currentUser.email,
        calendar.name,
      )

      toast.success(`Calendar shared with ${email}`)
      setEmail("")
      onClose()
    } catch (error) {
      console.error("Error sharing calendar:", error)
      toast.error("Failed to share calendar")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (emailToRemove) => {
    try {
      setLoading(true)
      await removeUserFromCalendar(calendar.id, emailToRemove)
      toast.success(`Removed ${emailToRemove} from calendar`)

      // Update the calendar object in the parent component
      const updatedSharedEmails = calendar.sharedEmails.filter((e) => e !== emailToRemove)
      calendar.sharedEmails = updatedSharedEmails
    } catch (error) {
      console.error("Error removing user from calendar:", error)
      toast.error("Failed to remove user from calendar")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !calendar) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 transition-opacity">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Share Calendar</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Share{" "}
                    <span className="font-medium" style={{ color: calendar.color }}>
                      {calendar.name}
                    </span>{" "}
                    with others
                  </p>
                </div>

                <form onSubmit={handleShare} className="mt-4">
                  <div className="flex">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-transparent rounded-r-md bg-orange-600 text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlusIcon className="h-4 w-4 mr-1" />
                      Share
                    </button>
                  </div>
                </form>

                {calendar.sharedEmails && calendar.sharedEmails.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Shared with:</h4>
                    <ul className="mt-2 divide-y divide-gray-200">
                      {calendar.sharedEmails.map((sharedEmail) => (
                        <li key={sharedEmail} className="py-2 flex justify-between items-center">
                          <span className="text-sm text-gray-600">{sharedEmail}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(sharedEmail)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
