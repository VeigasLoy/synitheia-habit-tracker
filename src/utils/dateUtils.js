export const getTodayDateString = () => {
    // Returns today's date in 'YYYY-MM-DD' format (ISO string without time)
    return new Date().toISOString().split('T')[0];
};

export const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1); // Subtract one day
    return d.toISOString().split('T')[0];
};

export const getDatesInRange = (startDateStr, endDateStr) => {
    const dates = [];
    let currentDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Loop through dates from start to end (inclusive)
    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

export const calculateStreak = (checkins = []) => {
    if (checkins.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Filter for completed check-ins and sort them chronologically
    const sortedCheckins = checkins
        .filter(c => c.status === 'completed')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedCheckins.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const checkinDatesSet = new Set(sortedCheckins.map(c => c.date)); // For quick lookups

    // --- Calculate Current Streak ---
    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0); // Normalize to start of today

    const todayStr = getTodayDateString();
    const yesterdayStr = getYesterdayDateString();

    // Check if the habit was checked in today
    if (checkinDatesSet.has(todayStr)) {
        currentStreak = 1; // Start streak with today
        checkDate.setDate(checkDate.getDate() - 1); // Move to yesterday for next check
    } else if (checkinDatesSet.has(yesterdayStr)) {
        // If not checked today but checked yesterday, the current streak is 0 for *daily* habits.
        // If your habit allows for skipped days (e.g., M-W-F), this logic would be more complex.
        // For a strict daily habit, if today is missed, the streak is broken.
        currentStreak = 0;
    } else {
        currentStreak = 0; // Not checked today or yesterday, streak is definitely broken
    }

    // If a streak was started (i.e., checked in today), continue counting backwards
    if (currentStreak === 1) {
        while (checkinDatesSet.has(checkDate.toISOString().split('T')[0])) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        // Subtract 1 because we added 1 for the initial day (today)
        currentStreak--;
    }


    // --- Calculate Longest Streak ---
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const checkin of sortedCheckins) {
        const currentDate = new Date(checkin.date);
        currentDate.setHours(0, 0, 0, 0); // Normalize to start of day

        if (!prevDate) {
            tempStreak = 1; // First check-in starts a streak of 1
        } else {
            const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) { // Consecutive day
                tempStreak++;
            } else if (diffDays > 1) { // Gap in streak
                tempStreak = 1; // Reset streak
            }
            // If diffDays is 0, it's the same day, don't increment.
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        prevDate = currentDate;
    }

    return { currentStreak, longestStreak };
};