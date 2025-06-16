import React, { useMemo } from 'react';
import useFocusModeLogic from '../hooks/useFocusModeLogic'; // Assuming this path

const FocusMode = ({ habits, onCheckIn, onRequestNotificationPermission, onSendLocalReminder, onRewardPointsEarned }) => {
    const {
        timeLeft,
        isRunning,
        sessionType,
        pomodoroCount,
        selectedHabitId,
        focusDuration,
        breakDuration,
        longBreakDuration,
        totalSessionsToComplete,
        showSessionCountInput, // This now controls the entire setup form visibility
        showExitConfirmationModal,
        showFullscreenPromptModal,
        showContinueSessionPrompt,
        
        startTimer,
        // pauseTimer, // Removed pauseTimer from destructuring for the UI
        resetTimer,
        setSelectedHabitId,
        handleFocusDurationChange,
        handleBreakDurationChange,
        handleLongBreakDurationChange,
        handleTotalSessionsChange,
        handleInitialStart, // This will now start the session and switch views
        handleConfirmExit,
        handleCancelExit,
        handlePromptGoFullscreen,
        handlePromptContinueWithoutFullscreen,
        handleContinueSession,
        handleFinishSessions,
        changeSession,
        currentMotivationalMessage,
    } = useFocusModeLogic({ habits, onCheckIn, onRequestNotificationPermission, onSendLocalReminder, onRewardPointsEarned });

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const motivationalText = useMemo(() => currentMotivationalMessage(), [currentMotivationalMessage]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] p-4 bg-white"> {/* Changed bg-gray-50 to bg-white */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-6">Focus Mode</h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl text-center">
                Maximize your productivity and build healthy habits using the Pomodoro Technique.
            </p>

            {showSessionCountInput ? (
                // FIRST FORM/DIV: "Set Your Focus Goal" with all Settings & Options
                <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center border-2 border-blue-300 relative">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Set Your Focus Goal</h3>
                    <p className="text-gray-700 mb-6">How many consecutive focus sessions do you want to complete?</p>
                    <input
                        type="number"
                        min="1"
                        value={totalSessionsToComplete}
                        onChange={handleTotalSessionsChange}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl font-bold mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* Settings & Options (as per first image) */}
                    <div className="border-t border-gray-200 pt-6 mt-6"> {/* Added mt-6 for spacing */}
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Settings & Options</h3>

                        <div className="mb-4">
                            <label htmlFor="select-habit" className="block text-sm font-medium text-gray-700 mb-1">
                                Link to Habit (Optional - Auto Check-in after Focus Session)
                            </label>
                            <select
                                id="select-habit"
                                value={selectedHabitId}
                                onChange={(e) => setSelectedHabitId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base bg-white"
                                disabled={isRunning} // Still disabled if timer is somehow running
                            >
                                <option value="">-- No Habit Linked --</option>
                                {habits.length > 0 ? (
                                    habits.map((habit) => (
                                        <option key={habit.id} value={habit.id}>
                                            {habit.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No habits available. Add some on Dashboard!</option>
                                )}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label htmlFor="focus-duration" className="block text-sm font-medium text-gray-700 mb-1">Focus (min)</label>
                                <input type="number" id="focus-duration" value={focusDuration / 60} onChange={handleFocusDurationChange} min="1" className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base" disabled={isRunning} />
                            </div>
                            <div>
                                <label htmlFor="break-duration" className="block text-sm font-medium text-gray-700 mb-1">Short Break (min)</label>
                                <input type="number" id="break-duration" value={breakDuration / 60} onChange={handleBreakDurationChange} min="1" className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base" disabled={isRunning} />
                            </div>
                            <div>
                                <label htmlFor="long-break-duration" className="block text-sm font-medium text-gray-700 mb-1">Long Break (min)</label>
                                <input type="number" id="long-break-duration" value={longBreakDuration / 60} onChange={handleLongBreakDurationChange} min="1" className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base" disabled={isRunning} />
                            </div>
                        </div>

                        {/* Removed Focus, Short Break, Long Break buttons here as per request */}
                    </div>

                    <button
                        onClick={handleInitialStart}
                        className="w-full py-3 px-8 rounded-lg text-white font-bold text-lg shadow-md transition-all duration-200 transform hover:scale-105 bg-blue-600 hover:bg-blue-700 mt-8" 
                    >
                        Start Focus Session
                    </button>
                </div>
            ) : (
                // SECOND FORM/DIV: Timer with Settings & Options (as per second image)
                <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center border-2 border-blue-300 relative">
                    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                        {sessionType === 'focus' && `Focus Session #${pomodoroCount + 1} of ${totalSessionsToComplete}`}
                        {sessionType === 'break' && `Break`}
                    </span>

                    <div className="text-7xl font-mono font-bold text-gray-900 mb-6 tracking-wide">
                        {formatTime(timeLeft)}
                    </div>

                    <p className="text-gray-600 text-lg italic mb-6">
                        "{motivationalText}"
                    </p>

                    <div className="flex justify-center space-x-4 mb-8">
                        {/* Start Button logic */}
                        {/* If timer is not running, show Start button */}
                        {!isRunning && (
                            <button
                                onClick={startTimer}
                                className="py-3 px-8 rounded-lg text-white font-bold text-lg shadow-md transition-all duration-200 transform hover:scale-105 bg-blue-600 hover:bg-blue-700"
                            >
                                Start
                            </button>
                        )}
                        {/* If timer is running and in fullscreen, show "In Fullscreen" if focus session */}
                        {isRunning && sessionType === 'focus' && document.fullscreenElement && (
                             <button
                                className="py-3 px-8 rounded-lg text-white font-bold text-lg shadow-md bg-blue-300 cursor-not-allowed"
                                disabled // Always disabled when in fullscreen
                            >
                                In Fullscreen
                            </button>
                        )}
                        
                        <button
                            onClick={resetTimer}
                            className="py-3 px-8 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-lg shadow-md transition-all duration-200 transform hover:scale-105"
                        >
                            Reset
                        </button>
                    </div>

                    {/* Settings & Options (as per second image) */}
                    <div className="border-t border-gray-200 pt-6"> 
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Settings & Options</h3>

                        <div className="mb-4">
                            <label htmlFor="select-habit" className="block text-sm font-medium text-gray-700 mb-1">
                                Link to Habit (Optional - Auto Check-in after Focus Session)
                            </label>
                            <select
                                id="select-habit"
                                value={selectedHabitId}
                                onChange={(e) => setSelectedHabitId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base bg-white"
                                disabled={isRunning} // Still disabled if timer is somehow running
                            >
                                <option value="">-- No Habit Linked --</option>
                                {habits.length > 0 ? (
                                    habits.map((habit) => (
                                        <option key={habit.id} value={habit.id}>
                                            {habit.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No habits available. Add some on Dashboard!</option>
                                )}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label htmlFor="focus-duration" className="block text-sm font-medium text-gray-700 mb-1">Focus (min)</label>
                                <input type="number" id="focus-duration" value={focusDuration / 60} onChange={handleFocusDurationChange} min="1" className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base" disabled={isRunning} />
                            </div>
                            <div>
                                <label htmlFor="break-duration" className="block text-sm font-medium text-gray-700 mb-1">Short Break (min)</label>
                                <input type="number" id="break-duration" value={breakDuration / 60} onChange={handleBreakDurationChange} min="1" className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base" disabled={isRunning} />
                            </div>
                            <div>
                                <label htmlFor="long-break-duration" className="block text-sm font-medium text-gray-700 mb-1">Long Break (min)</label>
                                <input type="number" id="long-break-duration" value={longBreakDuration / 60} onChange={handleLongBreakDurationChange} min="1" className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base" disabled={isRunning} />
                            </div>
                        </div>

                        <div className="flex justify-center space-x-2">
                            {/* Removed Focus button from here */}
                            <button onClick={() => changeSession('shortBreak')} className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${isRunning && sessionType === 'break' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`} disabled={isRunning && (sessionType === 'shortBreak' || sessionType === 'longBreak')}>Short Break</button>
                            <button onClick={() => changeSession('longBreak')} className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${isRunning && sessionType === 'break' ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`} disabled={isRunning && (sessionType === 'shortBreak' || sessionType === 'longBreak')}>Long Break</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exit Confirmation Modal - retains enhanced styling */}
            {showExitConfirmationModal && (
                <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 p-4 font-sans"> {/* Changed bg-gray-800 to bg-white */}
                    <div className="bg-white rounded-xl shadow-2xl text-center max-w-sm w-full transform transition-all duration-300 scale-100 opacity-100 overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gray-100 py-5 px-6 border-b border-gray-200">
                            <h3 className="text-2xl font-bold text-gray-800">Exit Fullscreen?</h3>
                        </div>
                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-gray-700 mb-6 text-base">
                                Exiting fullscreen during a focus session will result in a <span className="font-semibold text-red-600">20-point deduction</span>.
                            </p>
                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={handleConfirmExit}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-md transform hover:scale-105"
                                >
                                    Yes, Exit & Deduct
                                </button>
                                <button
                                    onClick={handleCancelExit}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200 shadow-md transform hover:scale-105"
                                >
                                    No, Stay Fullscreen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Prompt Modal - retains enhanced styling */}
            {showFullscreenPromptModal && (
                <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 p-4 font-sans"> {/* Changed bg-gray-800 to bg-white */}
                    <div className="bg-white rounded-xl shadow-2xl text-center max-w-sm w-full transform transition-all duration-300 scale-100 opacity-100 overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-blue-600 py-5 px-6 text-white">
                            <h3 className="text-2xl font-bold">Resume Focus Mode</h3>
                        </div>
                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-gray-700 mb-6 text-base">
                                To truly focus, it's recommended to enter fullscreen mode.
                            </p>
                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={handlePromptGoFullscreen}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-md transform hover:scale-105"
                                >
                                    Go FullScreen
                                </button>
                                <button
                                    onClick={handlePromptContinueWithoutFullscreen}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-md transform hover:scale-105"
                                >
                                    Continue Without Fullscreen <span className="text-sm font-normal">(20 Pts Deduction)</span>
                                </button>
                            </div>
                            <p className="text-gray-500 text-sm mt-6">
                                Staying in fullscreen helps minimize distractions and ensures proper reward tracking.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Continue Session Prompt Modal - retains enhanced styling */}
            {showContinueSessionPrompt && (
                <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 p-4 font-sans"> {/* Changed bg-gray-800 to bg-white */}
                    <div className="bg-white rounded-xl shadow-2xl text-center max-w-sm w-full transform transition-all duration-300 scale-100 opacity-100 overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-blue-600 py-5 px-6 text-white">
                            <h3 className="text-2xl font-bold">All Sessions Completed!</h3>
                        </div>
                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-gray-700 mb-6 text-base">
                                You've completed all your scheduled focus sessions. Would you like to continue?
                            </p>
                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={handleContinueSession}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-md transform hover:scale-105"
                                >
                                    Continue with More Sessions
                                </button>
                                <button
                                    onClick={handleFinishSessions}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200 shadow-md transform hover:scale-105"
                                >
                                    Finish Sessions & Return Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FocusMode;
