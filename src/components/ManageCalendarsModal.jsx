"use client"

import { useState, useEffect } from "react"
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline"
import { getUserCalendars } from "../services/calendarService"
import { useAuth } from "../contexts/AuthContext"
import CreateCalendarModal from "./CreateCalendarModal"
import CalendarManageModal from "./CalendarManageModal"
import ShareCalendarModal from "./ShareCalendarModal"

export default function ManageCalendarsModal({
  isOpen,
  onClose,
  onCalendarCreated,
  onCalendarUpdated,
  onCalendarDeleted,
}) {
  const [calendars, setCalendars] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [selectedCalendar, setSelectedCalendar] = useState(null)
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchCalendars = async () => {
      if (!currentUser) return

      try {
        const userCalendars = await getUserCalendars(currentUser.uid)
        setCalendars(userCalendars)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching calendars:", error)
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchCalendars()
    }
  }, [currentUser, isOpen])

  const handleCalendarCreated = (newCalendar) => {
    setCalendars([...calendars, newCalendar])
    if (onCalendarCreated) {
      onCalendarCreated(newCalendar)
    }
  }

  const handleCalendarUpdated = (updatedCalendar) => {
    setCalendars(calendars.map((cal) => (cal.id === updatedCalendar.id ? updatedCalendar : cal)))
    if (onCalendarUpdated) {
      onCalendarUpdated(updatedCalendar)
    }
  }

  const handleCalendarDeleted = (calendarId) => {
    setCalendars(calendars.filter((cal) => cal.id !== calendarId))
    if (onCalendarDeleted) {
      onCalendarDeleted(calendarId)
    }
  }

  const handleManageCalendar = (calendar) => {
    setSelectedCalendar(calendar)
    setIsManageModalOpen(true)
  }

  const handleShareCalendar = (calendar) => {
    setSelectedCalendar(calendar)
    setIsShareModalOpen(true)
  }

  if (!isOpen) return null

  return (
    <>
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

            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Manage Calendars</h3>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center px-2 py-1 text-sm text-purple-600 hover:text-purple-800"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      New Calendar
                    </button>
                  </div>

                  <div className="mt-4">
                    {loading ? (
                      <div className="py-4 text-center text-gray-500">Loading calendars...</div>
                    ) : calendars.length === 0 ? (
                      <div className="py-4 text-center text-gray-500">
                        <p>No calendars found</p>
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="mt-2 inline-flex items-center text-sm text-purple-600 hover:text-purple-800"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Create your first calendar
                        </button>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {calendars.map((calendar) => (
                          <li key={calendar.id} className="py-3 flex items-center justify-between">
                            <div className="flex items-center">
                              <span
                                className="h-4 w-4 rounded-full mr-2"
                                style={{ backgroundColor: calendar.color }}
                              ></span>
                              <span className="text-sm font-medium text-gray-900">
                                {calendar.name}
                                {calendar.isDefault && <span className="ml-1 text-xs text-gray-500">(Default)</span>}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleManageCalendar(calendar)}
                              className="text-sm text-purple-600 hover:text-purple-800"
                            >
                              Manage
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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

      {isCreateModalOpen && (
        <CreateCalendarModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCalendarCreated={handleCalendarCreated}
        />
      )}

      {isManageModalOpen && selectedCalendar && (
        <CalendarManageModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          calendar={selectedCalendar}
          onCalendarUpdated={handleCalendarUpdated}
          onCalendarDeleted={handleCalendarDeleted}
          onShareCalendar={handleShareCalendar}
        />
      )}

      {isShareModalOpen && selectedCalendar && (
        <ShareCalendarModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          calendar={selectedCalendar}
        />
      )}
    </>
  )
}
