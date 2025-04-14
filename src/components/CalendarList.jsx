"use client"

import { useState, useEffect } from "react"
import { getUserCalendars } from "../services/calendarService"
import { useAuth } from "../contexts/AuthContext"
import { PlusIcon } from "@heroicons/react/24/outline"

export default function CalendarList({ onCalendarToggle, onCreateCalendar, selectedCalendars = [] }) {
  const [calendars, setCalendars] = useState([])
  const [loading, setLoading] = useState(true)
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

    fetchCalendars()
  }, [currentUser])

  if (loading) {
    return (
      <div className="py-2 px-1">
        <div className="animate-pulse flex space-x-2 items-center">
          <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (calendars.length === 0) {
    return (
      <div className="py-2 px-1">
        <div className="text-sm text-gray-500 mb-2">No calendars found</div>
        <button onClick={onCreateCalendar} className="flex items-center text-sm text-purple-600 hover:text-purple-800">
          <PlusIcon className="h-4 w-4 mr-1" />
          Create calendar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1 mt-1">
      {calendars.map((calendar) => (
        <div key={calendar.id} className="flex items-center py-1">
          <input
            type="checkbox"
            id={`calendar-${calendar.id}`}
            checked={selectedCalendars.includes(calendar.id)}
            onChange={() => onCalendarToggle(calendar)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <div className="flex items-center ml-2 flex-1">
            <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: calendar.color }}></span>
            <span className="text-sm text-gray-700">{calendar.name}</span>
            {calendar.isDefault && <span className="ml-1 text-xs text-gray-500">(Default)</span>}
          </div>
        </div>
      ))}
      <button
        onClick={onCreateCalendar}
        className="flex items-center text-sm text-purple-600 hover:text-purple-800 mt-2"
      >
        <PlusIcon className="h-4 w-4 mr-1" />
        Create calendar
      </button>
    </div>
  )
}
