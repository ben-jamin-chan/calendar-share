"use client"

import { useState } from "react"
import { format } from "date-fns"
import { collection, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"
import { XMarkIcon, ClockIcon, MapPinIcon, CalendarIcon, UserIcon, PencilIcon } from "@heroicons/react/24/outline"
import toast from "react-hot-toast"
import { createNewEventNotification, createSharedCalendarNotification } from "../services/notificationService"

export default function EventModal({ isOpen, onClose, selectedDate, event = null }) {
  const { currentUser } = useAuth()
  const [title, setTitle] = useState(event?.title || "")
  const [description, setDescription] = useState(event?.description || "")
  const [startDate, setStartDate] = useState(
    event?.start ? format(event.start, "yyyy-MM-dd") : format(selectedDate, "yyyy-MM-dd"),
  )
  const [startTime, setStartTime] = useState(event?.start ? format(event.start, "HH:mm") : "09:00")
  const [endDate, setEndDate] = useState(
    event?.end ? format(event.end, "yyyy-MM-dd") : format(selectedDate, "yyyy-MM-dd"),
  )
  const [endTime, setEndTime] = useState(event?.end ? format(event.end, "HH:mm") : "10:00")
  const [location, setLocation] = useState(event?.location || "")
  const [color, setColor] = useState(event?.color || "#6366f1")
  const [isShared, setIsShared] = useState(event?.isShared || false)
  const [sharedWith, setSharedWith] = useState(event?.sharedWith || [])
  const [sharedEmail, setSharedEmail] = useState("")

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

    try {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(`${endDate}T${endTime}`)

      if (start >= end) {
        toast.error("End time must be after start time")
        return
      }

      const eventData = {
        title,
        description,
        location,
        start: new Date(`${startDate}T${startTime}`),
        end: new Date(`${endDate}T${endTime}`),
        color,
        userId: currentUser.uid,
        isShared,
        sharedWith,
        createdAt: new Date(),
      }

      if (event) {
        // Update existing event
        await updateDoc(doc(db, "events", event.id), eventData)
        toast.success("Event updated")
      } else {
        // Create new event
        const docRef = await addDoc(collection(db, "events"), eventData)

        // Create notification for the event creator
        await createNewEventNotification(
          {
            ...eventData,
            id: docRef.id,
          },
          currentUser.uid,
        )

        // Create notifications for shared users
        if (isShared && sharedWith.length > 0) {
          const calendarName = "Personal" // Default calendar name

          for (const email of sharedWith) {
            // In a real app, you would query the user by email to get their ID
            // For now, we'll just use the email as a placeholder
            await createSharedCalendarNotification(currentUser.displayName || currentUser.email, email, calendarName)
          }
        }

        toast.success("Event created")
      }

      onClose()
    } catch (error) {
      console.error("Error saving event:", error)
      toast.error("Failed to save event")
    }
  }

  const handleDelete = async () => {
    if (!event) return

    try {
      await deleteDoc(doc(db, "events", event.id))
      toast.success("Event deleted")
      onClose()
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Failed to delete event")
    }
  }

  const addSharedUser = () => {
    if (!sharedEmail || sharedWith.includes(sharedEmail)) return
    setSharedWith([...sharedWith, sharedEmail])
    setSharedEmail("")
  }

  const removeSharedUser = (email) => {
    setSharedWith(sharedWith.filter((e) => e !== email))
  }

  if (!isOpen) return null

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
                  <div className="mt-2 space-y-4">
                    <div>
                      <div className="flex items-center">
                        <PencilIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <input
                          type="text"
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Add title"
                          required
                          className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-lg font-semibold"
                        />
                      </div>
                      <div className="mt-1 border-b border-gray-200 pb-2"></div>
                    </div>

                    <div className="flex items-start">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div>
                          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                            Start Date
                          </label>
                          <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                            Start Time
                          </label>
                          <input
                            type="time"
                            id="startTime"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div>
                          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                            End Date
                          </label>
                          <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                            End Time
                          </label>
                          <input
                            type="time"
                            id="endTime"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                      <div className="w-full">
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                          Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Add location"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="h-5 w-5 text-gray-400 mr-2 mt-1 flex items-center justify-center">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }}></span>
                      </div>
                      <div className="w-full">
                        <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                          Color
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
                    </div>

                    <div className="flex items-start">
                      <div className="w-full">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows="3"
                          placeholder="Add description"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        ></textarea>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                      <div className="w-full">
                        <div className="flex items-center">
                          <input
                            id="isShared"
                            type="checkbox"
                            checked={isShared}
                            onChange={(e) => setIsShared(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isShared" className="ml-2 block text-sm text-gray-900">
                            Share this event
                          </label>
                        </div>

                        {isShared && (
                          <div className="mt-3 space-y-2">
                            <div className="flex">
                              <input
                                type="email"
                                value={sharedEmail}
                                onChange={(e) => setSharedEmail(e.target.value)}
                                placeholder="Enter email to share with"
                                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                              />
                              <button
                                type="button"
                                onClick={addSharedUser}
                                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 sm:text-sm"
                              >
                                Add
                              </button>
                            </div>

                            {sharedWith.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Shared with:</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {sharedWith.map((email) => (
                                    <div
                                      key={email}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                    >
                                      {email}
                                      <button
                                        type="button"
                                        onClick={() => removeSharedUser(email)}
                                        className="ml-1.5 inline-flex text-purple-400 hover:text-purple-600"
                                      >
                                        <XMarkIcon className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 sm:ml-3 sm:w-auto"
              >
                {event ? "Update" : "Save"}
              </button>

              {event && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 sm:mt-0 sm:w-auto"
                >
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
