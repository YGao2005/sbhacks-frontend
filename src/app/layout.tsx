import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './components/navbar';  // Updated path to go up to src directory

// Initialize Inter font
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NabuAI - Research Assistant',
  description: 'Your AI-powered research assistant for academic papers and documents',
  keywords: ['research', 'AI', 'academic papers', 'document analysis'],
  authors: [{ name: 'NabuAI Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Main layout container */}
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <Navbar />
          
          {/* Main content area */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Optional Footer */}
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} NabuAI. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}