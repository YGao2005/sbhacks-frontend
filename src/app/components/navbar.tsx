'use client';

import Link from 'next/link';
import { useState } from 'react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-500">NabuAI</h1>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-12 md:flex md:space-x-8">
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/library" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 font-medium"
              >
                Library
              </Link>
              <Link 
                href="/citations" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 font-medium"
              >
                Citations
              </Link>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center">
            <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full">
              Yang Gao
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/dashboard"
            className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            onClick={handleLinkClick}
          >
            Dashboard
          </Link>
          <Link
            href="/library"
            className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            onClick={handleLinkClick}
          >
            Library
          </Link>
          <Link
            href="/citations"
            className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            onClick={handleLinkClick}
          >
            Citations
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;