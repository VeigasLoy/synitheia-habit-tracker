import { useState, useEffect, useRef, useCallback } from 'react';

const useTimer = (initialDuration, onTimerEnd, shouldPause) => {
    // Initialize timeLeft with initialDuration.
    // We will explicitly manage its changes via setTimeLeft and reset.
    const [timeLeft, setTimeLeft] = useState(initialDuration);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef(null);

    // This effect ensures that if the 'initialDuration' PROP changes (e.g.,
    // the parent component decides a break should be 10 minutes instead of 5),
    // then the timeLeft updates to this new initialDuration.
    // It *should not* reset timeLeft when merely pausing/unpausing.
    useEffect(() => {
        // Only update if the initialDuration prop truly changes.
        // Removing `isRunning` from dependencies prevents unintended resets on pause/resume.
        setTimeLeft(initialDuration);
    }, [initialDuration]); // Removed isRunning from dependencies


    // Core timer effect
    useEffect(() => {
        clearInterval(intervalRef.current); // Clear any existing interval

        if (isRunning && timeLeft > 0 && !shouldPause) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            // Timer reached 0
            clearInterval(intervalRef.current);
            setIsRunning(false); // Ensure isRunning is false when timer ends
            onTimerEnd(); // Callback when timer finishes
        }
        // Cleanup function
        return () => clearInterval(intervalRef.current);
    }, [isRunning, timeLeft, onTimerEnd, shouldPause]);

    const start = useCallback(() => {
        // Only start if there's time left
        if (timeLeft > 0) {
            setIsRunning(true);
        } else {
            // If starting with 0 time, reset to initialDuration before starting
            // This case handles a fresh start after a session has fully completed.
            setTimeLeft(initialDuration); 
            setIsRunning(true);
        }
    }, [timeLeft, initialDuration]); // Add initialDuration to dependencies

    const pause = useCallback(() => {
        setIsRunning(false);
        clearInterval(intervalRef.current);
    }, []);

    const reset = useCallback((newDuration = initialDuration) => {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        setTimeLeft(newDuration);
    }, [initialDuration]);

    const setDuration = useCallback((newDuration) => {
        setTimeLeft(newDuration);
        // No isRunning dependency here, as setTimeLeft is always intended when `setDuration` is called.
    }, []); 

    return {
        timeLeft,
        isRunning,
        start,
        pause,
        reset,
        setDuration,
        setIsRunning // Expose setIsRunning for external control (e.g., from useFocusModeLogic)
    };
};

export default useTimer;
