'use client'

import React, { useState, useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from '@fullcalendar/core'
import { useModal } from '@/hooks/useModal'
import { Modal } from '@/components/ui/modal'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'
import Button from '@/components/ui/button/Button'
import { cn } from '@/lib/utils'

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string
  }
}

/**
 * Calendar Component - Full calendar với FullCalendar
 * 
 * Hỗ trợ:
 * - Xem events theo month/week/day
 * - Click vào date để thêm event
 * - Click vào event để edit
 * - Color coding cho events
 */
const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [eventTitle, setEventTitle] = useState('')
  const [eventStartDate, setEventStartDate] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventLevel, setEventLevel] = useState('')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const calendarRef = useRef<FullCalendar>(null)
  const { isOpen, openModal, closeModal } = useModal()

  const calendarsEvents = {
    Danger: 'danger',
    Success: 'success',
    Primary: 'primary',
    Warning: 'warning',
  }

  useEffect(() => {
    // Initialize with some events
    setEvents([
      {
        id: '1',
        title: 'Event Conf.',
        start: new Date().toISOString().split('T')[0],
        extendedProps: { calendar: 'Danger' },
      },
      {
        id: '2',
        title: 'Meeting',
        start: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        extendedProps: { calendar: 'Success' },
      },
      {
        id: '3',
        title: 'Workshop',
        start: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        end: new Date(Date.now() + 259200000).toISOString().split('T')[0],
        extendedProps: { calendar: 'Primary' },
      },
    ])
  }, [])

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields()
    setEventStartDate(selectInfo.startStr)
    setEventEndDate(selectInfo.endStr || selectInfo.startStr)
    openModal()
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event
    setSelectedEvent(event as unknown as CalendarEvent)
    setEventTitle(event.title)
    setEventStartDate(event.start?.toISOString().split('T')[0] || '')
    setEventEndDate(event.end?.toISOString().split('T')[0] || '')
    setEventLevel(event.extendedProps.calendar || '')
    openModal()
  }

  const handleAddOrUpdateEvent = () => {
    if (selectedEvent) {
      // Update existing event
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                title: eventTitle,
                start: eventStartDate,
                end: eventEndDate,
                extendedProps: { calendar: eventLevel },
              }
            : event
        )
      )
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventTitle,
        start: eventStartDate,
        end: eventEndDate,
        allDay: true,
        extendedProps: { calendar: eventLevel },
      }
      setEvents((prevEvents) => [...prevEvents, newEvent])
    }
    closeModal()
    resetModalFields()
  }

  const resetModalFields = () => {
    setEventTitle('')
    setEventStartDate('')
    setEventEndDate('')
    setEventLevel('')
    setSelectedEvent(null)
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card">
        <div className="custom-calendar p-4 lg:p-6">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next addEventButton',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: 'Add Event +',
                click: () => {
                  resetModalFields()
                  openModal()
                },
              },
            }}
          />
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          closeModal()
          resetModalFields()
        }}
        className="max-w-[700px] m-4"
      >
        <div className="flex flex-col px-2 overflow-y-auto p-6">
          <div>
            <h5 className="mb-2 font-semibold text-foreground text-xl lg:text-2xl">
              {selectedEvent ? 'Edit Event' : 'Add Event'}
            </h5>
            <p className="text-sm text-muted-foreground">
              Plan your next big moment: schedule or edit an event to stay on track
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div>
              <Label>Event Title</Label>
              <Input
                id="event-title"
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Enter event title"
              />
            </div>

            <div>
              <Label className="mb-4">Event Color</Label>
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {Object.entries(calendarsEvents).map(([key, value]) => (
                  <div key={key}>
                    <label
                      className="flex items-center text-sm text-foreground cursor-pointer"
                      htmlFor={`modal${key}`}
                    >
                      <span className="relative">
                        <input
                          className="sr-only"
                          type="radio"
                          name="event-level"
                          value={key}
                          id={`modal${key}`}
                          checked={eventLevel === key}
                          onChange={() => setEventLevel(key)}
                        />
                        <span
                          className={cn(
                            'flex items-center justify-center w-5 h-5 mr-2 border rounded-full',
                            eventLevel === key
                              ? 'border-primary bg-primary'
                              : 'border-input'
                          )}
                        >
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full bg-background',
                              eventLevel === key ? 'block' : 'hidden'
                            )}
                          />
                        </span>
                      </span>
                      {key}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Enter Start Date</Label>
              <Input
                id="event-start-date"
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Enter End Date</Label>
              <Input
                id="event-end-date"
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6 sm:justify-end">
            <Button variant="outline" onClick={() => {
              closeModal()
              resetModalFields()
            }}>
              Close
            </Button>
            <Button onClick={handleAddOrUpdateEvent}>
              {selectedEvent ? 'Update Changes' : 'Add Event'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/**
 * Render event content với color coding
 */
const renderEventContent = (eventInfo: EventContentArg) => {
  const calendarType = eventInfo.event.extendedProps.calendar?.toLowerCase() || 'primary'
  
  const colorMap: Record<string, string> = {
    danger: 'bg-red-500 text-white',
    success: 'bg-green-500 text-white',
    primary: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-white',
  }

  const colorClass = colorMap[calendarType] || colorMap.primary

  return (
    <div className={cn('flex items-center gap-1 p-1 rounded-sm', colorClass)}>
      <div className="w-2 h-2 rounded-full bg-white/80" />
      <div className="text-xs font-medium truncate">
        {eventInfo.timeText && <span>{eventInfo.timeText} </span>}
        {eventInfo.event.title}
      </div>
    </div>
  )
}

export default Calendar



