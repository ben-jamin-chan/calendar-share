"use client"

import { Fragment, useState } from "react"
import { Link } from "react-router-dom"
import { Menu, Transition } from "@headlessui/react"
import { useAuth } from "../contexts/AuthContext"
import { Cog6ToothIcon, ArrowRightOnRectangleIcon, Bars3Icon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import NotificationsDropdown from "./NotificationsDropdown"

export default function Navbar({ toggleMobileSidebar }) {
  const { currentUser, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  return (
    <header className="bg-white shadow-sm z-20 border-b border-gray-200">
      <div className="flex items-center justify-between h-14 sm:h-16 px-2 sm:px-4">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
            onClick={() => toggleMobileSidebar(true)}
          >
            <span className="sr-only">Toggle sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <Link to={"/"}>
          <div className="hidden md:flex md:items-center md:ml-2">
            <h1 className="text-xl font-bold text-purple-700">Calendar-Share</h1>
          </div>
          </Link>
        </div>

        {/* Search bar - hidden on small mobile screens */}
        <div className="hidden sm:flex flex-1 max-w-md mx-2 sm:mx-4">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"
              placeholder="Search for events"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <NotificationsDropdown />

          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                <span className="sr-only">Open user menu</span>
                {currentUser?.photoURL ? (
                  <img className="h-8 w-8 rounded-full" src={currentUser.photoURL || "/placeholder.svg"} alt="" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
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
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  <p className="font-medium">{currentUser?.displayName || "User"}</p>
                  <p className="text-gray-500 truncate">{currentUser?.email}</p>
                </div>

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/settings"
                      className={`${active ? "bg-gray-100" : ""} flex px-4 py-2 text-sm text-gray-700 w-full`}
                    >
                      <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                      Settings
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${active ? "bg-gray-100" : ""} flex px-4 py-2 text-sm text-gray-700 w-full`}
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
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
