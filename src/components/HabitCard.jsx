import React, { useMemo, useState, useEffect } from 'react';
import { getTodayDateString, calculateStreak } from '../utils/dateUtils';
import ChartComponent from './ChartComponent';
import Confetti from './Confetti'; // Import the new Confetti component

const DAYS_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HabitCard = ({ habit, onCheckIn, onDelete, onCollectReward, onEdit, onUndoCheckIn }) => { 
    const today = getTodayDateString();
    
    // Find today's check-in to determine status and reward collection status
    const todayCheckin = habit.checkins?.find(c => c.date === today); 
    const currentDailyCompletions = todayCheckin ? (todayCheckin.dailyCompletionCount || 0) : 0;
    
    // A habit is considered "fully completed" for the day if dailyCompletionCount reaches timesPerDay
    const isHabitFullyCompletedToday = currentDailyCompletions >= habit.timesPerDay;
    const isRewardCollectedToday = todayCheckin ? todayCheckin.rewardCollected : false;

    const { currentStreak, longestStreak } = useMemo(() =>
        calculateStreak(habit.checkins || []),
        [habit.checkins]
    );

    // UI Feedback States
    const [isGlowActive, setIsGlowActive] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);


    const formatPeriodDisplay = (period) => {
        if (!period || !period.type) return 'N/A';

        switch (period.type) {
            case 'daily':
                if (period.config?.selectedDaysOfWeek && period.config.selectedDaysOfWeek.length > 0) {
                    if (period.config.selectedDaysOfWeek.length === 7) return 'Everyday';
                    const sortedDays = [...period.config.selectedDaysOfWeek].sort((a, b) => a - b);
                    return `Every ${sortedDays.map(dayIndex => DAYS_OF_WEEK_SHORT[dayIndex]).join(', ')}`;
                }
                return 'Daily (unspecified days)';
            case 'monthly':
                if (period.config?.selectedDaysOfMonth && period.config.selectedDaysOfMonth.length > 0) {
                    const sortedDays = [...period.config.selectedDaysOfMonth].sort((a, b) => a - b);
                    const suffixes = ['st', 'nd', 'rd', 'th'];
                    return `On ${sortedDays.map(day => {
                        const s = day % 100;
                        return day + (suffixes[(s - 20) % 10] || suffixes[s] || suffixes[0]);
                    }).join(', ')} of month`;
                }
                return 'Monthly (unspecified days)';
            case 'interval':
                return `Every ${period.config?.intervalDays || 1} day(s)`;
            default:
                return 'Custom';
        }
    };

    // Determine card styling based on habit type with improved aesthetics
    const cardBaseClasses = "border rounded-xl p-6 flex flex-col transition-all duration-300 hover:shadow-lg";
    const typeSpecificClasses = habit.type === 'good' 
        ? "bg-gradient-to-br from-green-50 to-green-100 border-green-300" // More vibrant green gradient for good habits
        : "bg-gradient-to-br from-red-50 to-red-100 border-red-300";   // More vibrant red gradient for bad habits

    // Get difficulty display classes
    const difficultyClasses = {
        'easy': 'bg-blue-100 text-blue-800',
        'medium': 'bg-yellow-100 text-yellow-800',
        'hard': 'bg-red-100 text-red-800',
    };

    const handleCheckInClick = async () => {
        const result = await onCheckIn(habit.id);
        if (result.success) {
            setIsGlowActive(true);
            setTimeout(() => setIsGlowActive(false), 500); // Glow for 0.5 seconds
        }
    };

    const handleCollectRewardClick = async () => {
        console.log(`[HabitCard] Collecting reward for habit ID: ${habit.id}, Date: ${today}`);
        console.log(`[HabitCard] Habit Reward Points: ${habit.rewardPoints}`);
        console.log(`[HabitCard] Today Check-in:`, todayCheckin);
        console.log(`[HabitCard] Is Habit Fully Completed Today: ${isHabitFullyCompletedToday}`);
        console.log(`[HabitCard] Is Reward Collected Today: ${isRewardCollectedToday}`);
        
        const result = await onCollectReward(habit.id, today);
        if (result.success) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2000); // Confetti for 2 seconds
            console.log(`[HabitCard] Reward collected successfully. Points earned: ${result.pointsEarned}`);
        } else {
            console.warn(`[HabitCard] Failed to collect reward: ${result.message}`);
        }
    };

    const handleUndoClick = async () => {
        console.log(`[HabitCard] Attempting to undo check-in for habit ID: ${habit.id}`);
        const result = await onUndoCheckIn(habit.id);
        if (result.success) {
            console.log("[HabitCard] Check-in undone successfully!");
        } else {
            console.warn("[HabitCard] Failed to undo check-in:", result.message);
        }
    };


    return (
        <div className={`${cardBaseClasses} ${typeSpecificClasses} ${isGlowActive ? 'shadow-lg shadow-blue-500/50 ring-2 ring-blue-500' : ''} relative`}>
            {showConfetti && <Confetti active={showConfetti} />} {/* Confetti component */}
            <div className="flex justify-between items-start mb-5">
                <div>
                    <h3 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">{habit.name}</h3>
                    {habit.description && (
                        <p className="text-gray-700 text-base mb-2">{habit.description}</p>
                    )}
                    {/* Display the habit label as a pill */}
                    {habit.label && habit.label !== 'None' && (
                        <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 shadow-sm">
                            {habit.label}
                        </span>
                    )}

                    {/* New section for detailed attributes - using flex for alignment */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 text-sm mt-2">
                        {habit.timesPerDay && habit.timesPerDay > 0 && (
                            <div className="flex items-center">
                                <span className="font-semibold text-gray-700 mr-1">🎯 Times/Day:</span> {habit.timesPerDay}
                            </div>
                        )}
                        {habit.difficulty && (
                            <div className="flex items-center">
                                <span className="font-semibold text-gray-700 mr-1">🧠 Difficulty:</span> 
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyClasses[habit.difficulty]}`}>
                                    {habit.difficulty.charAt(0).toUpperCase() + habit.difficulty.slice(1)}
                                </span>
                            </div>
                        )}
                        {habit.timeTaken > 0 && (
                            <div className="flex items-center">
                                <span className="font-semibold text-gray-700 mr-1">⏳ Time:</span> {habit.timeTaken} min
                            </div>
                        )}
                        {habit.type && (
                            <div className="flex items-center">
                                <span className="font-semibold text-gray-700 mr-1">🌱 Type:</span> 
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${habit.type === 'good' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                    {habit.type === 'good' ? 'Good' : 'Bad'}
                                </span>
                            </div>
                        )}
                        {habit.rewardPoints > 0 && ( // Display reward points for the habit
                            <div className="flex items-center">
                                <span className="font-semibold text-gray-700 mr-1">⭐ Reward:</span> {habit.rewardPoints} Pts
                            </div>
                        )}
                        {habit.period && (
                            <div className="flex items-center">
                                <span className="font-semibold text-gray-700 mr-1">📅 Repeat:</span> {formatPeriodDisplay(habit.period)}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex space-x-2"> {/* Container for edit and delete buttons */}
                    <button
                        onClick={() => onEdit(habit)} // Pass the whole habit object for editing
                        className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
                        aria-label="Edit habit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(habit.id)}
                        className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                        aria-label="Delete habit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div> {/* This is the closing div for the first flex container */}

            <div className="flex items-center space-x-8 mb-6 justify-center bg-white bg-opacity-80 rounded-lg p-4 shadow-inner border border-gray-100">
                <div className="text-center">
                    <span className="text-6xl font-extrabold text-blue-700 leading-none">{currentStreak}</span>
                    <p className="text-sm text-gray-700 mt-1">Current Streak</p>
                </div>
                <div className="text-center">
                    <span className="text-4xl font-bold text-gray-600 leading-none">{longestStreak}</span>
                    <p className="text-sm text-gray-600 mt-1">Longest Streak</p>
                </div>
            </div>

            <div className="mb-6 h-48 w-full"> {/* Ensures chart has a defined height */}
                 <ChartComponent checkins={habit.checkins} />
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-auto"> {/* mt-auto pushes buttons to bottom, responsive flex */}
                <button
                    onClick={handleCheckInClick}
                    // Disable if current completions reached or exceeded required timesPerDay
                    disabled={currentDailyCompletions >= habit.timesPerDay} 
                    className={`flex-1 py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all duration-200
                        ${currentDailyCompletions >= habit.timesPerDay
                            ? 'bg-green-600 cursor-not-allowed opacity-90'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }`}
                >
                    {currentDailyCompletions >= habit.timesPerDay 
                        ? 'Completed Today!' 
                        : `Mark Completed (${currentDailyCompletions}/${habit.timesPerDay})`
                    }
                </button>

                <button
                    onClick={handleCollectRewardClick}
                    // Enabled only if fully completed today AND reward not yet collected
                    disabled={!isHabitFullyCompletedToday || isRewardCollectedToday}
                    className={`flex-1 py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all duration-200
                        ${!isHabitFullyCompletedToday || isRewardCollectedToday
                            ? 'bg-gray-400 cursor-not-allowed opacity-90'
                            : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-1 focus:ring-purple-500'
                        }`}
                >
                    {isRewardCollectedToday ? 'Reward Collected' : `Collect Reward (${habit.rewardPoints || 0} Pts)`}
                </button>
            </div>

            {/* Undo Button */}
            {currentDailyCompletions > 0 && ( // Only show if there's something to undo today
                <div className="mt-4 text-center">
                    <button
                        onClick={handleUndoClick}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold py-2 px-4 rounded-lg border border-red-300 hover:bg-red-50 transition-colors duration-200"
                    >
                        Undo Last Check-in
                    </button>
                </div>
            )}
        </div>
    );
};

export default HabitCard;
