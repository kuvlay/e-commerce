import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting admin login with:", { email, password });
      console.log("Backend URL:", `${backendUrl}/api/user/admin`);
      
      const response = await axios.post(`${backendUrl}/api/user/admin`, {
        email,
        password
      }, {
        timeout: 10000 // 10 second timeout
      });

      console.log("Login response:", response);

      if (response.data.success) {
        setToken(response.data.token);
        toast.success("Welcome to Admin Panel!");
      } else {
        console.error("Login failed with message:", response.data.message);
        toast.error(response.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error details:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url
      });
      
      // More detailed error messages
      if (error.code === 'ECONNABORTED') {
        toast.error("Connection timeout. Please check your network connection.");
      } else if (error.response) {
        // Server responded with error status
        switch (error.response.status) {
          case 401:
            toast.error("Invalid credentials. Please check your email and password.");
            break;
          case 403:
            toast.error("Access denied. You don't have permission to access the admin panel.");
            break;
          case 404:
            toast.error("Login endpoint not found. Please check the backend URL configuration.");
            break;
          case 500:
            toast.error("Server error. Please try again later.");
            break;
          default:
            toast.error(`Login failed: ${error.response.data?.message || error.response.statusText || "Unknown error"}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        toast.error("Connection failed. Please check your network connection and backend server status.");
      } else {
        // Something else happened
        toast.error(`Login error: ${error.message || "Unknown error occurred"}`);
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 bg-white/10 backdrop-blur-lg shadow-2xl rounded-3xl px-8 py-10 max-w-md w-full mx-4 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-white/70">Manage your Bihar Products store</p>
        </div>

        <form onSubmit={onSubmitHandler} className="space-y-6">
          <div className="relative">
            <input
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
              type="email"
              placeholder="Email Address"
              required
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-white/50">📧</span>
            </div>
          </div>

          <div className="relative">
            <input
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
              type="password"
              placeholder="Password"
              required
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-white/50">🔒</span>
            </div>
          </div>

          <button
            className={`w-full py-3 px-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
              isLoading
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
            }`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </div>
            ) : (
              'Sign In to Admin Panel'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white/70 text-sm text-center">
            Use your admin credentials to access the panel
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;