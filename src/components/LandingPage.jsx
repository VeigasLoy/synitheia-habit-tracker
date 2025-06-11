import React from 'react';

const LandingPage = ({ onStartTracking }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 text-center"> {/* Adjust min-height to account for header/footer */}
      <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
        Build Better Habits, <br className="hidden sm:inline"/>One Day at a Time.
      </h1>
      <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl">
        Synitheia helps you track your daily routines, celebrate streaks, and stay motivated on your journey to self-improvement.
      </p>
      
      <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row">
        <button
          onClick={onStartTracking}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
        >
          Start Tracking Now
        </button>
        <button
          onClick={() => alert("Learn More feature coming soon!")} // Replace with actual navigation to an About/Features page
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
        >
          Learn More
        </button>
      </div>

      <div className="mt-12 text-left w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Key Features:</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 text-lg">
          <li className="flex items-center">
            <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Daily Check-ins
          </li>
          <li className="flex items-center">
            <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Streak Tracking
          </li>
          <li className="flex items-center">
            <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Reminder Notifications
          </li>
          <li className="flex items-center">
            <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Visual Progress Charts
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LandingPage;
