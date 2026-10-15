import { NavLink } from "react-router-dom";
import { assets } from "../../assets/assets";

const SideBar = () => {
  const menuItems = [
    {
      path: "/",
      icon: "📊",
      label: "Dashboard",
      description: "Overview & Analytics"
    },
    {
      path: "/add",
      icon: "➕",
      label: "Add Product",
      description: "Create new items"
    },
    {
      path: "/list",
      icon: "📦",
      label: "Products",
      description: "Manage inventory"
    },
    {
      path: "/order",
      icon: "🛒",
      label: "Orders",
      description: "Order management"
    },
    {
      path: "/customers",
      icon: "👥",
      label: "Customers",
      description: "Customer database"
    },
    {
      path: "/messages",
      icon: "💬",
      label: "Messages",
      description: "Contact inquiries"
    },
    {
      path: "/reviews",
      icon: "⭐",
      label: "Reviews",
      description: "Manage testimonials"
    }
  ];

  return (
    <div className="w-72 min-h-screen bg-white shadow-xl border-r border-gray-200">
      <div className="p-6">
        {/* Sidebar Header */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Navigation</h2>
          <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-3">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <div className="flex items-center space-x-4 w-full">
                <div className={`text-2xl transition-transform duration-300 group-hover:scale-110`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className={`text-xs opacity-75 mt-1`}>
                    {item.description}
                  </p>
                </div>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="mt-12 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Quick Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Active Products</span>
              <span className="text-xs font-bold text-blue-600">24</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Pending Orders</span>
              <span className="text-xs font-bold text-orange-600">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Total Customers</span>
              <span className="text-xs font-bold text-green-600">156</span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
          <div className="text-center">
            <div className="text-2xl mb-2">💡</div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">Need Help?</h3>
            <p className="text-xs text-gray-600 mb-3">
              Check our documentation for detailed guides
            </p>
            <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold py-2 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300">
              View Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
