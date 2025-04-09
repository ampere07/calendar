export interface User {
  email: string;
  password?: string;
}

export interface CalendarEvent {
  _id: string;
  userEmail: string;
  title: string;
  description: string;
  date: string;
  reminderTime: number;
  createdAt: string;
}