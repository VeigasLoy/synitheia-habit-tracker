import React, { useState, useEffect } from 'react';

const Layout = ({ children, currentPage, onNavigateToLogin, onNavigateToSignup, onNavigateToDashboard, onLogout, isAuthenticated, onNavigateToFocus }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when navigating or on page change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [currentPage]);

  // Handle outside clicks to close sidebar on small screens
  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Check if sidebar is open and click is outside the sidebar area
      if (isSidebarOpen && !event.target.closest('.sidebar-content') && !event.target.closest('.sidebar-toggle')) {
        setIsSidebarOpen(false);
      }
    };
    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSidebarOpen]);

  // Determine if full navigation (Home, Focus, Settings) should be shown
  // This typically applies to authenticated users on dashboard, focus, or settings pages
  const showFullNavigation = isAuthenticated && (currentPage === 'dashboard' || currentPage === 'focus' || currentPage === 'settings');

  return (
    // Apply overflow-x-hidden to prevent horizontal scrolling of the entire layout
    <div className="min-h-screen bg-gray-100 p-0 font-sans antialiased flex flex-col overflow-x-hidden">
      
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 p-4 md:p-6
                         flex justify-between items-center z-20 relative">
        <div className="flex items-center">
          {/* Sidebar Toggle (Hamburger Icon) - Visible on small screens for pages with full navigation */}
          {showFullNavigation && ( // Condition updated
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="sidebar-toggle text-gray-700 hover:text-blue-600 p-2 rounded-md sm:hidden mr-4"
              aria-label="Toggle navigation"
            >
              <svg xmlns="http://www.w3.org/24/24" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* App Logo/Title - Always present and navigates to dashboard if authenticated */}
          <button
            onClick={() => onNavigateToDashboard()} // Navigate to dashboard or landing if not authenticated
            className="text-2xl font-bold text-blue-700 tracking-wide mr-6 hover:text-blue-800 transition-colors cursor-pointer"
          >
            Synitheia
          </button>
          
          {/* Conditional Navigation Links: Only shown when authenticated AND on applicable pages, on larger screens */}
          {showFullNavigation && ( // Condition updated
            <nav className="hidden sm:block"> {/* Hidden on small screens, shown on large */}
              <ul className="flex space-x-6">
                <li><button onClick={() => onNavigateToDashboard()} className="text-gray-700 hover:text-blue-600 font-medium text-lg">Home</button></li>
                <li><button onClick={onNavigateToFocus} className="text-gray-700 hover:text-blue-600 font-medium text-lg">Focus</button></li>
                <li><button onClick={() => console.log('Settings clicked')} className="text-gray-700 hover:text-blue-600 font-medium text-lg">Settings</button></li>
              </ul>
            </nav>
          )}
        </div>
        
        {/* Conditional Auth Buttons */}
        {isAuthenticated ? (
          // Show Logout if authenticated
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-sm">Logout</button>
        ) : (
          // Show Login/Sign Up buttons if not authenticated (covers landing, login, signup pages)
          <div className="flex space-x-3">
            <button onClick={onNavigateToLogin} className="text-blue-600 hover:text-blue-700 font-bold py-2 px-4 rounded-sm border border-blue-600 hover:border-blue-700">Login</button>
            <button onClick={onNavigateToSignup} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm">Sign Up</button>
          </div>
        )}
      </header>

      {/* Sidebar Overlay (for small screens when sidebar is open) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-50 bg-opacity-75 z-10 sm:hidden" 
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 text-gray-800 p-6 z-20 
                   transform transition-transform duration-300 ease-in-out
                   ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                   sm:translate-x-0 sm:static sm:h-auto sm:w-auto sm:p-0 sm:bg-transparent sm:text-inherit sm:border-r-0`}
      >
        <div className="sidebar-content h-full flex flex-col sm:hidden"> {/* Hide content on larger screens as it's in main header */}
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Menu</h2>
          <nav>
            <ul className="space-y-4">
              <li>
                <button 
                  onClick={() => { onNavigateToDashboard(); setIsSidebarOpen(false); }}
                  className="block text-xl text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { onNavigateToFocus(); setIsSidebarOpen(false); }}
                  className="block text-xl text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  Focus
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { console.log('Settings clicked'); setIsSidebarOpen(false); }}
                  className="block text-xl text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  Settings
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className={`flex-grow px-4 py-8 w-full 
                   max-w-2xl sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl
                   transition-all duration-300 ease-in-out
                   ${isSidebarOpen ? 'sm:ml-64 mx-auto' : 'mx-auto'}`} 
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200 p-4 md:p-6 text-center text-gray-600 text-sm">
        <p className="mb-2">&copy; {new Date().getFullYear()} Synitheia. All rights reserved.</p>
        <nav className="flex justify-center space-x-4">
          <a href="#" className="hover:text-blue-600">Privacy Policy</a>
          <a href="#" className="hover:text-blue-600">Terms of Service</a>
          <a href="#" className="hover:text-blue-600">Contact</a>
        </nav>
      </footer>
    </div>
  );
};

export default Layout;
