import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  addMinutes,
  isPast,
  differenceInMinutes,
  parseISO,
  getDay,
  lastDayOfWeek,
  addDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Bell, BellOff, Calendar as CalendarIcon, Menu, X, Clock } from 'lucide-react';
import { CalendarEvent } from '../types';
import { fetchEvents, createEvent, deleteEvent } from '../lib/api';
import { toast } from 'react-hot-toast';

interface CalendarProps {
  userEmail: string;
}

export function Calendar({ userEmail }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    reminderTime: 15
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: Date | null, events: CalendarEvent[] }>({
    date: null,
    events: []
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      if (window.innerWidth < 640) {
        setShowSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (userEmail) {
      loadEvents();
      const checkInterval = setInterval(checkEventReminders, 60000);
      return () => clearInterval(checkInterval);
    }
  }, [userEmail]);

  const loadEvents = async () => {
    try {
      const data = await fetchEvents(userEmail);
      setEvents(data);
    } catch (error: any) {
      toast.error('Failed to fetch events');
      console.error('Fetch events error:', error);
    }
  };

  const checkEventReminders = () => {
    const now = new Date();
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const reminderTime = addMinutes(eventDate, -event.reminderTime);

      if (!isPast(reminderTime) && differenceInMinutes(reminderTime, now) <= 1) {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
          new Notification('Event Reminder', {
            body: `Upcoming event: ${event.title} at ${format(eventDate, 'h:mm a')}`,
            icon: '/calendar-icon.png'
          });
        } else {
          toast(`Upcoming event: ${event.title} at ${format(eventDate, 'h:mm a')}`, {
            icon: '🔔',
            duration: 5000
          });
        }
      }
    });
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createEvent(userEmail, {
        title: newEvent.title,
        description: newEvent.description,
        date: new Date(newEvent.date).toISOString(),
        reminderTime: newEvent.reminderTime
      });

      toast.success('Event added successfully');
      setShowEventForm(false);
      setNewEvent({
        title: '',
        description: '',
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        reminderTime: 15
      });
      loadEvents();
    } catch (error: any) {
      toast.error('Failed to add event');
      console.error('Add event error:', error);
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    try {
      await deleteEvent(userEmail, event.title, event.description);
      toast.success('Event deleted successfully');
      loadEvents();

      // Close the modal if it's open
      if (selectedDateEvents.date) {
        setSelectedDateEvents({ date: null, events: [] });
      }
    } catch (error: any) {
      toast.error('Failed to delete event');
      console.error('Delete event error:', error);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = new Date(monthStart);

  const startDay = getDay(monthStart);
  startDate.setDate(1 - startDay);

  const endDate = addDays(startDate, 41);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getEventsForDate = (date: Date) => {
    return events.filter((event) =>
      isSameDay(new Date(event.date), date)
    );
  };

  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handleDateClick = (date: Date, events: CalendarEvent[]) => {
    setSelectedDateEvents({
      date,
      events: events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    });
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-50 relative">
      {/* Mobile Header with Hamburger Menu */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 flex items-center px-4 sm:hidden z-20">
        <button
          onClick={() => setShowSidebar(true)}
          className="p-2 hover:bg-zinc-100 rounded-xl transition duration-200"
        >
          <Menu className="w-6 h-6 text-zinc-600" />
        </button>
        <h1 className="ml-4 text-lg font-semibold text-zinc-800">Calendar</h1>
      </div>

      {/* Overlay for mobile sidebar */}
      {showSidebar && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Side Navigation */}
      <div
        className={`
          fixed sm:relative inset-y-0 left-0 w-[320px] sm:w-96
          bg-white border-r border-zinc-200
          transform transition-transform duration-300 ease-in-out z-30
          ${showSidebar ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-zinc-100">
            <h2 className="text-xl font-semibold text-zinc-800">Events</h2>
            {isMobile && (
              <button
                onClick={() => setShowSidebar(false)}
                className="sm:hidden text-zinc-400 hover:text-zinc-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="p-6 border-b border-zinc-100">
            {showEventForm ? (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Event Title"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
                <textarea
                  placeholder="Event Description"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 min-h-[100px]"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Reminder
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={newEvent.reminderTime}
                      onChange={(e) => setNewEvent({ ...newEvent, reminderTime: parseInt(e.target.value) })}
                      className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    >
                      <option value="0">No reminder</option>
                      <option value="5">5 minutes before</option>
                      <option value="15">15 minutes before</option>
                      <option value="30">30 minutes before</option>
                      <option value="60">1 hour before</option>
                    </select>
                    {newEvent.reminderTime > 0 ? (
                      <Bell className="w-5 h-5 text-zinc-600" />
                    ) : (
                      <BellOff className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEventForm(false)}
                    className="flex-1 px-4 py-2 text-zinc-600 hover:text-zinc-900 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEvent}
                    className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition duration-200"
                  >
                    Add Event
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowEventForm(true)}
                className="w-full px-4 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition duration-200 flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add New Event</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto events-sidebar p-6">
            <div className="space-y-4">
              {sortedEvents.length === 0 ? (
                <p className="text-center text-zinc-500 py-4">No events scheduled</p>
              ) : (
                sortedEvents.map((event) => (
                  <div
                    key={event._id}
                    className="p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-zinc-900 truncate">{event.title}</h3>
                        <p className="text-sm text-zinc-500">
                          {format(parseISO(event.date), 'MMM d, yyyy h:mm a')}
                        </p>
                        {event.description && (
                          <p className="text-sm text-zinc-600 mt-1 line-clamp-2">{event.description}</p>
                        )}
                        {event.reminderTime > 0 && (
                          <p className="text-xs text-zinc-500 mt-1 flex items-center">
                            <Bell className="w-3 h-3 mr-1" />
                            {event.reminderTime} minutes before
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        className="ml-2 text-zinc-400 hover:text-red-500 transition duration-200 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-auto mt-16 sm:mt-0">
        <div className="bg-white rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] p-4 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 rounded-xl hover:bg-zinc-100 transition duration-200"
                >
                  <CalendarIcon className="w-5 h-5 text-zinc-600" />
                </button>
              )}
              <h2 className="text-xl sm:text-3xl font-light text-zinc-800 tracking-tight">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 rounded-xl hover:bg-zinc-100 transition duration-200"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-600" />
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 rounded-xl hover:bg-zinc-100 transition duration-200"
              >
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-medium text-zinc-400 py-2 text-sm sm:text-base"
              >
                {isMobile ? day.charAt(0) : day}
              </div>
            ))}

            {days.map((day) => {
              const dayEvents = getEventsForDate(day);
              const hasEvents = dayEvents.length > 0;
              return (
                <div
                  key={day.toString()}
                  onClick={() => hasEvents && handleDateClick(day, dayEvents)}
                  className={`
                    ${isMobile ? 'min-h-[60px]' : 'min-h-[100px]'}
                    p-3 rounded-xl border transition-all duration-200 hover:shadow-md calendar-day
                    ${isSameMonth(day, currentDate) ? 'bg-white' : 'bg-zinc-50 text-zinc-400'}
                    ${hasEvents ? 'border-zinc-300 cursor-pointer' : 'border-zinc-100'}
                    ${isToday(day) ? 'ring-2 ring-zinc-800 ring-opacity-10' : ''}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <span className={`font-medium ${
                      isToday(day) ? 'text-zinc-900' :
                      hasEvents ? 'text-zinc-800' : 'text-zinc-600'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Mobile Event Indicators */}
                  {isMobile && hasEvents && (
                    <div className="mt-1 flex gap-1 flex-wrap">
                      {dayEvents.map((event) => (
                        <div
                          key={event._id}
                          className="w-2 h-2 rounded-full bg-zinc-800"
                          title={event.title}
                        />
                      ))}
                    </div>
                  )}

                  {/* Desktop Event List */}
                  {!isMobile && (
                    <div className="mt-2 space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event._id}
                          className="text-sm p-2 bg-zinc-50 rounded-lg text-zinc-700 hover:bg-zinc-100 transition duration-200"
                        >
                          <div className="flex items-center space-x-1">
                            {event.reminderTime > 0 && (
                              <Bell className="w-3 h-3 text-zinc-400" />
                            )}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date Events Modal */}
      {selectedDateEvents.date && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-zinc-800">
                Events for {format(selectedDateEvents.date, 'MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedDateEvents({ date: null, events: [] })}
                className="text-zinc-400 hover:text-zinc-600 transition duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedDateEvents.events.map((event) => (
                <div
                  key={event._id}
                  className="bg-zinc-50 rounded-xl p-4 hover:bg-zinc-100 transition duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-zinc-900">{event.title}</h4>
                      <div className="flex items-center text-sm text-zinc-500 mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {format(parseISO(event.date), 'h:mm a')}
                      </div>
                      {event.description && (
                        <p className="text-sm text-zinc-600 mt-2">{event.description}</p>
                      )}
                      {event.reminderTime > 0 && (
                        <div className="flex items-center text-xs text-zinc-500 mt-2">
                          <Bell className="w-3 h-3 mr-1" />
                          Reminder {event.reminderTime} minutes before
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event)}
                      className="ml-4 text-zinc-400 hover:text-red-500 transition duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDateEvents({ date: null, events: [] })}
                className="px-4 py-2 text-zinc-600 hover:text-zinc-900 transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}