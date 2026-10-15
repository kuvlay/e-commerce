import { assets } from "../../assets/assets";
import { FaFacebookF, FaTwitter, FaInstagram, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          
          {/* Brand Section */}
          <div>
            <img src={assets.logo} className="mb-3 w-24 brightness-0 invert" alt="Kharido" />
            <p className="text-sm text-gray-300 mb-4">
              Your ultimate shopping destination with premium quality products.
            </p>
            
            {/* Social Media */}
            <div className="flex space-x-3">
              {[
                { icon: FaFacebookF, href: "https://facebook.com/kharido" },
                { icon: FaTwitter, href: "https://twitter.com/kharido" },
                { icon: FaInstagram, href: "https://instagram.com/kharido" }
              ].map(({ icon: Icon, href }, index) => (
                <a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-colors duration-300"
                >
                  <Icon className="text-sm" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { name: 'About', path: '/about' },
                { name: 'Shop', path: '/collection' },
                { name: 'Contact', path: '/contact' },
                { name: 'Orders', path: '/orders' }
              ].map((link) => (
                <li key={link.name}>
                  <button 
                    onClick={() => navigate(link.path)}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-sm text-gray-300">hello@kharido.com</p>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-4 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="flex items-center space-x-2 mb-2 md:mb-0">
            <p className="text-sm text-gray-400">© 2024 Kharido. Made with</p>
            <FaHeart className="text-red-500" />
            <p className="text-sm text-gray-400">for shopping</p>
          </div>
          
          <div className="flex space-x-4">
            <button 
              onClick={() => navigate('/privacy-policy')}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => navigate('/terms-of-service')}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
