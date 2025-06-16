import { useState, useCallback, useRef } from 'react';

const useFullscreenEnforcer = () => {
    // New ref to track if a fullscreen attempt is actively in progress
    const isFullscreenAttemptInProgress = useRef(false);

    // Fullscreen Utility Function - only called by user gesture initiated actions
    const enforceFullscreen = useCallback(async () => {
        // Set the flag to true at the very start of the attempt
        isFullscreenAttemptInProgress.current = true;
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                return true;
            }
            return true; // Already in fullscreen
        } catch (err) {
            console.error("Fullscreen initiation error (requires user gesture):", err);
            return false; // Fullscreen failed to initiate
        } finally {
            // Reset the flag after a short delay to allow browser to settle
            // This delay is crucial to prevent premature 'fullscreenchange' event handling
            setTimeout(() => {
                isFullscreenAttemptInProgress.current = false;
            }, 300); // Give it a bit more time
        }
    }, []);

    return { 
        enforceFullscreen,
        isFullscreenAttemptInProgress // Expose the ref for external checks
    };
};

export default useFullscreenEnforcer;
