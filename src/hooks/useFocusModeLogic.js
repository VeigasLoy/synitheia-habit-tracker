import { useState, useEffect, useRef, useCallback } from 'react';
import useTimer from './useTimer';
import useFullscreenEnforcer from './useFullscreenEnforcer';

const motivationalMessages = { // Moved outside the hook as it's a constant
    'focus': [
        "Deep work fuels great achievements.",
        "Stay sharp, stay focused.",
        "Every minute counts. Make it count for you.",
        "Distraction is the enemy of progress.",
        "You've got this!"
    ],
    'shortBreak': [
        "Breathe. Recharge. Reset.",
        "A quick pause makes you stronger.",
        "Stretch it out, you earned it.",
        "Ready for the next sprint?"
    ],
    'longBreak': [
        "Enjoy your well-deserved rest.",
        "Relax, reflect, re-energize.",
        "You're building momentum!"
    ]
};

const useFocusModeLogic = ({ habits, onCheckIn, onRequestNotificationPermission, onSendLocalReminder, onRewardPointsEarned }) => {
    // Timer durations in seconds
    const [focusDuration, setFocusDuration] = useState(25 * 60); // Default to 25 minutes
    const [breakDuration, setBreakDuration] = useState(5 * 60);  // Default to 5 minutes
    const [longBreakDuration, setLongBreakDuration] = useState(15 * 60); // Default to 15 minutes

    const [sessionType, setSessionType] = useState('focus'); // 'focus', 'shortBreak', or 'longBreak'
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
    // NEW: State to manage the cooldown after a break when user is not present
    const [isBreakCooldownActive, setIsBreakCooldownActive] = useState(false);


    const isFocusActiveAndFullScreen = useRef(false); 
    const isConfirmingExit = useRef(false); 

    const { enforceFullscreen, isFullscreenAttemptInProgress } = useFullscreenEnforcer();

    // Ref to hold the latest handleSessionEnd function to avoid circular dependencies
    const handleSessionEndRef = useRef();

    // NEW: Ref for timeouts related to break end cooldown or modal interaction
    const modalInteractionTimeoutRef = useRef(null);

    // NEW: Refs to get latest state values inside setTimeout closures
    const showFullscreenPromptModalRef = useRef(showFullscreenPromptModal);
    const isBreakCooldownActiveRef = useRef(isBreakCooldownActive);

    // Update refs whenever state changes
    useEffect(() => {
        showFullscreenPromptModalRef.current = showFullscreenPromptModal;
    }, [showFullscreenPromptModal]);

    useEffect(() => {
        isBreakCooldownActiveRef.current = isBreakCooldownActive;
    }, [isBreakCooldownActive]);


    const timer = useTimer(
        // Determine duration based on the specific sessionType
        sessionType === 'focus' ? focusDuration : 
        (sessionType === 'shortBreak' ? breakDuration : longBreakDuration), 
        () => handleSessionEndRef.current(),
        // Pause if any modal is active OR if break cooldown is active
        showFullscreenPromptModal || showContinueSessionPrompt || showExitConfirmationModal || isBreakCooldownActive 
    );

    // Moved resetTimer here so it's defined before other functions use it
    const resetTimer = useCallback(() => {
        timer.reset(focusDuration);
        setSessionType('focus');
        setPomodoroCount(0);
        setSelectedHabitId('');
        setBreaksTakenInCurrentFocus(0);
        setEventHandledForCurrentInterruption(false); 
        setRemainingFocusTimeBeforeBreak(0); 
        setIsBreakCooldownActive(false); // Ensure cooldown is reset

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error("Error exiting fullscreen on reset:", err));
        }
        isFocusActiveAndFullScreen.current = false;
        setShowExitConfirmationModal(false);
        isConfirmingExit.current = false;
        setShowFullscreenPromptModal(false);
        setShowSessionCountInput(true); // Return to setup screen on full reset
        setShowContinueSessionPrompt(false);
        
        // Clear any pending modal interaction/cooldown timeouts
        if (modalInteractionTimeoutRef.current) {
            clearTimeout(modalInteractionTimeoutRef.current);
            modalInteractionTimeoutRef.current = null;
        }
    }, [focusDuration, timer]);

    // Ref for the break end notification timeout (different from modalInteractionTimeoutRef)
    const breakEndNotificationTimeoutRef = useRef(null); 

    // Cleanup notification timeout on unmount
    useEffect(() => {
        return () => {
            if (breakEndNotificationTimeoutRef.current) {
                clearTimeout(breakEndNotificationTimeoutRef.current);
            }
        };
    }, []);

    // Effect to handle break end notifications (e.g., 10 seconds before break ends)
    useEffect(() => {
        // Clear any existing notification timeout if session type changes or timer stops
        if (breakEndNotificationTimeoutRef.current) {
            clearTimeout(breakEndNotificationTimeoutRef.current);
            breakEndNotificationTimeoutRef.current = null;
        }

        const NOTIFICATION_BEFORE_END_SECONDS = 10;

        // Check if we are in a break session and timer is running
        if (timer.isRunning && (sessionType === 'shortBreak' || sessionType === 'longBreak')) {
            // Schedule the notification only if timeLeft is greater than the notification threshold
            if (timer.timeLeft > NOTIFICATION_BEFORE_END_SECONDS) {
                const timeToScheduleNotification = (timer.timeLeft - NOTIFICATION_BEFORE_END_SECONDS) * 1000;
                const currentBreakType = sessionType;
                const notificationSecondsRemaining = NOTIFICATION_BEFORE_END_SECONDS;

                breakEndNotificationTimeoutRef.current = setTimeout(async () => {
                    const notificationTitle = `${currentBreakType === 'shortBreak' ? 'Short' : 'Long'} Break Ending Soon!`;
                    const notificationBody = `You have ${notificationSecondsRemaining} seconds left. Get ready to focus!`;
                    
                    const granted = await onRequestNotificationPermission();
                    if (granted) {
                        onSendLocalReminder(notificationTitle, notificationBody, 0); // Send immediately
                    } else {
                        console.warn("Notification permission not granted for break end reminder.");
                    }
                }, timeToScheduleNotification);
            }
        }
    }, [timer.timeLeft, timer.isRunning, sessionType, onRequestNotificationPermission, onSendLocalReminder]); // Dependencies


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
            // Start the next break after a short delay
            setTimeout(() => {
                const nextSessionType = (pomodoroCount + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
                setSessionType(nextSessionType); // Set specific break type
                timer.setDuration(nextSessionType === 'longBreak' ? longBreakDuration : breakDuration);
                timer.start();
            }, 2000);
        }
    }, [breaksTakenInCurrentFocus, onRewardPointsEarned, selectedHabitId, habits, onCheckIn, onRequestNotificationPermission, onSendLocalReminder, pomodoroCount, longBreakDuration, breakDuration, timer, totalSessionsToComplete]);

    // Handles the completion of a BREAK session
    const handleBreakSessionCompletion = useCallback(async () => {
        const notificationTitle = 'Break Over!';
        // Request permission here for immediacy if not already granted
        const granted = await onRequestNotificationPermission(); 

        timer.pause(); // Always pause the timer when break ends
        
        setSessionType('focus');
        timer.setDuration(remainingFocusTimeBeforeBreak > 0 ? remainingFocusTimeBeforeBreak : focusDuration);
        setRemainingFocusTimeBeforeBreak(0); // Reset stored time

        // Clear any pre-existing modal interaction timeout, just in case
        if (modalInteractionTimeoutRef.current) {
            clearTimeout(modalInteractionTimeoutRef.current);
            modalInteractionTimeoutRef.current = null;
        }
        setIsBreakCooldownActive(false); // Ensure this is false initially for either path


        // Check user's visibility state at the exact moment the break ends
        if (document.visibilityState === 'hidden') {
            // User is NOT on the tab. Start a cooldown for them to return.
            setIsBreakCooldownActive(true); // Activate the cooldown state
            if (granted) {
                onSendLocalReminder(notificationTitle, "You have 10 seconds to return to the Synitheia tab or you will be penalized!", 0);
            }

            // Set a 10-second timeout for the user to return to the tab
            modalInteractionTimeoutRef.current = setTimeout(() => {
                // Check visibility again after cooldown. If still hidden AND cooldown is active, penalize.
                if (document.visibilityState === 'hidden' && isBreakCooldownActiveRef.current) {
                    onRewardPointsEarned(-20);
                    if (granted) {
                        onSendLocalReminder("Focus Violation!", "20 points deducted for not returning to the Synitheia tab after break cooldown!", 0);
                    }
                    resetTimer(); // Penalize and reset the session
                }
                modalInteractionTimeoutRef.current = null; 
            }, 10 * 1000); // 10 seconds for user to return
        } else {
            // User IS on the tab. Immediately show the "Resume Focus" modal.
            setShowFullscreenPromptModal(true); // This will pause the timer via useTimer's shouldPause
            if (granted) {
                onSendLocalReminder(notificationTitle, "Time to get back to focus. Please choose to resume.", 0);
            }

            // Set a 10-second timeout for the user to interact with the modal
            modalInteractionTimeoutRef.current = setTimeout(async () => { // Made async to await notification permission
                // If the modal is still showing and the tab is visible (meaning no interaction), penalize.
                if (showFullscreenPromptModalRef.current && document.visibilityState === 'visible') {
                    // *** PENALTY REMOVED HERE ***
                    // Per user's request: No penalty for *just* not choosing when modal is up and user is visible.
                    // The modal will persist.
                    // However, if the user leaves the tab after the modal pops up, the visibilitychange listener will penalize.
                }
                modalInteractionTimeoutRef.current = null; // Clear timeout ID
            }, 10 * 1000); // 10 seconds for modal interaction (no penalty here for not choosing)
        }
    }, [pomodoroCount, remainingFocusTimeBeforeBreak, focusDuration, onRequestNotificationPermission, onSendLocalReminder, timer, onRewardPointsEarned, resetTimer]);


    // Main session end dispatcher
    const handleSessionEnd = useCallback(async () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
        }
        isFocusActiveAndFullScreen.current = false;
        setEventHandledForCurrentInterruption(false);

        if (sessionType === 'focus') {
            await handleFocusSessionCompletion();
        } else { // sessionType is 'shortBreak' or 'longBreak'
            await handleBreakSessionCompletion();
        }
    }, [sessionType, handleFocusSessionCompletion, handleBreakSessionCompletion]);

    // Update the ref whenever handleSessionEnd changes
    useEffect(() => {
        handleSessionEndRef.current = handleSessionEnd;
    }, [handleSessionEnd]);


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
            onSendLocalReminder("Fullscreen Reminder", "Click 'Go FullScreen' to re-enter fullscreen for focus mode.", 0);
        }
        timer.start(); // Resume timer
    }, [enforceFullscreen, onSendLocalReminder, timer]);


    const handlePromptGoFullscreen = useCallback(async () => {
        setShowFullscreenPromptModal(false); // Hide modal as user is taking action
        // Clear any pending modal interaction/cooldown timeouts
        if (modalInteractionTimeoutRef.current) {
            clearTimeout(modalInteractionTimeoutRef.current);
            modalInteractionTimeoutRef.current = null;
        }
        setIsBreakCooldownActive(false); // Ensure cooldown is off if user was returning during it

        isFocusActiveAndFullScreen.current = true; // Proactively set expectation
        const success = await enforceFullscreen(); 
        if (!success) { 
            onSendLocalReminder("Fullscreen Request Failed", "Please click 'Go FullScreen' manually if you wish to enforce focus.", 0);
        }
        timer.start(); // Start the timer
    }, [enforceFullscreen, onSendLocalReminder, timer]);

    const handlePromptContinueWithoutFullscreen = useCallback(() => {
        setShowFullscreenPromptModal(false); // Hide modal as user is taking action
        // Clear any pending modal interaction/cooldown timeouts
        if (modalInteractionTimeoutRef.current) {
            clearTimeout(modalInteractionTimeoutRef.current);
            modalInteractionTimeoutRef.current = null;
        }
        setIsBreakCooldownActive(false); // Ensure cooldown is off if user was returning during it

        onRewardPointsEarned(-20); 
        onSendLocalReminder(
            "Focus Interruption!", 
            "20 points deducted for continuing focus mode outside of fullscreen. Stay focused!", 
            0
        );
        setBreaksTakenInCurrentFocus(prev => prev + 1);
        timer.start(); // Start the timer
    }, [onRewardPointsEarned, onSendLocalReminder, timer]);

    // Combined useEffect for fullscreen and visibility changes
    useEffect(() => {
        const handleFullscreenOrVisibilityChange = async () => { // Made async to await notification permission
            const isHidden = document.visibilityState === 'hidden';
            const isVisible = document.visibilityState === 'visible';
            const fullscreenExited = !document.fullscreenElement && isFocusActiveAndFullScreen.current && sessionType === 'focus';

            // If we are currently attempting fullscreen via enforceFullscreen, ignore this event
            if (isFullscreenAttemptInProgress.current) {
                return;
            }

            // Logic for manual fullscreen exit during active focus session
            if (fullscreenExited && timer.isRunning && !eventHandledForCurrentInterruption && !isConfirmingExit.current && !showFullscreenPromptModalRef.current && !showContinueSessionPrompt) {
                timer.pause();
                setShowExitConfirmationModal(true);
                isConfirmingExit.current = true;
            } 
            // Logic for tab switching/page hidden during active focus session, or when a modal/cooldown is active
            else if (isHidden && (
                (sessionType === 'focus' && timer.isRunning && !showFullscreenPromptModalRef.current && !showContinueSessionPrompt) ||
                showExitConfirmationModal || 
                isConfirmingExit.current ||
                showContinueSessionPrompt || // If hidden during "Continue Session" prompt
                // Penalty for switching tab *while* showFullscreenPromptModal is active and user was present (not in cooldown)
                (showFullscreenPromptModalRef.current && !isBreakCooldownActiveRef.current) || 
                isBreakCooldownActiveRef.current // If in break cooldown (user was initially hidden) and tab remains hidden
            )) {
                onRewardPointsEarned(-20); 
                const granted = await onRequestNotificationPermission(); // Request permission within the async callback
                if (granted) {
                    onSendLocalReminder(
                        "Focus Violation!", 
                        "20 points deducted for leaving focus mode (tab switched/hidden). Session reset.", 
                        0
                    );
                }
                setBreaksTakenInCurrentFocus(prev => prev + 1);
                resetTimer(); 
            }
            // NEW: If user returns to the tab while `isBreakCooldownActive` (meaning they were previously hidden after break)
            else if (isVisible && isBreakCooldownActiveRef.current) { // Use ref here
                // Clear the pending cooldown penalty timeout
                if (modalInteractionTimeoutRef.current) {
                    clearTimeout(modalInteractionTimeoutRef.current);
                    modalInteractionTimeoutRef.current = null;
                }
                setIsBreakCooldownActive(false); // Cooldown ends as user is back
                setShowFullscreenPromptModal(true); // Immediately show the "Resume Focus" modal
                // Start a new timeout for modal interaction
                modalInteractionTimeoutRef.current = setTimeout(async () => { // Made async to await notification permission
                    if (showFullscreenPromptModalRef.current && document.visibilityState === 'visible') { // Use ref here
                        // *** PENALTY REMOVED HERE ***
                        // Per user's request: No penalty for *just* not choosing when modal is up and user is visible.
                        // The modal will persist.
                    }
                    modalInteractionTimeoutRef.current = null;
                }, 10 * 1000); // 10 seconds for modal interaction (no penalty here for not choosing)
            }


            // Update fullscreen expectation based on current state and session type/running status
            if (document.fullscreenElement && sessionType === 'focus' && timer.isRunning && !isConfirmingExit.current && !showFullscreenPromptModalRef.current && !showContinueSessionPrompt) {
                isFocusActiveAndFullScreen.current = true;
                setEventHandledForCurrentInterruption(false); // Reset for potential future exits
            } 
            else if (!document.fullscreenElement && !timer.isRunning && isFocusActiveAndFullScreen.current) {
                // If fullscreen is exited AND timer is not running, and we still think it's active, reset it.
                isFocusActiveAndFullScreen.current = false;
            }

            // Ensure fullscreen is exited if session type is not focus or timer is not running
            if ((sessionType !== 'focus' || !timer.isRunning) && document.fullscreenElement && !isConfirmingExit.current && !showFullscreenPromptModalRef.current && !showContinueSessionPrompt) {
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
        showExitConfirmationModal, showContinueSessionPrompt,
        onRewardPointsEarned, onSendLocalReminder, setBreaksTakenInCurrentFocus, resetTimer, timer,
        isFullscreenAttemptInProgress.current,
        onRequestNotificationPermission // Added to dependencies for async call
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
        } else { // type is 'shortBreak' or 'longBreak'
            setSessionType(type); // Set to specific 'shortBreak' or 'longBreak'
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
        // Only update timer's duration if it's a 'shortBreak' (as this input is for short break) and not running
        if (sessionType === 'shortBreak' && !timer.isRunning) { // Changed condition to shortBreak
            timer.setDuration(newDuration);
        }
    }, [sessionType, timer]); 

    const handleLongBreakDurationChange = useCallback((e) => {
        const minutes = parseInt(e.target.value, 10);
        const newDuration = Math.max(1, minutes) * 60;
        setLongBreakDuration(newDuration);
        // Only update timer's duration if it's a 'longBreak' (as this input is for long break) and not running
        if (sessionType === 'longBreak' && !timer.isRunning) { // Changed condition to longBreak
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
                onSendLocalReminder("Fullscreen Request Failed", "Please click 'Go FullScreen' manually to enforce focus mode.", 0);
            }
        }
        timer.start(); // Start the timer
    }, [totalSessionsToComplete, onSendLocalReminder, focusDuration, timer, sessionType, enforceFullscreen]);


    const handleContinueSession = useCallback(() => {
        setTotalSessionsToComplete(prev => prev + 1);
        setShowContinueSessionPrompt(false);
        setTimeout(() => {
            const nextSessionType = (pomodoroCount + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
            setSessionType(nextSessionType); // Set specific break type
            timer.setDuration(nextSessionType === 'longBreak' ? longBreakDuration : breakDuration);
            timer.start();
        }, 500);
    }, [timer, pomodoroCount, breakDuration, longBreakDuration]);

    const handleFinishSessions = useCallback(() => {
        setShowContinueSessionPrompt(false);
        resetTimer();
    }, [resetTimer]);

    const currentMotivationalMessage = useCallback(() => {
        console.log("Current sessionType for motivational message:", sessionType); // Debug log
        const messages = motivationalMessages[sessionType];
        
        // Defensive check: if messages array is not found or empty, return a fallback
        if (!messages || messages.length === 0) {
            console.warn(`No motivational messages found for sessionType: "${sessionType}". Falling back to a default.`);
            return "Stay focused and productive!"; 
        }

        return messages[Math.floor(Math.random() * messages.length)];
    }, [sessionType, pomodoroCount, breaksTakenInCurrentFocus]); 

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
        startTimer: timer.start, 
        resetTimer,
        setSelectedHabitId,
        handleFocusDurationChange,
        handleBreakDurationChange,
        handleLongBreakDurationChange,
        handleTotalSessionsChange,
        handleInitialStart, 
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
