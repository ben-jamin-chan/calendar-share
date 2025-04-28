"use client"

import { useState, useEffect } from "react"
import { useCalendar } from "../contexts/CalendarContext"
import { PlusIcon, ShareIcon, CalendarIcon } from "@heroicons/react/24/outline"
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid"
import toast from "react-hot-toast"

export default function CalendarSelector() {
  const {
    userCalendars,
    selectedCalendarId,
    setSelectedCalendarId,
    createNewCalendar,
    updateUserCalendar,
    deleteUserCalendar,
    shareCalendar,
    loading
  } = useCalendar()

  const [isCreating, setIsCreating] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isEditing, setIsEditing] = useState(null)
  
  const [newCalendarName, setNewCalendarName] = useState("")
  const [newCalendarColor, setNewCalendarColor] = useState("#6366f1")
  
  const [shareEmail, setShareEmail] = useState("")
  const [shareCalendarId, setShareCalendarId] = useState(null)
  
  // If no calendars exist, automatically show the create form
  useEffect(() => {
    if (!loading && userCalendars.length === 0) {
      setIsCreating(true)
      setNewCalendarName("My Calendar")
    }
  }, [loading, userCalendars.length])
  
  const colors = [
    "#6366f1", // Indigo
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Yellow
    "#ef4444", // Red
    "#ec4899", // Pink
    "#8b5cf6", // Purple
  ]

  const handleCreateCalendar = async () => {
    if (!newCalendarName.trim()) {
      toast.error("Please enter a calendar name")
      return
    }
    
    try {
      const calendarId = await createNewCalendar(newCalendarName, newCalendarColor)
      setNewCalendarName("")
      setNewCalendarColor("#6366f1")
      setIsCreating(false)
      setSelectedCalendarId(calendarId)
      toast.success("Calendar created successfully")
    } catch (error) {
      toast.error("Failed to create calendar")
    }
  }
  
  const handleUpdateCalendar = async (calendarId) => {
    if (!isEditing || !isEditing.name.trim()) {
      toast.error("Please enter a calendar name")
      return
    }
    
    try {
      await updateUserCalendar(calendarId, {
        name: isEditing.name,
        color: isEditing.color
      })
      setIsEditing(null)
      toast.success("Calendar updated successfully")
    } catch (error) {
      toast.error("Failed to update calendar")
    }
  }
  
  const handleDeleteCalendar = async (calendarId) => {
    if (userCalendars.length <= 1) {
      toast.error("Cannot delete the only calendar")
      return
    }
    
    if (confirm("Are you sure you want to delete this calendar? All events will be lost.")) {
      try {
        await deleteUserCalendar(calendarId)
        toast.success("Calendar deleted successfully")
      } catch (error) {
        toast.error("Failed to delete calendar")
      }
    }
  }
  
  const handleShareCalendar = async () => {
    if (!shareEmail.trim()) {
      toast.error("Please enter an email address")
      return
    }
    
    try {
      await shareCalendar(shareCalendarId, [shareEmail])
      setShareEmail("")
      setIsSharing(false)
      toast.success("Calendar shared successfully")
    } catch (error) {
      toast.error("Failed to share calendar")
    }
  }
  
  const startEditing = (calendar) => {
    setIsEditing({
      id: calendar.id,
      name: calendar.name,
      color: calendar.color
    })
  }
  
  const startSharing = (calendarId) => {
    setShareCalendarId(calendarId)
    setIsSharing(true)
    setShareEmail("")
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded w-full mb-2"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded w-full"></div>
      </div>
    )
  }

  // Display a more prominent calendar creation UI when no calendars exist
  if (userCalendars.length === 0) {
    return (
      <div className="px-3 py-4">
        <div className="bg-orange-50 rounded-lg p-4 mb-4 text-center">
          <CalendarIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-orange-800 mb-1">Create Your First Calendar</h3>
          <p className="text-xs text-orange-700 mb-4">You need to create a calendar before adding events</p>
          
          <input
            type="text"
            value={newCalendarName}
            onChange={(e) => setNewCalendarName(e.target.value)}
            placeholder="Calendar name"
            className="w-full p-2 text-sm border rounded mb-3 focus:border-orange-500 focus:ring-orange-500"
            autoFocus
          />
          
          <div className="flex items-center justify-center mb-3">
            <span className="text-xs mr-2 text-gray-600">Select color:</span>
            <div className="flex space-x-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewCalendarColor(color)}
                  className={`w-5 h-5 rounded-full ${newCalendarColor === color ? 'ring-2 ring-offset-1 ring-orange-500' : ''}`}
                  style={{ backgroundColor: color }}
                ></button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleCreateCalendar}
            className="w-full px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Create Calendar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Calendars</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="text-gray-500 hover:text-orange-600"
          title="Add Calendar"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
      
      {isCreating && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md shadow-sm border border-gray-200">
          <input
            type="text"
            value={newCalendarName}
            onChange={(e) => setNewCalendarName(e.target.value)}
            placeholder="Calendar name"
            className="w-full p-2 text-sm border rounded mb-2 focus:border-orange-500 focus:ring-orange-500"
            autoFocus
          />
          <div className="flex items-center mb-2">
            <span className="text-xs mr-2">Color:</span>
            <div className="flex space-x-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewCalendarColor(color)}
                  className={`w-5 h-5 rounded-full ${newCalendarColor === color ? 'ring-2 ring-offset-1 ring-orange-500' : ''}`}
                  style={{ backgroundColor: color }}
                ></button>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-2 py-1 text-xs text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCalendar}
              className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Create
            </button>
          </div>
        </div>
      )}
      
      <ul className="space-y-1">
        {userCalendars.map((calendar) => (
          <li key={calendar.id}>
            {isEditing && isEditing.id === calendar.id ? (
              <div className="p-2 bg-gray-50 rounded-md">
                <input
                  type="text"
                  value={isEditing.name}
                  onChange={(e) => setIsEditing({...isEditing, name: e.target.value})}
                  className="w-full p-1 text-sm border rounded mb-2"
                />
                <div className="flex items-center mb-2">
                  <span className="text-xs mr-2">Color:</span>
                  <div className="flex space-x-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setIsEditing({...isEditing, color})}
                        className={`w-4 h-4 rounded-full ${isEditing.color === color ? 'ring-2 ring-offset-1 ring-orange-500' : ''}`}
                        style={{ backgroundColor: color }}
                      ></button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditing(null)}
                    className="px-2 py-1 text-xs text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateCalendar(calendar.id)}
                    className="px-2 py-1 text-xs bg-orange-600 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={`flex items-center justify-between p-2 text-sm rounded-md cursor-pointer ${
                  selectedCalendarId === calendar.id ? 'bg-orange-100' : 'hover:bg-gray-100'
                }`}
              >
                <div 
                  className="flex items-center flex-1"
                  onClick={() => setSelectedCalendarId(calendar.id)}
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: calendar.color }}
                  ></div>
                  <span 
                    className={`truncate ${selectedCalendarId === calendar.id ? 'font-medium' : ''}`}
                  >
                    {calendar.name}
                  </span>
                </div>
                
                {calendar.isOwner && (
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => startSharing(calendar.id)}
                      className="text-gray-400 hover:text-orange-600"
                      title="Share Calendar"
                    >
                      <ShareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => startEditing(calendar)}
                      className="text-gray-400 hover:text-orange-600"
                      title="Edit Calendar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCalendar(calendar.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete Calendar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      
      {isSharing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4">
            <h3 className="text-lg font-medium mb-4">Share Calendar</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter the email address of the person you want to share this calendar with.
            </p>
            <input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="Email address"
              className="w-full p-2 border rounded mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsSharing(false)}
                className="px-3 py-2 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleShareCalendar}
                className="px-3 py-2 text-sm bg-orange-600 text-white rounded"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 