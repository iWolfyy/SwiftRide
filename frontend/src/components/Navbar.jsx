import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AiOutlineMenu, AiOutlineClose, AiOutlineUser, AiOutlineLogout } from 'react-icons/ai';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'customer': return '/customer-dashboard';
      case 'seller': return '/seller-dashboard';
      case 'branch-manager': return '/branch-manager-dashboard';
      case 'admin': return '/admin-dashboard';
      default: return '/';
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl fixed w-full z-50 backdrop-blur-sm border-b border-blue-500/20">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-indigo-800/90"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center font-bold text-2xl tracking-wide hover:scale-105 transition-all duration-300 relative group">
            <div className="relative">
              <img 
                src="/logo.png"
                alt="SwiftRide Logo" 
                className="h-10 w-10 mr-3 object-contain drop-shadow-lg group-hover:rotate-12 transition-transform duration-300"
              />
              {/* Glow effect */}
              <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-sm group-hover:bg-yellow-400/30 transition-all duration-300"></div>
            </div>
            <div className="relative">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent font-black">Swift</span>
              <span className="text-white font-bold">Ride</span>
            </div>
            {/* Hover effect line */}
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-300 group-hover:w-full transition-all duration-300"></div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="relative px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group">
              <span className="relative z-10 font-medium">Home</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-300/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-300 group-hover:w-3/4 transition-all duration-300"></div>
            </Link>
            <Link to="/vehicles" className="relative px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group">
              <span className="relative z-10 font-medium">Vehicles</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-300/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-300 group-hover:w-3/4 transition-all duration-300"></div>
            </Link>
            <Link to="/branches" className="relative px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group">
              <span className="relative z-10 font-medium">Branches</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-300/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-300 group-hover:w-3/4 transition-all duration-300"></div>
            </Link>

            {user ? (
              <>
                <Link to={getDashboardLink()} className="relative px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group">
                  <span className="relative z-10 font-medium">Dashboard</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-300/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-300 group-hover:w-3/4 transition-all duration-300"></div>
                </Link>
                <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-800/80 to-indigo-900/80 backdrop-blur-sm px-4 py-2 rounded-full relative border border-blue-500/30 shadow-lg">
                  <div className="p-1 bg-white/20 rounded-full">
                    <AiOutlineUser className="text-lg" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs bg-gradient-to-r from-yellow-400 to-yellow-300 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <AiOutlineLogout />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="relative px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group">
                  <span className="relative z-10 font-medium">Login</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-300/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-300 group-hover:w-3/4 transition-all duration-300"></div>
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-yellow-400 to-yellow-300 text-blue-900 px-6 py-2 rounded-lg font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-lg hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="relative">
                {isMenuOpen ? <AiOutlineClose size={24} className="group-hover:rotate-90 transition-transform duration-300" /> : <AiOutlineMenu size={24} className="group-hover:scale-110 transition-transform duration-300" />}
                <div className="absolute inset-0 bg-yellow-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gradient-to-b from-blue-700 to-indigo-800 shadow-2xl border-t border-blue-500/20">
          <div className="px-4 pt-6 pb-8 space-y-4">
            <Link to="/" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-300 group" onClick={() => setIsMenuOpen(false)}>
              <span className="group-hover:text-yellow-300 transition-colors duration-300 font-medium">Home</span>
            </Link>
            <Link to="/vehicles" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-300 group" onClick={() => setIsMenuOpen(false)}>
              <span className="group-hover:text-yellow-300 transition-colors duration-300 font-medium">Vehicles</span>
            </Link>
            <Link to="/branches" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-300 group" onClick={() => setIsMenuOpen(false)}>
              <span className="group-hover:text-yellow-300 transition-colors duration-300 font-medium">Branches</span>
            </Link>

            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="group-hover:text-yellow-300 transition-colors duration-300 font-medium">Dashboard</span>
                </Link>
                <div className="px-4 py-3 bg-gradient-to-r from-blue-800/80 to-indigo-900/80 backdrop-blur-sm rounded-lg relative border border-blue-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-full">
                      <AiOutlineUser className="text-lg" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs bg-gradient-to-r from-yellow-400 to-yellow-300 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                        {user.role}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-3 rounded-lg text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <AiOutlineLogout />
                    <span>Logout</span>
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-300 group" onClick={() => setIsMenuOpen(false)}>
                  <span className="group-hover:text-yellow-300 transition-colors duration-300 font-medium">Login</span>
                </Link>
                <Link
                  to="/register"
                  className="block bg-gradient-to-r from-yellow-400 to-yellow-300 text-blue-900 px-4 py-3 rounded-lg font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
