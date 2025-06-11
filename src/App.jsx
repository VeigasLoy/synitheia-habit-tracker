import React, { useState, useEffect, useCallback } from 'react';
import { useIndexedDB } from './hooks/useIndexedDB';
import Layout from './components/Layout';
import AddHabitForm from './components/AddHabitForm'; // Still named AddHabitForm, but is reusable
import HabitCard from './components/HabitCard';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [showHabitFormModal, setShowHabitFormModal] = useState(false); // Renamed for clarity
  const [editingHabit, setEditingHabit] = useState(null); // New state to hold habit being edited
  
  // --- MOCK AUTHENTICATION SYSTEM (Managed by React state and localStorage) ---
  const [mockUsers, setMockUsers] = useState(() => {
    try {
      const storedUsers = localStorage.getItem('mockUsers');
      return storedUsers ? JSON.parse(storedUsers) : [];
    } catch (e) {
      console.error("App Init: Failed to parse mockUsers from localStorage", e);
      return [];
    }
  });

  const [currentLoggedInUser, setCurrentLoggedInUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('loggedInUser');
      return storedUser || null;
    } catch (e) {
      console.error("App Init: Failed to get loggedInUser from localStorage", e);
      return null;
    }
  });

  const [totalRewardPoints, setTotalRewardPoints] = useState(() => {
      if (currentLoggedInUser) {
          try {
              const storedPoints = localStorage.getItem(`userPoints_${currentLoggedInUser}`);
              return storedPoints ? parseInt(storedPoints, 10) : 0;
          } catch (e) {
              console.error(`Failed to load points for ${currentLoggedInUser} from localStorage on init`, e);
              return 0;
          }
      }
      return 0;
  });

  // Callback to increment total reward points from useIndexedDB
  const incrementTotalRewardPoints = useCallback((points) => {
      if (points > 0) {
          setTotalRewardPoints(prevPoints => prevPoints + points);
          console.log(`Added ${points} reward points. Total: ${totalRewardPoints + points}`);
      }
  }, []);

  const { habits, loading, error, addHabit, updateHabit, checkInHabit, deleteHabit, collectHabitReward } = useIndexedDB( // Added updateHabit
      currentLoggedInUser, 
      incrementTotalRewardPoints
  ); 

  // --- New states for Search, Filter, and Sort ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLabel, setFilterLabel] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  // Manage dynamic labels for the filter dropdown
  const [uniqueLabels, setUniqueLabels] = useState(['All', 'None', 'Health', 'Workout', 'Study']);

  useEffect(() => {
    const labelsFromHabits = new Set(habits.map(habit => habit.label).filter(Boolean));
    const combinedLabels = ['All', 'None', 'Health', 'Workout', 'Study', ...Array.from(labelsFromHabits)].sort();
    setUniqueLabels(Array.from(new Set(combinedLabels))); // Ensure uniqueness and sort
  }, [habits]);


  useEffect(() => {
    try {
      localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
    } catch (e) {
      console.error("Effect: Failed to save mockUsers to localStorage", e);
    }
  }, [mockUsers]);

  useEffect(() => {
    try {
      if (currentLoggedInUser) {
        localStorage.setItem('loggedInUser', currentLoggedInUser);
        localStorage.setItem(`userPoints_${currentLoggedInUser}`, totalRewardPoints.toString());
      } else {
        localStorage.removeItem('loggedInUser');
      }
    } catch (e) {
      console.error("Effect: Failed to save loggedInUser or userPoints to localStorage", e);
    }
  }, [currentLoggedInUser, totalRewardPoints]);

  useEffect(() => {
      if (currentLoggedInUser) {
          try {
              const storedPoints = localStorage.getItem(`userPoints_${currentLoggedInUser}`);
              setTotalRewardPoints(storedPoints ? parseInt(storedPoints, 10) : 0);
          } catch (e) {
              console.error(`Failed to load points for ${currentLoggedInUser} on user change`, e);
              setTotalRewardPoints(0);
          }
      } else {
          setTotalRewardPoints(0);
      }
  }, [currentLoggedInUser]);

  const isAuthenticated = !!currentLoggedInUser;

  const mockLogin = (email, password) => {
    console.log(`Attempting login for: ${email}`);
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentLoggedInUser(user.email);
      console.log(`Login Success: User ${user.email} logged in.`);
      return true;
    }
    console.log(`Login Failed: Invalid credentials for ${email}.`);
    return false;
  };

  const mockRegister = (email, password) => {
    console.log(`Attempting registration for: ${email}`);
    if (mockUsers.some(u => u.email === email)) {
      console.log(`Registration Failed: Email ${email} already exists.`);
      return false;
    }
    setMockUsers(prevUsers => [...prevUsers, { email, password }]);
    setCurrentLoggedInUser(email);
    console.log(`Registration Success: User ${email} registered and logged in.`);
    return true;
  };

  const mockLogout = () => {
      console.log('Logging out user:', currentLoggedInUser);
      setCurrentLoggedInUser(null);
      console.log('User logged out.');
  };

  const requestNotificationPermission = async () => {
      if (!('Notification' in window)) {
          console.warn('This browser does not support notifications.');
          return false;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
          console.log('Notification permission granted.');
          return true;
      } else {
          console.warn('Notification permission denied.');
          return false;
      }
  };

  const sendLocalReminder = (title, body, delayMinutes) => {
      if (Notification.permission === 'granted') {
          alert(`REMINDER: ${title}\n${body}`);
          console.log('Local notification sent!');
      } else {
          console.warn('Cannot send local notification: Permission not granted.');
      }
  };

  const handleStartTrackingFromLanding = () => {
    setCurrentPage('signup');
  };

  const handleLoginAttempt = (email, password) => {
    const success = mockLogin(email, password);
    if (success) {
      setCurrentPage('dashboard');
    }
    return success;
  };

  const handleSignupAttempt = (email, password) => {
    const success = mockRegister(email, password);
    if (success) {
      setCurrentPage('dashboard');
    }
    return success;
  };

  const handleLogout = () => {
      mockLogout();
      setCurrentPage('landing');
  };

  const handleNavigateToDashboard = () => {
    if (isAuthenticated) {
        setCurrentPage('dashboard');
    } else {
        setCurrentPage('landing');
    }
  };

  // Handler for opening the Add/Edit Habit Form modal
  const handleOpenHabitForm = (habit = null) => { // Pass null for add, habit object for edit
    setEditingHabit(habit); // Set habit to edit, or null for new habit
    setShowHabitFormModal(true);
  };

  // Handler for saving a habit (add or update) and closing the form
  const handleSaveHabitAndCloseForm = async (habitData) => {
    if (habitData.id) {
      await updateHabit(habitData); // Update existing habit
    } else {
      await addHabit(habitData); // Add new habit
    }
    setShowHabitFormModal(false); // Close the form
    setEditingHabit(null); // Clear editing state
  };

  // Handler for closing the modal without saving
  const handleCloseHabitFormModal = () => {
    setShowHabitFormModal(false);
    setEditingHabit(null); // Clear editing state
  };

  const renderContent = () => {
    if (currentPage === 'dashboard' && !isAuthenticated) {
        setCurrentPage('login');
        return null;
    }

    switch (currentPage) {
      case 'landing':
        return <LandingPage onStartTracking={handleStartTrackingFromLanding} />;
      case 'login':
        return <LoginPage onLogin={handleLoginAttempt} onNavigateToSignup={() => setCurrentPage('signup')} />;
      case 'signup':
        return <SignUpPage onSignup={handleSignupAttempt} onNavigateToLogin={() => setCurrentPage('login')} />;
      case 'dashboard':
        if (loading) {
          return <div className="text-center text-gray-600 p-8">Loading habits...</div>;
        }
        if (error) {
          return <div className="text-center text-red-600 p-8">Error: {error}</div>;
        }

        // --- Filtering Logic ---
        const filteredHabits = habits.filter(habit => {
            const matchesSearch = habit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (habit.description && habit.description.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesLabel = filterLabel === 'All' || 
                                 (filterLabel === 'None' && (!habit.label || habit.label === 'None')) ||
                                 (habit.label && habit.label === filterLabel);

            const matchesType = filterType === 'All' || habit.type === filterType;

            return matchesSearch && matchesLabel && matchesType;
        });

        // --- Sorting Logic ---
        const sortedHabits = [...filteredHabits].sort((a, b) => {
            switch (sortOrder) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'difficulty-asc':
                    const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
                    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                case 'difficulty-desc':
                    const difficultyOrderDesc = { easy: 1, medium: 2, hard: 3 };
                    return difficultyOrderDesc[b.difficulty] - difficultyOrderDesc[a.difficulty];
                default:
                    return 0; // No sort
            }
        });

        return (
          <>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
              Your Habit Dashboard
            </h1>
            {currentLoggedInUser && (
                <p className="text-center text-lg text-gray-600 mb-8">
                    Welcome, {currentLoggedInUser}! <br/>
                    <span className="font-semibold">Total Points:</span> {totalRewardPoints}
                </p>
            )}

            {/* Floating Action Button (FAB) for Add Habit */}
            {isAuthenticated && (
                <button
                    onClick={() => handleOpenHabitForm()} // Call handleOpenHabitForm for new habit
                    className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform transform hover:scale-110 z-50"
                    aria-label="Add new habit"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}

            {/* Add/Edit Habit Form as a modal/overlay */}
            {showHabitFormModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg relative my-8 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={handleCloseHabitFormModal} // Close modal handler
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                            aria-label="Close form"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <AddHabitForm // This component handles both add and edit
                            onSaveHabit={handleSaveHabitAndCloseForm}
                            habitToEdit={editingHabit} // Pass the habit to edit (or null)
                            onClose={handleCloseHabitFormModal} // Pass close handler to the form itself
                            onRequestNotificationPermission={requestNotificationPermission}
                            onSendLocalReminder={sendLocalReminder}
                        />
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-semibold text-gray-800 mb-5 mt-8">Your Habits</h2>

            {/* Search, Filter, Sort Controls */}
            <div className="mb-6 p-4 bg-white border border-gray-200 rounded-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                    type="text"
                    placeholder="Search habits..."
                    className="col-span-full sm:col-span-2 lg:col-span-4 px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div>
                    <label htmlFor="filter-label" className="block text-sm font-medium text-gray-700 mb-1">Filter by Label</label>
                    <select
                        id="filter-label"
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base bg-white"
                        value={filterLabel}
                        onChange={(e) => setFilterLabel(e.target.value)}
                    >
                        {uniqueLabels.map(label => (
                            <option key={label} value={label}>{label === '' ? 'None' : label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
                    <select
                        id="filter-type"
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base bg-white"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        <option value="good">Good Habits</option>
                        <option value="bad">Bad Habits</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                    <select
                        id="sort-order"
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base bg-white"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="difficulty-asc">Difficulty (Low to High)</option>
                        <option value="difficulty-desc">Difficulty (High to Low)</option>
                    </select>
                </div>
            </div>


            {sortedHabits.length === 0 ? (
              <p className="text-center text-gray-500 p-6 border border-dashed border-gray-300 rounded-none bg-gray-50">
                  No habits found matching your criteria.
              </p>
            ) : (
              <div className="grid gap-5">
                {sortedHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onCheckIn={checkInHabit}
                    onDelete={deleteHabit}
                    onCollectReward={collectHabitReward}
                    onEdit={handleOpenHabitForm} // Pass handler to open form in edit mode
                  />
                ))}
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigateToLogin={() => setCurrentPage('login')}
      onNavigateToSignup={() => setCurrentPage('signup')}
      onNavigateToDashboard={handleNavigateToDashboard}
      onLogout={handleLogout}
      isAuthenticated={isAuthenticated}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
