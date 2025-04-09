export interface User {
  id: string;
  email: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  reminderTime: number;
  createdAt: string;
}