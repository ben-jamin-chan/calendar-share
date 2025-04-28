"use client"

import { format, addDays, startOfWeek } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { useMediaQuery } from "../hooks/useMediaQuery"

export default function CalendarHeader({ currentDate, onPrev, onNext, view, onViewChange, onToday }) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Generate the week days for the mini-week view
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))

  return (
    <div className="flex flex-col mb-1 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between py-1 sm:py-4">
        <div className="flex items-center">
          <h2 className="text-lg sm:text-xl font-semibold ml-3 text-gray-900">
            {format(currentDate, isMobile ? "MMM yyyy" : "MMMM yyyy")}
          </h2>
          <div className="ml-2 sm:ml-6 flex space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={onPrev}
              className="p-1 sm:p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="p-1 sm:p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="ml-1 sm:ml-4 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Today
            </button>
          </div>
        </div>

        <div className="flex space-x-1 rounded-md bg-gray-100 dark:bg-gray-700 p-0.5">
          <button
            type="button"
            onClick={() => onViewChange("month")}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md ${
              view === "month"
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {isMobile ? "Month" : "Month"}
          </button>
          <button
            type="button"
            onClick={() => onViewChange("week")}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md ${
              view === "week"
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {isMobile ? "Week" : "Week"}
          </button>
          <button
            type="button"
            onClick={() => onViewChange("day")}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md ${
              view === "day"
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {isMobile ? "Day" : "Day"}
          </button>
        </div>
      </div>

      {isMobile && (
        <div className="flex justify-between border-b border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-2">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center w-8 h-8 rounded-full ${
                format(day, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd")
                  ? "bg-orange-600 text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => onViewChange("day", day)}
            >
              <span className="text-xs">{format(day, "EEE")}</span>
              <span className="text-xs font-semibold">{format(day, "d")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
