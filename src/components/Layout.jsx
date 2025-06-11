import React from 'react';

const Layout = ({ children, currentPage, onNavigateToLogin, onNavigateToSignup, onNavigateToDashboard, onLogout, isAuthenticated }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-0 font-sans antialiased flex flex-col">
      
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 p-4 md:p-6
                         flex justify-between items-center">
        <div className="flex items-center">
          {/* App Logo/Title - Always present and navigates to dashboard if authenticated */}
          <button
            onClick={() => onNavigateToDashboard()} // Navigate to dashboard or landing if not authenticated
            className="text-2xl font-bold text-blue-700 tracking-wide mr-6 hover:text-blue-800 transition-colors cursor-pointer"
          >
            Synitheia
          </button>
          
          {/* Conditional Navigation Links: Only shown when authenticated AND on the dashboard */}
          {isAuthenticated && currentPage === 'dashboard' && (
            <nav className="hidden sm:block">
              <ul className="flex space-x-6">
                <li><button onClick={() => onNavigateToDashboard()} className="text-gray-700 hover:text-blue-600 font-medium text-lg">Habits</button></li>
                <li><button onClick={() => console.log('Progress clicked')} className="text-gray-700 hover:text-blue-600 font-medium text-lg">Progress</button></li>
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

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 py-8
                      max-w-2xl sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
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
