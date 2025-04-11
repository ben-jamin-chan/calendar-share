"use client"

import { Link, useLocation } from "react-router-dom"
import {
  CalendarIcon,
  UsersIcon,
  Cog6ToothIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import Calendar from "../pages/Calendar"

export default function Sidebar({ isMobile, toggleMobileSidebar }) {
  const location = useLocation()
  const { currentUser } = useAuth()
  const [myCalendarsOpen, setMyCalendarsOpen] = useState(true)
  const [otherCalendarsOpen, setOtherCalendarsOpen] = useState(false)

  const navigation = [
    { name: "Calendar", href: "/", icon: CalendarIcon },
    { name: "Shared Calendars", href: "/shared", icon: UsersIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ]

  const myCalendars = [
    { name: "Personal", color: "#4f46e5" },
    { name: "Work", color: "#0ea5e9" },
    { name: "Family", color: "#10b981" },
  ]

  const otherCalendars = [
    { name: "Holidays", color: "#f59e0b" },
    { name: "Birthdays", color: "#ec4899" },
    { name: "Tasks", color: "#8b5cf6" },
  ]

  // If on mobile and sidebar is not toggled, don't render the sidebar content
  if (isMobile && !toggleMobileSidebar) {
    return null
  }

  return (
    <div
      className={`${
        isMobile
          ? "fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out w-full sm:w-64"
          : "hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0"
      } ${isMobile && !toggleMobileSidebar ? "-translate-x-full" : "translate-x-0"} bg-white border-r border-gray-200`}
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <Link to={"/"}>
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-purple-700">Calendar-Share</h1>
        </div>
        </Link>

        {/* Create button */}
        <div className="p-4">
          <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
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
                  isActive ? "bg-purple-50 text-purple-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                onClick={isMobile ? () => toggleMobileSidebar(false) : undefined}
              >
                <item.icon
                  className={`${
                    isActive ? "text-purple-600" : "text-gray-500 group-hover:text-gray-600"
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
            className="flex items-center justify-between py-2 text-sm font-medium text-gray-600 cursor-pointer"
            onClick={() => setMyCalendarsOpen(!myCalendarsOpen)}
          >
            <span>My calendars</span>
            {myCalendarsOpen ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )}
          </div>

          {myCalendarsOpen && (
            <div className="ml-2 space-y-1 mt-1">
              {myCalendars.map((calendar) => (
                <div key={calendar.name} className="flex items-center py-1">
                  <div className="flex items-center flex-1">
                    <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: calendar.color }}></span>
                    <span className="text-sm text-gray-700">{calendar.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Calendars */}
        <div className="px-3 mt-2">
          <div
            className="flex items-center justify-between py-2 text-sm font-medium text-gray-600 cursor-pointer"
            onClick={() => setOtherCalendarsOpen(!otherCalendarsOpen)}
          >
            <span>Other calendars</span>
            {otherCalendarsOpen ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )}
          </div>

          {otherCalendarsOpen && (
            <div className="ml-2 space-y-1 mt-1">
              {otherCalendars.map((calendar) => (
                <div key={calendar.name} className="flex items-center py-1">
                  <div className="flex items-center flex-1">
                    <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: calendar.color }}></span>
                    <span className="text-sm text-gray-700">{calendar.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || "U"}
              </div>
            </div>
            <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{currentUser?.displayName || "User"}</p>
              <p className="text-xs text-gray-500 truncate max-w-[160px]">{currentUser?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
