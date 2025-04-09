import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Calendar } from './components/Calendar';
import { Toaster } from 'react-hot-toast';

function App() {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('userEmail');
  });

  const handleAuth = (email: string) => {
    localStorage.setItem('userEmail', email);
    setUserEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    setUserEmail(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Toaster position="top-right" />
      {userEmail ? (
        <>
          <nav className="bg-white shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
              <h1 className="text-xl font-semibold text-zinc-800 hidden sm:block"> Calendar</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-zinc-600">{userEmail}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </nav>
          <Calendar userEmail={userEmail} />
        </>
      ) : (
        <Auth onAuth={handleAuth} />
      )}
    </div>
  );
}

export default App;