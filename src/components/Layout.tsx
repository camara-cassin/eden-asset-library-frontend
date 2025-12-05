import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { to: '/', label: 'Dashboard', requiresAuth: true },
    { to: '/assets/new', label: 'Create Asset', requiresAuth: true },
    { to: '/public', label: 'Public', requiresAuth: false },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-[#E6EEFF]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="text-[#0F2C8C] text-xl font-semibold">
              EDEN Asset Library
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              {navLinks.map((link) => {
                if (link.requiresAuth && !isAuthenticated) return null;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'text-[#1B4FFF]'
                        : 'text-[#4A4A4A] hover:text-[#1B4FFF]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-[#E6EEFF]">
                  <span className="text-sm text-[#4A4A4A]">
                    Logged in as <span className="font-medium">{user?.email}</span>{' '}
                    <span className="text-[#7A7A7A]">({user?.role})</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="text-[#4A4A4A] border-[#D8D8D8] hover:bg-[#F5F6FA]"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-[#E6EEFF]">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-[#4A4A4A] hover:text-[#1B4FFF]"
                  >
                    Login
                  </Link>
                  <Link to="/signup">
                    <Button
                      size="sm"
                      className="bg-[#1B4FFF] hover:bg-[#0F2C8C] text-white"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
