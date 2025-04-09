import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Calendar } from './components/Calendar';
import { Toaster } from 'react-hot-toast';

function App() {
  const [userId, setUserId] = useState<string | null>(null);

  const handleLogout = () => {
    setUserId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Toaster position="top-right" />
      {userId ? (
        <>
          <nav className="bg-white shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-end">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition duration-200"
              >
                Logout
              </button>
            </div>
          </nav>
          <Calendar userId={userId} />
        </>
      ) : (
        <Auth onAuth={(userId) => setUserId(userId)} />
      )}
    </div>
  );
}

export default App;