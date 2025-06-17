import { useState, useEffect, useCallback } from 'react';
import {
    addHabit, getHabits, updateHabit, deleteHabit,
    upsertDailyCheckIn, getCheckInsForHabit, getCheckInForHabitAndDate, getHabit as getSingleHabit, updateCheckIn,
    undoLastCheckIn, getUserData, upsertUserData // Import new user data functions
} from '../services/idbService';
import { getTodayDateString } from '../utils/dateUtils'; // Import getTodayDateString

export const useIndexedDB = (userId) => { // Removed onRewardPointsEarned from props here, it will be handled internally
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalRewardPoints, setTotalRewardPoints] = useState(0); // New state for total reward points

    const loadHabitsAndUserData = useCallback(async () => {
        if (!userId) {
            setHabits([]);
            setTotalRewardPoints(0); // Reset points if no user
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const loadedHabits = await getHabits(userId);
            const habitsWithCheckins = await Promise.all(loadedHabits.map(async (habit) => {
                const checkins = await getCheckInsForHabit(habit.id, userId);
                return { ...habit, checkins };
            }));
            setHabits(habitsWithCheckins);

            const userData = await getUserData(userId);
            setTotalRewardPoints(userData.totalRewardPoints || 0);
            console.log(`[useIndexedDB] User data loaded. Total Reward Points: ${userData.totalRewardPoints || 0}`);

        } catch (err) {
            console.error("Failed to load habits or user data:", err);
            setError(`Failed to load data: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadHabitsAndUserData();
    }, [loadHabitsAndUserData]);

    // Helper to update a single habit's checkins array within the main habits state
    const updateHabitCheckinsInState = useCallback((habitId, updatedCheckinOrNull) => {
        setHabits(prevHabits => {
            const newHabits = prevHabits.map(habit => {
                if (habit.id === habitId) {
                    const newCheckins = updatedCheckinOrNull
                        ? [
                            // Filter out the old version of the checkin, then add the new one
                            ...habit.checkins.filter(c => c.id !== updatedCheckinOrNull.id),
                            updatedCheckinOrNull
                        ].filter(Boolean) // Remove null/undefined if checkin was deleted (e.g., undo to 0 completions)
                        : habit.checkins.filter(c => c.id !== `${habitId}-${getTodayDateString()}`); // Filter out today's checkin if it's null/deleted
                    
                    // Re-sort checkins by date to keep them ordered
                    newCheckins.sort((a, b) => a.date.localeCompare(b.date));

                    return { 
                        ...habit, 
                        checkins: newCheckins 
                    };
                }
                return habit;
            });
            return newHabits;
        });
    }, []);

    // New function to earn/deduct points and persist them
    const earnRewardPoints = useCallback(async (points) => {
        if (!userId) {
            console.warn("[earnRewardPoints] Cannot earn/deduct points: userId is missing.");
            return;
        }
        setTotalRewardPoints(prevPoints => {
            const newPoints = Math.max(0, prevPoints + points); // Ensure points don't go below 0
            console.log(`[earnRewardPoints] Attempting to update total points from ${prevPoints} to ${newPoints} (change: ${points})`);
            upsertUserData({ userId, totalRewardPoints: newPoints })
                .then(() => console.log(`[earnRewardPoints] Successfully saved new total points: ${newPoints}`))
                .catch(err => console.error("[earnRewardPoints] Failed to save reward points:", err));
            return newPoints;
        });
    }, [userId]);


    const addHabitHandler = async (newHabit) => {
        if (!userId) return;
        try {
            const addedHabit = await addHabit(newHabit, userId);
            // After adding, load all habits to ensure all new data (including checkins) is fresh
            await loadHabitsAndUserData(); 
        } catch (err) {
            console.error("Failed to add habit:", err);
            setError(`Failed to add habit: ${err.message || err}`);
        }
    };

    const updateHabitHandler = async (updatedHabit) => {
        if (!userId) return;
        try {
            await updateHabit(updatedHabit, userId);
            // After updating, load all habits to ensure all new data (including checkins) is fresh
            await loadHabitsAndUserData(); 
        } // Preserve user changes
        catch (err) {
            console.error("Failed to update habit:", err);
            setError(`Failed to update habit: ${err.message || err}`);
        }
    };

    const deleteHabitHandler = async (id) => {
        if (!userId) return;
        try {
            await deleteHabit(id, userId);
            // After deleting, load all habits to ensure the UI is fresh
            await loadHabitsAndUserData();
        } catch (err) {
            console.error("Failed to delete habit:", err);
            setError(`Failed to delete habit: ${err.message || err}`);
        }
    };

    const checkInHabit = async (habitId) => {
        if (!userId) {
            console.warn("[checkInHabit] Cannot check in habit: userId is missing.");
            return { success: false, currentDailyCompletions: 0, isHabitFullyCompletedToday: false };
        }
        try {
            const habitDetails = await getSingleHabit(habitId, userId);
            if (!habitDetails) {
                console.warn(`[checkInHabit] Habit ${habitId} not found for user ${userId}. Cannot check in.`);
                return { success: false, currentDailyCompletions: 0, isHabitFullyCompletedToday: false };
            }

            const today = getTodayDateString();
            const currentCheckIn = await getCheckInForHabitAndDate(habitId, today, userId);
            const currentDailyCompletions = currentCheckIn ? (currentCheckIn.dailyCompletionCount || 0) : 0;
            
            console.log(`[checkInHabit] Habit: ${habitDetails.name}, Times per Day: ${habitDetails.timesPerDay}, Current Completions: ${currentDailyCompletions}`);

            if (currentDailyCompletions < habitDetails.timesPerDay) {
                const updatedCheckIn = await upsertDailyCheckIn(habitId, userId); 
                updateHabitCheckinsInState(habitId, updatedCheckIn); // Update state directly
                
                const newDailyCompletions = updatedCheckIn ? updatedCheckIn.dailyCompletionCount : currentDailyCompletions + 1;
                const isFullyCompleted = newDailyCompletions >= habitDetails.timesPerDay;
                
                console.log(`[checkInHabit] Successfully checked in. New completions: ${newDailyCompletions}, Fully Completed: ${isFullyCompleted}`);
                return { success: true, currentDailyCompletions: newDailyCompletions, isHabitFullyCompletedToday: isFullyCompleted };
            } else {
                console.log(`[checkInHabit] Habit ${habitId} already fully completed (${habitDetails.timesPerDay} times) for today.`);
                return { success: false, currentDailyCompletions: currentDailyCompletions, isHabitFullyCompletedToday: true, message: "Already fully completed." };
            }
        } catch (err) {
            console.error("[checkInHabit] Failed to check in habit:", err);
            setError(`Failed to check in habit: ${err.message || err}`);
            return { success: false, currentDailyCompletions: 0, isHabitFullyCompletedToday: false, error: err.message };
        }
    };

    const collectHabitReward = async (habitId, checkinDate) => {
        if (!userId) {
            console.warn("[collectHabitReward] Cannot collect reward: userId is missing.");
            return { success: false, message: "User not logged in." };
        }
        try {
            console.log(`[collectHabitReward] Attempting to collect reward for habit ${habitId} on ${checkinDate}`);
            const checkin = await getCheckInForHabitAndDate(habitId, checkinDate, userId);
            const habitDetails = await getSingleHabit(habitId, userId);

            if (!habitDetails) {
                console.warn(`[collectHabitReward] Habit ${habitId} not found for user ${userId}. Cannot collect reward.`);
                return { success: false, message: "Habit not found." };
            }

            console.log(`[collectHabitReward] Check-in status:`, checkin);
            console.log(`[collectHabitReward] Habit Details:`, habitDetails);

            if (checkin && checkin.dailyCompletionCount >= habitDetails.timesPerDay && !checkin.rewardCollected) {
                console.log(`[collectHabitReward] Conditions met: dailyCompletionCount (${checkin.dailyCompletionCount}) >= timesPerDay (${habitDetails.timesPerDay}) AND reward not collected (${!checkin.rewardCollected}).`);
                const updatedCheckin = await updateCheckIn(checkin.id, { rewardCollected: true }, userId);
                updateHabitCheckinsInState(habitId, updatedCheckin); // Update state directly
                
                if (habitDetails.rewardPoints > 0) {
                    console.log(`[collectHabitReward] Awarding ${habitDetails.rewardPoints} points.`);
                    earnRewardPoints(habitDetails.rewardPoints); // Use the new earnRewardPoints
                } else {
                    console.log(`[collectHabitReward] Habit has 0 or no reward points. No points awarded.`);
                }
                return { success: true, pointsEarned: habitDetails.rewardPoints };
            } else if (checkin && checkin.rewardCollected) {
                console.log(`[collectHabitReward] Reward for habit ${habitId} on ${checkinDate} already collected.`);
                return { success: false, message: "Reward already collected." };
            } else if (checkin && checkin.dailyCompletionCount < habitDetails.timesPerDay) {
                console.log(`[collectHabitReward] Habit ${habitId} not yet fully completed (${habitDetails.timesPerDay} times) today.`);
                return { success: false, message: "Habit not fully completed yet." };
            } else {
                console.log(`[collectHabitReward] No completed check-in found for habit ${habitId} on ${checkinDate}.`);
                return { success: false, message: "No check-in found for today." };
            }
        } catch (err) {
            console.error("[collectHabitReward] Failed to collect reward:", err);
            setError(`Failed to collect reward: ${err.message || err}`);
            return { success: false, error: err.message };
        }
    };

    const undoCheckIn = async (habitId) => {
        if (!userId) {
            console.warn("[undoCheckIn] Cannot undo check-in: userId is missing.");
            return { success: false, message: "User not logged in." };
        }
        const today = getTodayDateString();
        let checkinBeforeUndo = null;

        try {
            checkinBeforeUndo = await getCheckInForHabitAndDate(habitId, today, userId);

            const undone = await undoLastCheckIn(habitId, today, userId);
            if (undone) {
                if (checkinBeforeUndo && checkinBeforeUndo.rewardCollected) {
                    const habitDetails = await getSingleHabit(habitId, userId);
                    if (habitDetails && habitDetails.rewardPoints > 0) {
                        earnRewardPoints(-habitDetails.rewardPoints); // Use the new earnRewardPoints
                        console.log(`[undoCheckIn] Subtracted ${habitDetails.rewardPoints} points for undoing rewarded check-in.`);
                    }
                }
                const updatedCheckin = await getCheckInForHabitAndDate(habitId, today, userId);
                updateHabitCheckinsInState(habitId, updatedCheckin || null); 
                return { success: true };
            }
            return { success: false, message: "Failed to undo check-in or no check-in to undo." };
        } catch (err) {
            console.error("[undoCheckIn] Failed to undo check-in:", err);
            setError(`Failed to undo check-in: ${err.message || err}`);
            return { success: false, error: err.message };
        }
    };

    return {
        habits,
        loading,
        error,
        totalRewardPoints, // Export totalRewardPoints
        addHabit: addHabitHandler,
        updateHabit: updateHabitHandler,
        deleteHabit: deleteHabitHandler,
        checkInHabit,
        collectHabitReward,
        undoCheckIn,
        earnRewardPoints, // Export earnRewardPoints
        refreshHabits: loadHabitsAndUserData // Renamed for clarity to include user data
    };
};
