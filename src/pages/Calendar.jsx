"use client"

import { useState, useEffect } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  addMinutes,
  isBefore,
  isWithinInterval,
  isAfter,
} from "date-fns"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import EventModal from "../components/EventModal"
import CalendarHeader from "../components/CalendarHeader"
import { PlusIcon } from "@heroicons/react/24/outline"
import { useMediaQuery } from "../hooks/useMediaQuery"
import { createEventReminderNotification } from "../services/notificationService"

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [view, setView] = useState("month") // 'month', 'week', 'day'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { currentUser } = useAuth()
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    if (!currentUser) return

    // Query events for the current user
    const eventsRef = collection(db, "events")
    const q = query(eventsRef, where("userId", "==", currentUser.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start.toDate(),
        end: doc.data().end.toDate(),
      }))
      setEvents(eventsData)

      // Check for upcoming events and create reminders
      const now = new Date()
      const thirtyMinutesFromNow = addMinutes(now, 30)

      eventsData.forEach((event) => {
        // If event starts within the next 30 minutes and hasn't started yet
        if (isBefore(event.start, thirtyMinutesFromNow) && isBefore(now, event.start)) {
          // In a real app, you'd check if a reminder has already been sent
          // For demo purposes, we'll create a notification
          createEventReminderNotification(event, currentUser.uid).catch((err) =>
            console.error("Error creating reminder notification:", err),
          )
        }
      })
    })

    return unsubscribe
  }, [currentUser])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const handleViewChange = (newView, date = currentDate) => {
    setView(newView)
    setCurrentDate(date)
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setIsModalOpen(true)
  }

  const handleEventClick = (event, e) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setSelectedDate(event.start)
    setIsModalOpen(true)
  }

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen)
  }

  // Get events for a specific day, including multi-day events
  const getEventsForDay = (day) => {
    return events.filter((event) => {
      // Check if the day is the start date
      const isStartDay = isSameDay(parseISO(event.start.toISOString()), day)

      // Check if the day is between start and end dates (for multi-day events)
      const isWithinEvent = isWithinInterval(day, {
        start: event.start,
        end: event.end,
      })

      return isStartDay || isWithinEvent
    })
  }

  // Format event display for multi-day events
  const formatEventForDay = (event, day) => {
    const isStartDay = isSameDay(parseISO(event.start.toISOString()), day)
    const isEndDay = isSameDay(parseISO(event.end.toISOString()), day)

    let displayTitle = event.title

    // Add indicators for multi-day events
    if (!isStartDay && !isEndDay) {
      // Middle day of multi-day event
      displayTitle = `${event.title} (cont.)`
    } else if (!isStartDay && isEndDay) {
      // Last day of multi-day event
      displayTitle = `${event.title} (ends)`
    } else if (isStartDay && !isEndDay && !isSameDay(event.start, event.end)) {
      // First day of multi-day event
      displayTitle = `${event.title} (starts)`
    }

    return {
      ...event,
      displayTitle,
    }
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Calendar grid header - days of week */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div key={index} className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-500">
              {isMobile ? day : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index]}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day)
            const isToday = isSameDay(day, new Date())
            return (
              <div
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                className={`${isMobile ? "min-h-[60px]" : "min-h-[100px]"} bg-white p-1 ${
                  isSameMonth(day, currentDate) ? "text-gray-900" : "text-gray-400"
                } hover:bg-gray-50 cursor-pointer`}
              >
                <div
                  className={`font-medium text-sm ${isToday ? "h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto" : ""}`}
                >
                  {format(day, "d")}
                </div>
                <div className={`mt-1 space-y-1 ${isMobile ? "max-h-[40px]" : "max-h-[80px]"} overflow-y-auto`}>
                  {dayEvents.slice(0, isMobile ? 1 : 3).map((event) => {
                    const formattedEvent = formatEventForDay(event, day)
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className="px-1 py-0.5 text-xs rounded truncate text-white transition-colors duration-200 hover:brightness-90 hover:shadow-sm"
                        style={{
                          backgroundColor: event.color || "#6366f1",
                        }}
                      >
                        {formattedEvent.displayTitle}
                      </div>
                    )
                  })}
                  {dayEvents.length > (isMobile ? 1 : 3) && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - (isMobile ? 1 : 3)} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-8 border-b">
          <div className="border-r p-2 text-center text-xs font-medium text-gray-500">Time</div>
          {days.map((day) => (
            <div
              key={day.toString()}
              className={`p-2 text-center text-xs font-medium ${isSameDay(day, new Date()) ? "bg-purple-50" : ""}`}
            >
              <div>{format(day, "EEE")}</div>
              <div className={`font-bold ${isSameDay(day, new Date()) ? "text-purple-600" : ""}`}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8 divide-x h-[500px] overflow-y-auto">
          <div className="divide-y">
            {hours.map((hour) => (
              <div key={hour} className="h-12 p-1 text-xs text-gray-500 text-right pr-2">
                {hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`}
              </div>
            ))}
          </div>

          {days.map((day) => (
            <div key={day.toString()} className="relative divide-y">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-12 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    const newDate = setHours(setMinutes(day, 0), hour)
                    handleDateClick(newDate)
                  }}
                ></div>
              ))}

              {/* Render events */}
              {events
                .filter((event) => {
                  // Show event if day is within event's date range
                  return (
                    isSameDay(day, event.start) ||
                    isSameDay(day, event.end) ||
                    (isAfter(day, event.start) && isBefore(day, event.end))
                  )
                })
                .map((event) => {
                  // Calculate display position
                  let startHour, duration

                  if (isSameDay(day, event.start)) {
                    // This is the start day
                    startHour = getHours(event.start) + getMinutes(event.start) / 60

                    if (isSameDay(day, event.end)) {
                      // Single day event
                      duration = getHours(event.end) + getMinutes(event.end) / 60 - startHour
                    } else {
                      // First day of multi-day event
                      duration = 24 - startHour
                    }
                  } else if (isSameDay(day, event.end)) {
                    // Last day of multi-day event
                    startHour = 0
                    duration = getHours(event.end) + getMinutes(event.end) / 60
                  } else {
                    // Middle day of multi-day event
                    startHour = 0
                    duration = 24
                  }

                  return (
                    <div
                      key={`${event.id}-${day}`}
                      onClick={(e) => handleEventClick(event, e)}
                      className="absolute left-0 right-0 mx-1 rounded px-1 text-xs text-white overflow-hidden transition-colors duration-200 hover:brightness-90 hover:shadow-md"
                      style={{
                        backgroundColor: event.color || "#6366f1",
                        top: `${startHour * 3}rem`,
                        height: `${duration * 3}rem`,
                        zIndex: 10,
                      }}
                    >
                      <div className="font-semibold truncate">
                        {isSameDay(day, event.start) ? event.title : `${event.title} (cont.)`}
                      </div>
                      {!isMobile && (
                        <div className="truncate">
                          {isSameDay(day, event.start) ? format(event.start, "h:mm a") : "all day"} -
                          {isSameDay(day, event.end) ? format(event.end, "h:mm a") : ""}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-1 border-b p-4">
          <div className="text-center">
            <div className="text-lg font-semibold">{format(currentDate, "EEEE")}</div>
            <div className="text-2xl font-bold">{format(currentDate, "d MMMM yyyy")}</div>
          </div>
        </div>

        <div className="grid grid-cols-[60px_1fr] divide-x h-[500px] overflow-y-auto">
          <div className="divide-y">
            {hours.map((hour) => (
              <div key={hour} className="h-12 p-1 text-xs text-gray-500 text-right pr-2">
                {hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`}
              </div>
            ))}
          </div>

          <div className="relative divide-y">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  const newDate = setHours(setMinutes(currentDate, 0), hour)
                  handleDateClick(newDate)
                }}
              ></div>
            ))}

            {/* Render events */}
            {events
              .filter((event) => {
                // Show event if currentDate is within event's date range
                return (
                  isSameDay(currentDate, event.start) ||
                  isSameDay(currentDate, event.end) ||
                  (isAfter(currentDate, event.start) && isBefore(currentDate, event.end))
                )
              })
              .map((event) => {
                // Calculate display position
                let startHour, duration

                if (isSameDay(currentDate, event.start)) {
                  // This is the start day
                  startHour = getHours(event.start) + getMinutes(event.start) / 60

                  if (isSameDay(currentDate, event.end)) {
                    // Single day event
                    duration = getHours(event.end) + getMinutes(event.end) / 60 - startHour
                  } else {
                    // First day of multi-day event
                    duration = 24 - startHour
                  }
                } else if (isSameDay(currentDate, event.end)) {
                  // Last day of multi-day event
                  startHour = 0
                  duration = getHours(event.end) + getMinutes(event.end) / 60
                } else {
                  // Middle day of multi-day event
                  startHour = 0
                  duration = 24
                }

                return (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className="absolute left-0 right-0 mx-2 rounded px-2 py-1 text-white overflow-hidden transition-colors duration-200 hover:brightness-90 hover:shadow-md"
                    style={{
                      backgroundColor: event.color || "#6366f1",
                      top: `${startHour * 3}rem`,
                      height: `${duration * 3}rem`,
                      zIndex: 10,
                    }}
                  >
                    <div className="font-semibold truncate">
                      {isSameDay(currentDate, event.start) ? event.title : `${event.title} (cont.)`}
                    </div>
                    <div className="truncate">
                      {isSameDay(currentDate, event.start) ? format(event.start, "h:mm a") : "all day"} -
                      {isSameDay(currentDate, event.end) ? format(event.end, "h:mm a") : ""}
                    </div>
                    {event.location && <div className="text-xs truncate">{event.location}</div>}
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - hidden by default on mobile */}
      <Sidebar isMobile={isMobile} toggleMobileSidebar={mobileSidebarOpen} />

      {/* Mobile sidebar backdrop */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75" onClick={toggleMobileSidebar}></div>
      )}

      {/* Main content - takes full width on mobile when sidebar is closed */}
      <div className={`flex-1 flex flex-col overflow-hidden ${!isMobile ? "md:ml-64" : ""}`}>
        <Navbar toggleMobileSidebar={toggleMobileSidebar} />

        <main className="flex-1 overflow-y-auto p-2 sm:p-4 pb-20">
          <CalendarHeader
            currentDate={currentDate}
            onPrev={prevMonth}
            onNext={nextMonth}
            onToday={goToToday}
            view={view}
            onViewChange={handleViewChange}
          />

          <div className="mt-2 sm:mt-4">
            {view === "month" && renderMonthView()}
            {view === "week" && renderWeekView()}
            {view === "day" && renderDayView()}
          </div>
        </main>

        {/* Floating action button - adjusted for better mobile visibility */}
        <button
          onClick={() => {
            setSelectedDate(new Date())
            setSelectedEvent(null)
            setIsModalOpen(true)
          }}
          className="fixed right-4 bottom-16 sm:bottom-6 p-3 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 z-20"
          aria-label="Add new event"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>

      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDate={selectedDate}
          event={selectedEvent}
        />
      )}
    </div>
  )
}
