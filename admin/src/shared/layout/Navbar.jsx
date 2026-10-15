import { assets } from "../../assets/assets";
import { useState, useEffect } from "react";

const Navbar = ({ setToken }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      setToken("");
      localStorage.removeItem("token");
    }
  };

  return (
    <div className="bg-white shadow-lg border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <img 
            src={assets.logo} 
            className="w-12 h-12 rounded-full shadow-md" 
            alt="Kharido" 
          />
          <div>
            <h1 className="text-xl font-bold text-gray-800">Kharido</h1>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
        </div>

        {/* Center - Current Time */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl shadow-md">
            <div className="text-center">
              <p className="text-xs opacity-90">Current Time</p>
              <p className="font-semibold">
                {currentTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-4 py-2 rounded-xl shadow-md">
            <div className="text-center">
              <p className="text-xs opacity-90">Today</p>
              <p className="font-semibold">
                {currentTime.toLocaleDateString([], { 
                  month: 'short', 
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Admin Info and Logout */}
        <div className="flex items-center space-x-4">
          {/* Admin Profile */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              A
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md flex items-center space-x-2"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
