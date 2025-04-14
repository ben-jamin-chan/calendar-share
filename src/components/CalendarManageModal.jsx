"use client"

import { useState, useEffect } from "react"
import { XMarkIcon, TrashIcon, ShareIcon } from "@heroicons/react/24/outline"
import { updateCalendar, deleteCalendar } from "../services/calendarService"
import toast from "react-hot-toast"

export default function CalendarManageModal({
  isOpen,
  onClose,
  calendar,
  onCalendarUpdated,
  onCalendarDeleted,
  onShareCalendar,
}) {
  const [name, setName] = useState("")
  const [color, setColor] = useState("")
  const [loading, setLoading] = useState(false)
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (calendar) {
      setName(calendar.name || "")
      setColor(calendar.color || "#6366f1")
      setIsDefault(calendar.isDefault || false)
    }
  }, [calendar])

  const colorOptions = [
    { name: "Indigo", value: "#6366f1" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Yellow", value: "#f59e0b" },
    { name: "Red", value: "#ef4444" },
    { name: "Pink", value: "#ec4899" },
    { name: "Purple", value: "#8b5cf6" },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter a calendar name")
      return
    }

    try {
      setLoading(true)
      await updateCalendar(calendar.id, { name, color, isDefault })

      toast.success("Calendar updated successfully")

      if (onCalendarUpdated) {
        onCalendarUpdated({
          ...calendar,
          name,
          color,
          isDefault,
        })
      }

      onClose()
    } catch (error) {
      console.error("Error updating calendar:", error)
      toast.error("Failed to update calendar")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!calendar) return

    if (calendar.isDefault) {
      toast.error("Cannot delete default calendar")
      return
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${calendar.name}"? This will delete all events in this calendar.`,
      )
    ) {
      return
    }

    try {
      setLoading(true)
      await deleteCalendar(calendar.id)

      toast.success("Calendar deleted")

      if (onCalendarDeleted) {
        onCalendarDeleted(calendar.id)
      }

      onClose()
    } catch (error) {
      console.error("Error deleting calendar:", error)
      toast.error("Failed to delete calendar")
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
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Manage Calendar</h3>
                    <button
                      type="button"
                      onClick={() => onShareCalendar(calendar)}
                      className="inline-flex items-center px-2 py-1 text-sm text-purple-600 hover:text-purple-800"
                    >
                      <ShareIcon className="h-4 w-4 mr-1" />
                      Share
                    </button>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Calendar Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter calendar name"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                        Calendar Color
                      </label>
                      <div className="mt-1 flex space-x-2">
                        {colorOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`h-6 w-6 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                              color === option.value ? "ring-2 ring-offset-2 ring-purple-500" : ""
                            }`}
                            style={{ backgroundColor: option.value }}
                            onClick={() => setColor(option.value)}
                            title={option.name}
                          ></button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="isDefault"
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                        Set as default calendar
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>

              {!calendar.isDefault && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
