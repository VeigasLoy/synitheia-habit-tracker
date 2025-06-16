// utils/dateUtils.js

export const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

/**
 * Calculates the current and longest streak based on habit check-ins.
 * A day is considered "completed" for streak purposes if the reward was collected.
 * * @param {Array<Object>} checkins - An array of check-in objects for a habit.
 * Each object should have at least { date: 'YYYY-MM-DD', rewardCollected: boolean }.
 * @returns {{currentStreak: number, longestStreak: number}} The calculated streaks.
 */
export const calculateStreak = (checkins) => {
    if (!checkins || checkins.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // Create a Set of dates where the reward was collected
    const collectedRewardDates = new Set(
        checkins
            .filter(c => c.rewardCollected) // Only consider check-ins where reward was collected
            .map(c => c.date)
    );

    const sortedDates = Array.from(collectedRewardDates).sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Recalculate current streak more precisely
    let tempCurrentStreak = 0;
    let checkDay = new Date(today);
    let checkDayString = getTodayDateString();

    // Check today
    if (collectedRewardDates.has(checkDayString)) {
        tempCurrentStreak = 1;
        checkDay.setDate(checkDay.getDate() - 1); // Move to yesterday
        checkDayString = checkDay.toISOString().split('T')[0];
    } else {
        // If today's reward isn't collected, check yesterday
        checkDay.setDate(checkDay.getDate() - 1); // Move to yesterday
        checkDayString = checkDay.toISOString().split('T')[0];
        if (collectedRewardDates.has(checkDayString)) {
            tempCurrentStreak = 1;
            checkDay.setDate(checkDay.getDate() - 1); // Move to day before yesterday
            checkDayString = checkDay.toISOString().split('T')[0];
        } else {
            // No reward collected today or yesterday, current streak is 0
            currentStreak = 0; // Explicitly set to 0
        }
    }

    // Continue checking past days for the current streak
    if (tempCurrentStreak > 0) { // Only continue if a streak has started (today or yesterday)
        while (collectedRewardDates.has(checkDayString)) {
            tempCurrentStreak++;
            checkDay.setDate(checkDay.getDate() - 1);
            checkDayString = checkDay.toISOString().split('T')[0];
        }
        currentStreak = tempCurrentStreak;
    }


    // Calculate longest streak from all collected dates
    if (sortedDates.length > 0) {
        let maxStreak = 0;
        let currentLongestTempStreak = 0;
        let previousDate = null;

        for (const dateString of sortedDates) {
            const currentDate = new Date(dateString);
            currentDate.setHours(0, 0, 0, 0);

            if (previousDate === null || (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24) === 1) {
                currentLongestTempStreak++;
            } else {
                maxStreak = Math.max(maxStreak, currentLongestTempStreak);
                currentLongestTempStreak = 1;
            }
            previousDate = currentDate;
        }
        longestStreak = Math.max(maxStreak, currentLongestTempStreak); // Ensure the last temp streak is compared
    }
    

    return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
};


/**
 * Generates an array of date strings (YYYY-MM-DD) within a specified range.
 * @param {string} startDateString - The start date in 'YYYY-MM-DD' format.
 * @param {string} endDateString - The end date in 'YYYY-MM-DD' format.
 * @returns {Array<string>} An array of date strings.
 */
export const getDatesInRange = (startDateString, endDateString) => {
    const dates = [];
    let currentDate = new Date(startDateString);
    const endDate = new Date(endDateString);

    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// Helper to get previous date string (used internally if needed, or can be removed)
const getPreviousDateString = (dateString) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
};
