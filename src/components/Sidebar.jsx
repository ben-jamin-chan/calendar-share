"use client"

import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  CalendarIcon,
  UsersIcon,
  Cog6ToothIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { getUserCalendars } from "../services/calendarService"
import ManageCalendarsModal from "./ManageCalendarsModal"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"

export default function Sidebar({
  isMobile,
  toggleMobileSidebar,
  onCreateEvent,
  selectedCalendars = [],
  onCalendarToggle,
}) {
  const location = useLocation()
  const { currentUser } = useAuth()
  const [isManageCalendarsModalOpen, setIsManageCalendarsModalOpen] = useState(false)
  const [myCalendarsOpen, setMyCalendarsOpen] = useState(true)
  const [sharedCalendarsOpen, setSharedCalendarsOpen] = useState(true)
  const [calendars, setCalendars] = useState([])
  const [sharedCalendars, setSharedCalendars] = useState([])
  const [loading, setLoading] = useState(true)
  const [sharedLoading, setSharedLoading] = useState(true)
  const navigate = useNavigate()

  // Fetch user calendars
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

  // Fetch shared calendars
  useEffect(() => {
    const fetchSharedCalendars = async () => {
      if (!currentUser) return

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

        setSharedCalendars(calendarsData)
        setSharedLoading(false)
      } catch (error) {
        console.error("Error fetching shared calendars:", error)
        setSharedLoading(false)
      }
    }

    fetchSharedCalendars()
  }, [currentUser])

  const handleCreateClick = () => {
    if (onCreateEvent) {
      onCreateEvent()
    } else {
      navigate("/")
      if (isMobile) {
        toggleMobileSidebar(false)
      }
    }
  }

  const handleCalendarToggle = (calendar) => {
    if (onCalendarToggle) {
      onCalendarToggle(calendar)
    }
  }

  const navigation = [
    { name: "Calendar", href: "/", icon: CalendarIcon },
    { name: "Shared Calendars", href: "/shared", icon: UsersIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ]

  return (
    <>
      <div
        className={`${
          isMobile
            ? "fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out w-64"
            : "hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0"
        } ${isMobile && !toggleMobileSidebar ? "-translate-x-full" : "translate-x-0"} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-purple-700 dark:text-purple-400">CalendarShare</h1>
            {isMobile && (
              <button
                onClick={() => toggleMobileSidebar(false)}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Create button */}
          <div className="p-4">
            <button
              onClick={handleCreateClick}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  onClick={isMobile ? () => toggleMobileSidebar(false) : undefined}
                >
                  <item.icon
                    className={`${
                      isActive
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    } mr-3 flex-shrink-0 h-5 w-5`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* My Calendars */}
          <div className="px-3 mt-2">
            <div
              className="flex items-center justify-between py-2 text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer"
              onClick={() => setMyCalendarsOpen(!myCalendarsOpen)}
            >
              <span>My calendars</span>
              {myCalendarsOpen ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              )}
            </div>

            {myCalendarsOpen && (
              <div className="ml-2 space-y-1 mt-1">
                {loading ? (
                  <div className="py-2 px-1">
                    <div className="animate-pulse flex space-x-2 items-center">
                      <div className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                ) : calendars.length === 0 ? (
                  <div className="py-2 px-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">No calendars found</div>
                    <button
                      onClick={() => setIsManageCalendarsModalOpen(true)}
                      className="flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Create calendar
                    </button>
                  </div>
                ) : (
                  calendars.map((calendar) => (
                    <div key={calendar.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        id={`calendar-${calendar.id}`}
                        checked={selectedCalendars.includes(calendar.id)}
                        onChange={() => handleCalendarToggle(calendar)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <div className="flex items-center ml-2 flex-1">
                        <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: calendar.color }}></span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{calendar.name}</span>
                        {calendar.isDefault && (
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(Default)</span>
                        )}
                      </div>
                    </div>
                  ))
                )}

                <button
                  onClick={() => setIsManageCalendarsModalOpen(true)}
                  className="flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 mt-2"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Manage calendars
                </button>
              </div>
            )}
          </div>

          {/* Shared Calendars Section */}
          <div className="px-3 mt-2">
            <div
              className="flex items-center justify-between py-2 text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer"
              onClick={() => setSharedCalendarsOpen(!sharedCalendarsOpen)}
            >
              <span>Shared calendars</span>
              {sharedCalendarsOpen ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              )}
            </div>

            {sharedCalendarsOpen && (
              <div className="ml-2 space-y-1 mt-1">
                {sharedLoading ? (
                  <div className="py-2 px-1">
                    <div className="animate-pulse flex space-x-2 items-center">
                      <div className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                ) : sharedCalendars.length === 0 ? (
                  <div className="py-2 px-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">No shared calendars</div>
                    <Link
                      to="/shared"
                      className="flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      onClick={isMobile ? () => toggleMobileSidebar(false) : undefined}
                    >
                      <UsersIcon className="h-4 w-4 mr-1" />
                      View shared calendars
                    </Link>
                  </div>
                ) : (
                  sharedCalendars.map((calendar) => (
                    <div key={calendar.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        id={`shared-calendar-${calendar.id}`}
                        checked={selectedCalendars.includes(calendar.id)}
                        onChange={() => handleCalendarToggle(calendar)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <div className="flex items-center ml-2 flex-1">
                        <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: calendar.color }}></span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{calendar.name}</span>
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(Shared)</span>
                      </div>
                    </div>
                  ))
                )}

                <Link
                  to="/shared"
                  className="flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 mt-2"
                  onClick={isMobile ? () => toggleMobileSidebar(false) : undefined}
                >
                  <UsersIcon className="h-4 w-4 mr-1" />
                  Manage shared calendars
                </Link>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300">
                  {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || "U"}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {currentUser?.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">{currentUser?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar backdrop */}
      {isMobile && toggleMobileSidebar && (
        <div className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75" onClick={() => toggleMobileSidebar(false)}></div>
      )}

      {/* Manage Calendars Modal */}
      {isManageCalendarsModalOpen && (
        <ManageCalendarsModal
          isOpen={isManageCalendarsModalOpen}
          onClose={() => setIsManageCalendarsModalOpen(false)}
          onCalendarCreated={(calendar) => {
            setCalendars([...calendars, calendar])
            if (onCalendarToggle) {
              onCalendarToggle(calendar)
            }
          }}
          onCalendarUpdated={(updatedCalendar) => {
            setCalendars(calendars.map((cal) => (cal.id === updatedCalendar.id ? updatedCalendar : cal)))
          }}
          onCalendarDeleted={(calendarId) => {
            setCalendars(calendars.filter((cal) => cal.id !== calendarId))
          }}
        />
      )}
    </>
  )
}
