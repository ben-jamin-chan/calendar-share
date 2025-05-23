"use client"

import { Fragment, useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Menu, Transition } from "@headlessui/react"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  ClockIcon,
  MapPinIcon,
  XMarkIcon,
  CalendarIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline"
import NotificationsDropdown from "./NotificationsDropdown"
import { format } from "date-fns"
import { collection, where, getDocs, query } from "firebase/firestore"
import { db } from "../firebase"

export default function Navbar({ toggleMobileSidebar }) {
  const { currentUser, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Reset search when navigating
  useEffect(() => {
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  const handleSearch = async (e) => {
    const searchText = e.target.value
    setSearchQuery(searchText)

    if (searchText.trim().length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setShowResults(true)

    try {
      // Get all calendars the user has access to
      const calendarsRef = collection(db, "calendars")

      // 1. Get calendars where user is a member (by UID)
      const userCalendarsQuery = query(calendarsRef, where("members", "array-contains", currentUser.uid))
      const userCalendarsSnapshot = await getDocs(userCalendarsQuery)

      // 2. Get calendars shared with the user (by email)
      const sharedCalendarsQuery = query(calendarsRef, where("sharedEmails", "array-contains", currentUser.email))
      const sharedCalendarsSnapshot = await getDocs(sharedCalendarsQuery)

      // Combine both sets of calendars (removing duplicates)
      const calendarIds = new Set()

      // Add user's own calendars
      userCalendarsSnapshot.docs.forEach((doc) => {
        calendarIds.add(doc.id)
      })

      // Add shared calendars
      sharedCalendarsSnapshot.docs.forEach((doc) => {
        calendarIds.add(doc.id)
      })

      // Convert to array
      const calendarIdsArray = Array.from(calendarIds)

      if (calendarIdsArray.length === 0) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      // Create a map of calendar ID to calendar details for quick lookup
      const calendarMap = {}

      // Add details from user's calendars
      userCalendarsSnapshot.docs.forEach((doc) => {
        calendarMap[doc.id] = {
          id: doc.id,
          name: doc.data().name,
          color: doc.data().color,
          ownerId: doc.data().ownerId,
        }
      })

      // Add details from shared calendars (will overwrite if duplicate, but that's ok)
      sharedCalendarsSnapshot.docs.forEach((doc) => {
        calendarMap[doc.id] = {
          id: doc.id,
          name: doc.data().name,
          color: doc.data().color,
          ownerId: doc.data().ownerId,
        }
      })

      // Query events from all accessible calendars
      const eventsRef = collection(db, "events")

      // Use "in" operator to get events from multiple calendars
      // This will include events from both owned and shared calendars
      const eventsQuery = query(eventsRef, where("calendarId", "in", calendarIdsArray))
      const eventsSnapshot = await getDocs(eventsQuery)

      // Filter events based on search query
      const searchTermLower = searchText.toLowerCase()
      const filteredEvents = eventsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          start: doc.data().start.toDate(),
          end: doc.data().end.toDate(),
          calendarId: doc.data().calendarId,
          calendarDetails: calendarMap[doc.data().calendarId] || { name: "Unknown Calendar", color: "#6366f1" },
        }))
        .filter(
          (event) =>
            event.title.toLowerCase().includes(searchTermLower) ||
            (event.description && event.description.toLowerCase().includes(searchTermLower)) ||
            (event.location && event.location.toLowerCase().includes(searchTermLower)),
        )
        .sort((a, b) => a.start - b.start)
        .slice(0, 5) // Limit to 5 results

      setSearchResults(filteredEvents)
    } catch (error) {
      console.error("Error searching events:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultClick = (event) => {
    // Navigate to the calendar page with the date of the event
    navigate("/")

    // We'll use a custom event to tell the Calendar component to focus on this event
    const eventDetail = {
      date: event.start,
      eventId: event.id,
    }

    // Dispatch a custom event that the Calendar component will listen for
    window.dispatchEvent(new CustomEvent("focusCalendarEvent", { detail: eventDetail }))

    setShowResults(false)
    setSearchQuery("")
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-20 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-14 sm:h-16 px-2 sm:px-4">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
            onClick={() => toggleMobileSidebar(true)}
          >
            <span className="sr-only">Toggle sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <Link to={"/"}>
            <div className="hidden md:flex md:items-center md:ml-2">
              <h1 className="text-xl font-bold text-orange-700 dark:text-orange-400">Calendar-Share</h1>
            </div>
          </Link>
        </div>

        {/* Search bar - hidden on small mobile screens */}
        <div className="hidden sm:flex flex-1 max-w-md mx-2 sm:mx-4" ref={searchRef}>
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-8 text-gray-900 dark:text-white bg-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
              placeholder="Search for events"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-96 overflow-y-auto z-50 border border-gray-200 dark:border-gray-700">
                {isSearching ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-600 dark:border-orange-400 mx-auto"></div>
                    <p className="mt-1">Searching...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    {searchQuery.trim().length >= 2 ? "No events found" : "Type at least 2 characters to search"}
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {searchResults.map((event) => (
                      <li
                        key={event.id}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleResultClick(event)}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: event.color || event.calendarDetails.color || "#6366f1" }}
                          ></div>
                          <span className="font-medium text-sm text-gray-900 dark:text-white">{event.title}</span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          <span>{format(event.start, "MMM d, yyyy h:mm a")}</span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          <span>{event.calendarDetails.name}</span>
                        </div>
                        {event.location && (
                          <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="rounded-full p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <SunIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <MoonIcon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>

          <NotificationsDropdown />

          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="flex rounded-full bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                <span className="sr-only">Open user menu</span>
                {currentUser?.photoURL ? (
                  <img className="h-8 w-8 rounded-full" src={currentUser.photoURL || "/placeholder.svg"} alt="" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 dark:text-orange-300">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || "U"}
                  </div>
                )}
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                  <p className="font-medium">{currentUser?.displayName || "User"}</p>
                  <p className="text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
                </div>

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/settings"
                      className={`${active ? "bg-gray-100 dark:bg-gray-700" : ""} flex px-4 py-2 text-sm text-gray-700 dark:text-gray-300 w-full`}
                    >
                      <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      Settings
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${active ? "bg-gray-100 dark:bg-gray-700" : ""} flex px-4 py-2 text-sm text-gray-700 dark:text-gray-300 w-full`}
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}
