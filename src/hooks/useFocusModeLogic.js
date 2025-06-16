import { useState, useEffect, useRef, useCallback } from 'react';
import useTimer from './useTimer';
import useFullscreenEnforcer from './useFullscreenEnforcer';

const useFocusModeLogic = ({ habits, onCheckIn, onRequestNotificationPermission, onSendLocalReminder, onRewardPointsEarned }) => {
    // Timer durations in seconds
    const [focusDuration, setFocusDuration] = useState(25 * 60); // Default to 25 minutes
    const [breakDuration, setBreakDuration] = useState(5 * 60);  // Default to 5 minutes
    const [longBreakDuration, setLongBreakDuration] = useState(15 * 60); // Default to 15 minutes

    const [sessionType, setSessionType] = useState('focus'); // 'focus' or 'break'
    const [pomodoroCount, setPomodoroCount] = useState(0); // Tracks completed focus sessions
    const [selectedHabitId, setSelectedHabitId] = useState(''); // Habit selected for current focus session

    const [breaksTakenInCurrentFocus, setBreaksTakenInCurrentFocus] = useState(0);
    const [eventHandledForCurrentInterruption, setEventHandledForCurrentInterruption] = useState(false);
    const [remainingFocusTimeBeforeBreak, setRemainingFocusTimeBeforeBreak] = useState(0);

    const [showExitConfirmationModal, setShowExitConfirmationModal] = useState(false);
    const [showFullscreenPromptModal, setShowFullscreenPromptModal] = useState(false);
    const [totalSessionsToComplete, setTotalSessionsToComplete] = useState(1);
    const [showSessionCountInput, setShowSessionCountInput] = useState(true); // Controls the setup form visibility
    const [showContinueSessionPrompt, setShowContinueSessionPrompt] = useState(false);

    const isFocusActiveAndFullScreen = useRef(false); 
    const isConfirmingExit = useRef(false); 

    const { enforceFullscreen, isFullscreenAttemptInProgress } = useFullscreenEnforcer(); // Get the new ref

    // Ref to hold the latest handleSessionEnd function to avoid circular dependencies
    const handleSessionEndRef = useRef();

    const timer = useTimer(
        sessionType === 'focus' ? focusDuration : breakDuration,
        () => handleSessionEndRef.current(),
        showFullscreenPromptModal || showContinueSessionPrompt || showExitConfirmationModal // Pause if any modal is active
    );

    // Handles the completion of a FOCUS session
    const handleFocusSessionCompletion = useCallback(async () => {
        let pointsAwarded = 20 - (breaksTakenInCurrentFocus * 5);
        pointsAwarded = Math.max(0, pointsAwarded);

        onRewardPointsEarned(pointsAwarded);
        setBreaksTakenInCurrentFocus(0);

        let notificationTitle = 'Focus Session Complete!';
        let notificationBody = `Great job! You earned ${pointsAwarded} points for this focus session. Take a break.`;
        
        setPomodoroCount((prevCount) => prevCount + 1);

        if (selectedHabitId) {
            const habitToComplete = habits.find(h => h.id === selectedHabitId);
            if (habitToComplete) {
                const result = await onCheckIn(selectedHabitId);
                if (result.success) {
                    notificationBody += ` (Habit "${habitToComplete.name}" Checked In!)`;
                } else {
                    notificationBody += ` (Failed to check in "${habitToComplete.name}")`;
                }
            }
        }

        const granted = await onRequestNotificationPermission();
        if (granted) {
            onSendLocalReminder(notificationTitle, notificationBody, 0);
        }

        if (pomodoroCount + 1 >= totalSessionsToComplete) {
            timer.pause();
            setShowContinueSessionPrompt(true);
        } else {
            setTimeout(() => {
                setSessionType('break');
                timer.setDuration((pomodoroCount + 1) % 4 === 0 ? longBreakDuration : breakDuration);
                timer.start();
            }, 2000);
        }
    }, [breaksTakenInCurrentFocus, onRewardPointsEarned, selectedHabitId, habits, onCheckIn, onRequestNotificationPermission, onSendLocalReminder, pomodoroCount, longBreakDuration, breakDuration, timer, totalSessionsToComplete]);

    // Handles the completion of a BREAK session
    const handleBreakSessionCompletion = useCallback(async () => {
        const notificationTitle = 'Break Over!';
        const notificationBody = `Time to get back to focus. Ready for session ${pomodoroCount + 1}?`;

        const granted = await onRequestNotificationPermission();
        if (granted) {
            onSendLocalReminder(notificationTitle, notificationBody, 0);
        }

        setTimeout(() => {
            timer.pause();
            setSessionType('focus');
            timer.setDuration(remainingFocusTimeBeforeBreak > 0 ? remainingFocusTimeBeforeBreak : focusDuration); 
            setRemainingFocusTimeBeforeBreak(0);
            
            if (!document.fullscreenElement) {
                setShowFullscreenPromptModal(true);
            } else {
                timer.start();
            }
        }, 2000);
    }, [pomodoroCount, remainingFocusTimeBeforeBreak, focusDuration, onRequestNotificationPermission, onSendLocalReminder, timer]);

    // Main session end dispatcher
    const handleSessionEnd = useCallback(async () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
        }
        isFocusActiveAndFullScreen.current = false;
        setEventHandledForCurrentInterruption(false);

        if (sessionType === 'focus') {
            await handleFocusSessionCompletion();
        } else { // sessionType === 'break'
            await handleBreakSessionCompletion();
        }
    }, [sessionType, handleFocusSessionCompletion, handleBreakSessionCompletion]);

    // Update the ref whenever handleSessionEnd changes
    useEffect(() => {
        handleSessionEndRef.current = handleSessionEnd;
    }, [handleSessionEnd]);


    const resetTimer = useCallback(() => {
        timer.reset(focusDuration);
        setSessionType('focus');
        setPomodoroCount(0);
        setSelectedHabitId('');
        setBreaksTakenInCurrentFocus(0);
        setEventHandledForCurrentInterruption(false); 
        setRemainingFocusTimeBeforeBreak(0); 
        
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error("Error exiting fullscreen on reset:", err));
        }
        isFocusActiveAndFullScreen.current = false;
        setShowExitConfirmationModal(false);
        isConfirmingExit.current = false;
        setShowFullscreenPromptModal(false);
        setShowSessionCountInput(true); // Return to setup screen on full reset
        setShowContinueSessionPrompt(false);
    }, [focusDuration, timer]);

    const handleConfirmExit = useCallback(() => {
        onRewardPointsEarned(-20);
        onSendLocalReminder(
            "Focus Violation!", 
            "20 points deducted for leaving fullscreen during focus mode!", 
            0
        );
        setBreaksTakenInCurrentFocus(prev => prev + 1);
        setEventHandledForCurrentInterruption(true);
        setShowExitConfirmationModal(false);
        isConfirmingExit.current = false;
        resetTimer(); 
    }, [onRewardPointsEarned, onSendLocalReminder, resetTimer]);


    const handleCancelExit = useCallback(async () => {
        setShowExitConfirmationModal(false);
        isConfirmingExit.current = false;
        setEventHandledForCurrentInterruption(false);
        
        // Proactively set fullscreen expectation before requesting fullscreen
        isFocusActiveAndFullScreen.current = true; 
        const success = await enforceFullscreen(); // Call the wrapped enforceFullscreen
        if (!success) { // If fullscreen fails, reset expectation as it won't be active
            isFocusActiveAndFullScreen.current = false;
            onSendLocalReminder("Fullscreen Reminder", "Click 'Go FullScreen' to re-enter fullscreen for focus mode.", 0);
        }
        timer.start(); // Resume timer
    }, [enforceFullscreen, onSendLocalReminder, timer]);


    const handlePromptGoFullscreen = useCallback(async () => {
        setShowFullscreenPromptModal(false);
        // Proactively set fullscreen expectation before requesting fullscreen
        isFocusActiveAndFullScreen.current = true; 
        const success = await enforceFullscreen(); // Call the wrapped enforceFullscreen
        if (!success) { // If fullscreen fails, reset expectation as it won't be active
            isFocusActiveAndFullScreen.current = false;
            onSendLocalReminder("Fullscreen Reminder", "Failed to enter fullscreen automatically. Please click 'Go FullScreen' manually if you wish to enforce focus.", 0);
        }
        timer.start(); // Resume timer regardless of fullscreen success for immediate user feedback
    }, [enforceFullscreen, onSendLocalReminder, timer]);

    const handlePromptContinueWithoutFullscreen = useCallback(() => {
        setShowFullscreenPromptModal(false);
        onRewardPointsEarned(-20);
        onSendLocalReminder(
            "Focus Interruption!", 
            "20 points deducted for continuing focus mode outside of fullscreen. Stay focused!", 
            0
        );
        setBreaksTakenInCurrentFocus(prev => prev + 1);
        timer.start();
    }, [onRewardPointsEarned, onSendLocalReminder]);

    // Combined useEffect for fullscreen and visibility changes
    useEffect(() => {
        const handleFullscreenOrVisibilityChange = () => {
            const isHidden = document.visibilityState === 'hidden';
            const fullscreenExited = !document.fullscreenElement && isFocusActiveAndFullScreen.current && sessionType === 'focus';

            // If we are currently attempting fullscreen via enforceFullscreen, ignore this event
            if (isFullscreenAttemptInProgress.current) {
                return;
            }

            // Logic for manual fullscreen exit during active focus session
            // Ensure we are in a focus session, timer is running, and it's not already handled or confirming
            if (fullscreenExited && timer.isRunning && !eventHandledForCurrentInterruption && !isConfirmingExit.current && !showFullscreenPromptModal && !showContinueSessionPrompt) {
                timer.pause();
                setShowExitConfirmationModal(true);
                isConfirmingExit.current = true;
            } 
            // Logic for tab switching/page hidden during active focus session, or when fullscreen prompt is showing
            else if (isHidden && (
                (sessionType === 'focus' && timer.isRunning && !showFullscreenPromptModal && !showContinueSessionPrompt) ||
                showExitConfirmationModal || 
                isConfirmingExit.current ||
                showFullscreenPromptModal // Deduct points if tab is switched while fullscreen prompt is active
            )) {
                onRewardPointsEarned(-20); 
                onSendLocalReminder(
                    "Focus Violation!", 
                    "20 points deducted for leaving focus mode (tab switched/hidden). Session reset.", 
                    0
                );
                setBreaksTakenInCurrentFocus(prev => prev + 1);
                resetTimer(); 
            }

            // Update fullscreen expectation based on current state and session type/running status
            if (document.fullscreenElement && sessionType === 'focus' && timer.isRunning && !isConfirmingExit.current && !showFullscreenPromptModal && !showContinueSessionPrompt) {
                isFocusActiveAndFullScreen.current = true;
                setEventHandledForCurrentInterruption(false); // Reset for potential future exits
            } 
            else if (!document.fullscreenElement && !timer.isRunning && isFocusActiveAndFullScreen.current) {
                // If fullscreen is exited AND timer is not running, and we still think it's active, reset it.
                isFocusActiveAndFullScreen.current = false;
            }

            // Ensure fullscreen is exited if session type is not focus or timer is not running
            if ((sessionType !== 'focus' || !timer.isRunning) && document.fullscreenElement && !isConfirmingExit.current && !showFullscreenPromptModal && !showContinueSessionPrompt) {
                document.exitFullscreen().catch(err => console.error("Error exiting fullscreen (cleanup):", err));
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenOrVisibilityChange);
        document.addEventListener('visibilitychange', handleFullscreenOrVisibilityChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenOrVisibilityChange);
            document.removeEventListener('visibilitychange', handleFullscreenOrVisibilityChange);
        };
    }, [
        sessionType, timer.isRunning, eventHandledForCurrentInterruption, 
        showFullscreenPromptModal, showContinueSessionPrompt, showExitConfirmationModal,
        onRewardPointsEarned, onSendLocalReminder, setBreaksTakenInCurrentFocus, resetTimer, timer,
        isFullscreenAttemptInProgress.current
    ]);

    const changeSession = useCallback((type) => {
        timer.pause();
        
        if (sessionType === 'focus' && (type === 'shortBreak' || type === 'longBreak') && !eventHandledForCurrentInterruption) {
            setBreaksTakenInCurrentFocus(prev => prev + 1);
            setRemainingFocusTimeBeforeBreak(timer.timeLeft);
            onSendLocalReminder("Focus Mode Alert!", "You manually started a break. This counts as an interruption!", 0);
            setEventHandledForCurrentInterruption(true);
        }
        
        if (type === 'focus') {
            setSessionType('focus');
            timer.setDuration(remainingFocusTimeBeforeBreak > 0 ? remainingFocusTimeBeforeBreak : focusDuration);
            setBreaksTakenInCurrentFocus(0);
            setEventHandledForCurrentInterruption(false);
            setRemainingFocusTimeBeforeBreak(0);
            // DO NOT auto-start here, user will click "Start Focus Session" from the setup form
            // or the "Start" button on the timer display
        } else {
            setSessionType('break');
            timer.setDuration(type === 'shortBreak' ? breakDuration : longBreakDuration);
            timer.start();
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
            }
            isFocusActiveAndFullScreen.current = false;
        }
        setSelectedHabitId('');
    }, [sessionType, eventHandledForCurrentInterruption, timer.timeLeft, onSendLocalReminder, remainingFocusTimeBeforeBreak, focusDuration, breakDuration, longBreakDuration, timer]);

    const handleFocusDurationChange = useCallback((e) => {
        const minutes = parseInt(e.target.value, 10);
        const newDuration = Math.max(1, minutes) * 60;
        setFocusDuration(newDuration);
        // Only update timer's duration if it's the current session type and not running
        if (sessionType === 'focus' && !timer.isRunning) {
            timer.setDuration(newDuration);
        }
    }, [sessionType, timer]); 

    const handleBreakDurationChange = useCallback((e) => {
        const minutes = parseInt(e.target.value, 10);
        const newDuration = Math.max(1, minutes) * 60;
        setBreakDuration(newDuration);
        // Only update timer's duration if it's the current session type (break) and not running
        if (sessionType !== 'focus' && !timer.isRunning) {
            timer.setDuration(newDuration);
        }
    }, [sessionType, timer]); 

    const handleLongBreakDurationChange = useCallback((e) => {
        const minutes = parseInt(e.target.value, 10);
        const newDuration = Math.max(1, minutes) * 60;
        setLongBreakDuration(newDuration);
        // Only update timer's duration if it's a break session and not running
        if (sessionType !== 'focus' && !timer.isRunning) {
            timer.setDuration(newDuration);
        }
    }, [sessionType, timer]); 

    const handleTotalSessionsChange = useCallback((e) => {
        setTotalSessionsToComplete(Math.max(1, parseInt(e.target.value, 10) || 1));
    }, []);

    // MODIFIED: This now starts the timer and switches to the main timer view
    const handleInitialStart = useCallback(async () => {
        if (totalSessionsToComplete < 1) {
            onSendLocalReminder("Invalid Input", "Please enter at least 1 session.", 0);
            return;
        }
        setShowSessionCountInput(false); // Switch to main timer view
        setPomodoroCount(0); // Reset pomodoro count for new session block
        setSessionType('focus'); // Ensure it starts with focus session
        timer.setDuration(focusDuration); // Set initial duration for the first focus session
        
        // Immediately start the timer and handle fullscreen as this is the "Start Focus Session" button
        if (sessionType === 'focus' && !document.fullscreenElement) {
            isFocusActiveAndFullScreen.current = true;
            const success = await enforceFullscreen();
            if (!success) {
                isFocusActiveAndFullScreen.current = false;
                onSendLocalReminder("Fullscreen Request Failed", "Please click 'Go FullScreen' manually to enforce focus mode.", 0);
            }
        }
        timer.start(); // Start the timer
    }, [totalSessionsToComplete, onSendLocalReminder, focusDuration, timer, sessionType, enforceFullscreen]);


    const handleContinueSession = useCallback(() => {
        setTotalSessionsToComplete(prev => prev + 1);
        setShowContinueSessionPrompt(false);
        setTimeout(() => {
            setSessionType('break');
            timer.setDuration((pomodoroCount + 1) % 4 === 0 ? longBreakDuration : breakDuration);
            timer.start();
        }, 500);
    }, [timer, pomodoroCount, breakDuration, longBreakDuration]);

    const handleFinishSessions = useCallback(() => {
        setShowContinueSessionPrompt(false);
        resetTimer();
    }, [resetTimer]);

    // Memoized selection of a motivational message
    const motivationalMessages = {
        'focus': ["Deep work fuels great achievements.", "Stay sharp, stay focused.", "Every minute counts. Make it count for you.", "Distraction is the enemy of progress.", "You've got this!"],
        'break': ["Breathe. Recharge. Reset.", "A quick pause makes you stronger.", "Stretch it out, you earned it.", "Ready for the next sprint?", "Enjoy your well-deserved rest.", "Relax, reflect, re-energize.", "You're building momentum!"]
    };
    const currentMotivationalMessage = useCallback(() => {
        const messages = motivationalMessages[sessionType];
        return messages[Math.floor(Math.random() * messages.length)];
    }, [sessionType, pomodoroCount, breaksTakenInCurrentFocus]); // Depend on relevant states for re-selection

    return {
        // State
        timeLeft: timer.timeLeft,
        isRunning: timer.isRunning,
        sessionType,
        pomodoroCount,
        selectedHabitId,
        focusDuration,
        breakDuration,
        longBreakDuration,
        totalSessionsToComplete,
        showSessionCountInput,
        showExitConfirmationModal,
        showFullscreenPromptModal,
        showContinueSessionPrompt,
        
        // Functions
        startTimer: timer.start, // Reverted to raw timer.start as handleInitialStart is the new trigger
        // pauseTimer: timer.pause, // Still not exposed for the UI, as requested
        resetTimer,
        setSelectedHabitId,
        handleFocusDurationChange,
        handleBreakDurationChange,
        handleLongBreakDurationChange,
        handleTotalSessionsChange,
        handleInitialStart, // This is now the primary "Start" for the setup phase
        handleConfirmExit,
        handleCancelExit,
        handlePromptGoFullscreen,
        handlePromptContinueWithoutFullscreen,
        handleContinueSession,
        handleFinishSessions,
        changeSession,
        currentMotivationalMessage,
    };
};

export default useFocusModeLogic;
