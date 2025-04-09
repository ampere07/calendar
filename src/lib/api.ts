const API_URL = 'https://calendar-s4uq.onrender.com/api';

export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Login failed');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Failed to connect to the server');
  }
};

export const register = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Registration failed');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Failed to connect to the server');
  }
};

export const fetchEvents = async (userId: string) => {
  try {
    const response = await fetch(`${API_URL}/events/${userId}`);
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to fetch events');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Fetch events error:', error);
    throw new Error(error.message || 'Failed to connect to the server');
  }
};

export const createEvent = async (userId: string, event: Partial<CalendarEvent>) => {
  try {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...event, userId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create event');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Create event error:', error);
    throw new Error(error.message || 'Failed to connect to the server');
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
      throw new Error('Invalid event ID');
    }

    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete event');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Delete event error:', error);
    throw new Error(error.message || 'Failed to delete event');
  }
};