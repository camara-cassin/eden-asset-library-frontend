import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/assets/new', label: 'Create Asset' },
    { to: '/public', label: 'Public' },
  ];

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
              {navLinks.map((link) => (
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
              ))}
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
