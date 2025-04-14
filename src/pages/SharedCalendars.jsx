"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import { format } from "date-fns"
import { useMediaQuery } from "../hooks/useMediaQuery"
import { CalendarIcon, ClockIcon, MapPinIcon, PlusIcon, PencilIcon } from "@heroicons/react/24/outline"
import { useNavigate } from "react-router-dom"
import ShareCalendarModal from "./ShareCalendarModal"
import EventModal from "../components/EventModal"

export default function SharedCalendars() {
  const [sharedEvents, setSharedEvents] = useState([])
  const [sharedCalendars, setSharedCalendars] = useState([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [selectedCalendar, setSelectedCalendar] = useState(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const navigate = useNavigate()

  // Fetch shared calendars
  useEffect(() => {
    if (!currentUser) return

    const fetchSharedCalendars = async () => {
      try {
        // Get calendars shared with the user
        const calendarsRef = collection(db, "calendars")
        const q = query(calendarsRef, where("sharedEmails", "array-contains", currentUser.email))
        const querySnapshot = await getDocs(q)

        const calendarsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }))

        // For each shared calendar, fetch the owner's details
        const calendarsWithOwnerDetails = await Promise.all(
          calendarsData.map(async (calendar) => {
            try {
              // Get owner details from Firebase Auth
              // In a real app, you would have a users collection to look up by UID
              // For now, we'll just use the ownerId as is
              return {
                ...calendar,
                ownerName: calendar.ownerId, // Placeholder - in a real app, get the actual name
              }
            } catch (error) {
              console.error("Error fetching owner details:", error)
              return {
                ...calendar,
                ownerName: "Unknown User",
              }
            }
          }),
        )

        setSharedCalendars(calendarsWithOwnerDetails)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching shared calendars:", error)
        setLoading(false)
      }
    }

    fetchSharedCalendars()
  }, [currentUser])

  // Fetch events from shared calendars
  useEffect(() => {
    if (!currentUser || sharedCalendars.length === 0) return

    // Get all calendar IDs that are shared with the user
    const calendarIds = sharedCalendars.map((cal) => cal.id)

    // Query events for these calendars
    const eventsRef = collection(db, "events")
    const q = query(eventsRef, where("calendarId", "in", calendarIds))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start.toDate(),
        end: doc.data().end.toDate(),
      }))
      setSharedEvents(eventsData)
    })

    return unsubscribe
  }, [currentUser, sharedCalendars])

  const toggleMobileSidebar = (value) => {
    setMobileSidebarOpen(typeof value === "boolean" ? value : !mobileSidebarOpen)
  }

  const handleShareCalendar = (calendar) => {
    setSelectedCalendar(calendar)
    setIsShareModalOpen(true)
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setSelectedDate(event.start)
    setIsEventModalOpen(true)
  }

  const handleCreateEvent = (calendarId) => {
    // Set the selected calendar and open the event modal
    const calendar = sharedCalendars.find((cal) => cal.id === calendarId)
    if (calendar) {
      setSelectedCalendar(calendar)
      setSelectedDate(new Date())
      setSelectedEvent(null)
      setIsEventModalOpen(true)
    }
  }

  // Navigate to calendar page to create a new event
  const navigateToCalendar = () => {
    navigate("/")
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isMobile={isMobile} toggleMobileSidebar={mobileSidebarOpen} onCreateEvent={navigateToCalendar} />

      {/* Mobile sidebar backdrop */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75" onClick={() => toggleMobileSidebar(false)}></div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Navbar toggleMobileSidebar={toggleMobileSidebar} />

        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Shared Calendars</h1>

            {loading ? (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading shared calendars...</p>
              </div>
            ) : sharedCalendars.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-white">No shared calendars found</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  When someone shares their calendar with you, it will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Shared Calendars Section */}
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Calendars Shared With You
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                      Calendars that others have shared with you
                    </p>
                  </div>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sharedCalendars.map((calendar) => (
                      <li key={calendar.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span
                              className="h-4 w-4 rounded-full mr-2"
                              style={{ backgroundColor: calendar.color }}
                            ></span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{calendar.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Shared by {calendar.ownerName}
                            </div>
                            <button
                              onClick={() => handleCreateEvent(calendar.id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-900"
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Add Event
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Shared Events Section */}
                {sharedEvents.length > 0 ? (
                  <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        Events from Shared Calendars
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                        Upcoming events from calendars shared with you
                      </p>
                    </div>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {sharedEvents.map((event) => (
                        <li
                          key={event.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-3"
                                  style={{ backgroundColor: event.color || "#6366f1" }}
                                ></div>
                                <p className="text-sm font-medium text-purple-600 dark:text-purple-400 truncate">
                                  {event.title}
                                </p>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                                  {sharedCalendars.find((cal) => cal.id === event.calendarId)?.name ||
                                    "Shared Calendar"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                  {event.description || "No description"}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                                <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <p>
                                  {format(event.start, "MMM d, yyyy h:mm a")} -{" "}
                                  {format(event.end, "MMM d, yyyy h:mm a")}
                                </p>
                              </div>
                            </div>
                            {event.location && (
                              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <p>{event.location}</p>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-white">
                      No events in shared calendars
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      There are no events in the calendars shared with you.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Floating action button */}
          <button
            onClick={navigateToCalendar}
            className="fixed right-4 bottom-16 sm:bottom-6 p-3 rounded-full bg-purple-600 dark:bg-purple-700 text-white shadow-lg hover:bg-purple-700 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 z-20"
            aria-label="Add new event"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </main>
      </div>

      {/* Share Calendar Modal */}
      {isShareModalOpen && selectedCalendar && (
        <ShareCalendarModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          calendar={selectedCalendar}
        />
      )}

      {/* Event Modal */}
      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          selectedDate={selectedDate}
          event={selectedEvent}
          initialCalendarId={selectedCalendar?.id}
        />
      )}
    </div>
  )
}
