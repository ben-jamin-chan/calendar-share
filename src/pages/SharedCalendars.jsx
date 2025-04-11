"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import { format } from "date-fns"
import { useMediaQuery } from "../hooks/useMediaQuery"
import { CalendarIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/outline"

export default function SharedCalendars() {
  const [sharedEvents, setSharedEvents] = useState([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { currentUser } = useAuth()
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    if (!currentUser) return

    // Query events shared with the current user
    const eventsRef = collection(db, "events")
    const q = query(eventsRef, where("sharedWith", "array-contains", currentUser.email))

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
  }, [currentUser])

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isMobile={isMobile} toggleMobileSidebar={mobileSidebarOpen} />

      {/* Mobile sidebar backdrop */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75" onClick={toggleMobileSidebar}></div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Navbar toggleMobileSidebar={toggleMobileSidebar} />

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Shared Calendars</h1>

            {sharedEvents.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                  <CalendarIcon className="h-6 w-6 text-purple-600" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">No shared events found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  When someone shares their calendar with you, events will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {sharedEvents.map((event) => (
                    <li key={event.id} className="hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: event.color || "#6366f1" }}
                            ></div>
                            <p className="text-sm font-medium text-purple-600 truncate">{event.title}</p>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              Shared by {event.userId}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {event.description || "No description"}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <p>
                              {format(event.start, "MMM d, yyyy h:mm a")} - {format(event.end, "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        </div>
                        {event.location && (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <p>{event.location}</p>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
