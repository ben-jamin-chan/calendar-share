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
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import EventModal from "../components/EventModal"
import CalendarHeader from "../components/CalendarHeader"
import { PlusIcon } from "@heroicons/react/24/outline"
import { useMediaQuery } from "../hooks/useMediaQuery"
import { createEventReminderNotification } from "../services/notificationService"
import { getUserCalendars } from "../services/calendarService"
import { useSharedCalendars } from "../contexts/SharedCalendarsContext"

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [view, setView] = useState("month") // 'month', 'week', 'day'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [calendars, setCalendars] = useState([])
  const { sharedCalendars } = useSharedCalendars()
  const [selectedCalendars, setSelectedCalendars] = useState([])
  const { currentUser } = useAuth()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Create a function to handle creating a new event
  const handleCreateEvent = () => {
    setSelectedDate(new Date())
    setSelectedEvent(null)
    setIsModalOpen(true)
  }

  // Fetch user calendars and shared calendars
  useEffect(() => {
    if (!currentUser) return

    const fetchAllCalendars = async () => {
      try {
        // Get user's own calendars
        const userCalendars = await getUserCalendars(currentUser.uid)
        setCalendars(userCalendars)

        // Select all calendars by default (both owned and shared)
        const allCalendarIds = [...userCalendars, ...sharedCalendars].map((cal) => cal.id)
        setSelectedCalendars(allCalendarIds)
      } catch (error) {
        console.error("Error fetching calendars:", error)
      }
    }

    fetchAllCalendars()
  }, [currentUser, sharedCalendars])

  // Fetch events for selected calendars
  useEffect(() => {
    if (!currentUser || selectedCalendars.length === 0) {
      setEvents([])
      return
    }

    // Query events for the selected calendars
    const eventsRef = collection(db, "events")
    const q = query(eventsRef, where("calendarId", "in", selectedCalendars))

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
          createEventReminderNotification(currentUser.uid, event, 30).catch((err) =>
            console.error("Error creating reminder notification:", err),
          )
        }
      })
    })

    return unsubscribe
  }, [currentUser, selectedCalendars])

  // Listen for the custom event from the search function
  useEffect(() => {
    const handleFocusEvent = async (e) => {
      const { date, eventId } = e.detail

      // Set the current date to the event date
      setCurrentDate(date)

      // Determine the appropriate view based on the event
      // For simplicity, we'll just use day view
      setView("day")

      // Get the event details and set it as selected
      if (eventId) {
        try {
          const eventDoc = await getDoc(doc(db, "events", eventId))
          if (eventDoc.exists()) {
            const eventData = eventDoc.data()
            setSelectedEvent({
              id: eventId,
              ...eventData,
              start: eventData.start.toDate(),
              end: eventData.end.toDate(),
            })
            setSelectedDate(eventData.start.toDate())
            setIsModalOpen(true)
          }
        } catch (error) {
          console.error("Error fetching event details:", error)
        }
      }
    }

    window.addEventListener("focusCalendarEvent", handleFocusEvent)

    return () => {
      window.removeEventListener("focusCalendarEvent", handleFocusEvent)
    }
  }, [])

  const handleCalendarToggle = (calendar) => {
    setSelectedCalendars((prev) => {
      if (prev.includes(calendar.id)) {
        return prev.filter((id) => id !== calendar.id)
      } else {
        return [...prev, calendar.id]
      }
    })
  }

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

  // Update the toggleMobileSidebar function and how it's passed to the Sidebar component
  const toggleMobileSidebar = (value) => {
    if (typeof value === "boolean") {
      setMobileSidebarOpen(value)
    } else {
      setMobileSidebarOpen(!mobileSidebarOpen)
    }
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
        {/* Calendar grid header - days of week */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-gray-700 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              {isMobile ? day : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index]}
            </div>
          ))}
        </div>

        {/* Calendar grid - takes all available space */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 flex-1">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day)
            const isToday = isSameDay(day, new Date())
            const maxEventsToShow = isMobile ? 2 : 5;
            
            return (
              <div
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                className={`bg-white dark:bg-gray-800 p-1 flex flex-col ${
                  isSameMonth(day, currentDate)
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-850"
                } hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`font-medium text-sm ${
                      isToday 
                        ? "h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center" 
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  
                  {dayEvents.length > 0 && isMobile && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      {dayEvents.length}
                    </div>
                  )}
                </div>
                
                <div className="mt-1 space-y-1 flex-1 overflow-y-auto">
                  {dayEvents.slice(0, maxEventsToShow).map((event) => {
                    const formattedEvent = formatEventForDay(event, day)
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className="px-1 py-1 text-xs rounded truncate text-white transition-colors duration-200 hover:brightness-90 hover:shadow-sm flex-shrink-0"
                        style={{
                          backgroundColor: event.color || "#6366f1",
                        }}
                      >
                        {formattedEvent.displayTitle}
                      </div>
                    )
                  })}
                  {dayEvents.length > maxEventsToShow && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                      +{dayEvents.length - maxEventsToShow} more
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
        <div className="grid grid-cols-8 border-b dark:border-gray-700">
          <div className="border-r dark:border-gray-700 p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
            Time
          </div>
          {days.map((day) => (
            <div
              key={day.toString()}
              className={`p-3 text-center font-medium ${isSameDay(day, new Date()) ? "bg-purple-50 dark:bg-purple-900/30" : ""}`}
            >
              <div className="text-gray-500 dark:text-gray-400">{format(day, "EEE")}</div>
              <div
                className={`font-bold text-lg ${isSameDay(day, new Date()) ? "text-purple-600 dark:text-purple-400" : "text-gray-900 dark:text-white"}`}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8 divide-x dark:divide-gray-700 flex-1 overflow-y-auto">
          <div className="divide-y dark:divide-gray-700">
            {hours.map((hour) => (
              <div key={hour} className="h-16 p-1 text-xs text-gray-500 dark:text-gray-400 text-right pr-2">
                {hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`}
              </div>
            ))}
          </div>

          {days.map((day) => (
            <div key={day.toString()} className="relative divide-y dark:divide-gray-700">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
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
                      className="absolute left-0 right-0 mx-1 rounded px-2 text-xs text-white overflow-hidden transition-colors duration-200 hover:brightness-90 hover:shadow-md"
                      style={{
                        backgroundColor: event.color || "#6366f1",
                        top: `${startHour * 4}rem`,
                        height: `${Math.max(1, duration * 4)}rem`,
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
        <div className="grid grid-cols-1 border-b dark:border-gray-700 p-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{format(currentDate, "EEEE")}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{format(currentDate, "d MMMM yyyy")}</div>
          </div>
        </div>

        <div className="grid grid-cols-[80px_1fr] divide-x dark:divide-gray-700 flex-1 overflow-y-auto">
          <div className="divide-y dark:divide-gray-700">
            {hours.map((hour) => (
              <div key={hour} className="h-16 p-1 text-xs text-gray-500 dark:text-gray-400 text-right pr-2">
                {hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`}
              </div>
            ))}
          </div>

          <div className="relative divide-y dark:divide-gray-700">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
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
                    className="absolute left-0 right-0 mx-2 rounded px-3 py-1 text-white overflow-hidden transition-colors duration-200 hover:brightness-90 hover:shadow-md"
                    style={{
                      backgroundColor: event.color || "#6366f1",
                      top: `${startHour * 4}rem`,
                      height: `${Math.max(1, duration * 4)}rem`,
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - hidden by default on mobile */}
      <Sidebar
        isMobile={isMobile}
        toggleMobileSidebar={mobileSidebarOpen}
        onCreateEvent={handleCreateEvent}
        selectedCalendars={selectedCalendars}
        onCalendarToggle={handleCalendarToggle}
      />

      {/* Mobile sidebar backdrop */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75" onClick={() => toggleMobileSidebar(false)}></div>
      )}

      {/* Main content - takes full width on mobile when sidebar is closed */}
      <div className={`flex-1 flex flex-col overflow-hidden ${!isMobile ? "md:ml-64" : ""}`}>
        <Navbar toggleMobileSidebar={toggleMobileSidebar} />

        <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
          <CalendarHeader
            currentDate={currentDate}
            onPrev={prevMonth}
            onNext={nextMonth}
            onToday={goToToday}
            view={view}
            onViewChange={handleViewChange}
          />

          {/* Calendar container that fills available space */}
          <div className="p-2 sm:p-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0">
              {view === "month" && renderMonthView()}
              {view === "week" && renderWeekView()}
              {view === "day" && renderDayView()}
            </div>
          </div>
        </main>

        {/* Floating action button - adjusted for better mobile visibility */}
        <button
          onClick={handleCreateEvent}
          className="fixed right-4 bottom-16 sm:bottom-6 p-3 rounded-full bg-purple-600 dark:bg-purple-700 text-white shadow-lg hover:bg-purple-700 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 z-20"
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