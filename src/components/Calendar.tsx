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
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, MoreVertical, Trash2, Bell, BellOff } from 'lucide-react';
import { CalendarEvent } from '../types';
import { fetchEvents, createEvent, deleteEvent } from '../lib/api';
import { toast } from 'react-hot-toast';

interface CalendarProps {
  userId: string;
}

export function Calendar({ userId }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    description: '', 
    reminderTime: 15 // Default reminder time in minutes
  });
  const [activeEventMenu, setActiveEventMenu] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
    // Set up event reminder check interval
    const checkInterval = setInterval(checkEventReminders, 60000); // Check every minute
    return () => clearInterval(checkInterval);
  }, [userId]);

  const loadEvents = async () => {
    try {
      const data = await fetchEvents(userId);
      setEvents(data);
    } catch (error: any) {
      toast.error('Failed to fetch events');
    }
  };

  const checkEventReminders = () => {
    const now = new Date();
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const reminderTime = addMinutes(eventDate, -event.reminderTime);
      
      // Check if it's time for the reminder
      if (!isPast(reminderTime) && differenceInMinutes(reminderTime, now) <= 1) {
        // Request permission for notifications if not granted
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
        
        // Show notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('Event Reminder', {
            body: `Upcoming event: ${event.title} at ${format(eventDate, 'h:mm a')}`,
            icon: '/calendar-icon.png'
          });
        } else {
          // Fallback to toast notification
          toast(`Upcoming event: ${event.title} at ${format(eventDate, 'h:mm a')}`, {
            icon: '🔔',
            duration: 5000
          });
        }
      }
    });
  };

  const handleAddEvent = async () => {
    if (!selectedDate || !newEvent.title) return;

    try {
      await createEvent(userId, {
        title: newEvent.title,
        description: newEvent.description,
        date: selectedDate.toISOString(),
        reminderTime: newEvent.reminderTime
      });

      toast.success('Event added successfully');
      setShowEventModal(false);
      setNewEvent({ title: '', description: '', reminderTime: 15 });
      loadEvents();
    } catch (error: any) {
      toast.error('Failed to add event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast.success('Event deleted successfully');
      loadEvents();
      setActiveEventMenu(null);
    } catch (error: any) {
      toast.error('Failed to delete event');
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getEventsForDate = (date: Date) => {
    return events.filter((event) =>
      isSameDay(new Date(event.date), date)
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-light text-zinc-800 tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
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

        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center font-medium text-zinc-400 py-2"
            >
              {day}
            </div>
          ))}

          {days.map((day) => {
            const dayEvents = getEventsForDate(day);
            const hasEvents = dayEvents.length > 0;
            return (
              <div
                key={day.toString()}
                className={`min-h-[120px] p-3 rounded-xl border transition-all duration-200 hover:shadow-md calendar-day
                  ${isSameMonth(day, currentDate)
                    ? 'bg-white'
                    : 'bg-zinc-50 text-zinc-400'
                  }
                  ${hasEvents ? 'border-zinc-300' : 'border-zinc-100'}
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
                  <button 
                    className="text-zinc-400 hover:text-zinc-600 transition duration-200"
                    onClick={() => {
                      setSelectedDate(day);
                      setShowEventModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="relative group"
                    >
                      <div className="text-sm p-2 bg-zinc-50 rounded-lg text-zinc-700 group-hover:bg-zinc-100 transition duration-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1">
                            {event.reminderTime > 0 && (
                              <Bell className="w-3 h-3 text-zinc-400" />
                            )}
                            <span className="truncate">{event.title}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveEventMenu(activeEventMenu === event.id ? null : event.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition duration-200"
                          >
                            <MoreVertical className="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
                          </button>
                        </div>
                      </div>
                      {activeEventMenu === event.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-50 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Event</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-light text-zinc-800 mb-4">
              Add Event for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <input
              type="text"
              placeholder="Event Title"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 mb-4"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
            />
            <textarea
              placeholder="Event Description"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 mb-4 min-h-[100px]"
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
            />
            <div className="mb-4">
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
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 text-zinc-600 hover:text-zinc-900 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition duration-200"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}