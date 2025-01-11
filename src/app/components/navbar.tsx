'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  const pathname = usePathname();

  const isLibraryActive =
    pathname === '/library' ||
    pathname === '/chat' ||
    pathname?.startsWith('/collections');

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', isActive: pathname === '/dashboard' },
    { label: 'Library', path: '/library', isActive: isLibraryActive },
    { label: 'Citations', path: '/citations', isActive: pathname === '/citations' },
  ];

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center space-x-2">
        <span className="text-2xl font-bold">
          <span className="text-blue-500">Nabu</span>
          <span>AI</span>
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center space-x-8">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              item.isActive
                ? 'text-blue-500 bg-blue-50'
                : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* User Profile */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Yang Gao</span>
        <button className="p-1 rounded-full hover:bg-gray-100">
          <svg 
            className="w-5 h-5 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;