import { useState, useEffect, useCallback } from 'react';
import {
    addHabit, getHabits, updateHabit, deleteHabit,
    upsertDailyCheckIn, getCheckInsForHabit, getCheckInForHabitAndDate, getHabit as getSingleHabit, updateCheckIn
} from '../services/idbService';

export const useIndexedDB = (userId, onRewardPointsEarned) => { 
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadHabits = useCallback(async () => {
        if (!userId) {
            setHabits([]);
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
        } catch (err) {
            console.error("Failed to load habits:", err);
            setError("Failed to load habits.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadHabits();
    }, [loadHabits]);

    const addHabitHandler = async (newHabit) => {
        if (!userId) return;
        try {
            await addHabit(newHabit, userId);
            await loadHabits();
        } catch (err) {
            console.error("Failed to add habit:", err);
            setError("Failed to add habit.");
        }
    };

    const updateHabitHandler = async (updatedHabit) => {
        if (!userId) return;
        try {
            await updateHabit(updatedHabit, userId);
            await loadHabits();
        } catch (err) {
            console.error("Failed to update habit:", err);
            setError("Failed to update habit.");
        }
    };

    const deleteHabitHandler = async (id) => {
        if (!userId) return;
        try {
            await deleteHabit(id, userId);
            await loadHabits();
        } catch (err) {
            console.error("Failed to delete habit:", err);
            setError("Failed to delete habit.");
        }
    };

    const checkInHabit = async (habitId) => {
        if (!userId) return;
        try {
            const habitDetails = await getSingleHabit(habitId, userId);
            if (!habitDetails) {
                console.warn(`Habit ${habitId} not found for user ${userId}.`);
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            const currentCheckIn = await getCheckInForHabitAndDate(habitId, today, userId);
            const currentDailyCompletions = currentCheckIn ? (currentCheckIn.dailyCompletionCount || 0) : 0;
            
            // Only allow check-in if current count is less than required timesPerDay
            if (currentDailyCompletions < habitDetails.timesPerDay) {
                await upsertDailyCheckIn(habitId, userId); // This increments the count or creates a new check-in
                await loadHabits(); // Reload to update UI and streaks
                
                // Provide feedback to the user on completion progress
                if (currentDailyCompletions + 1 < habitDetails.timesPerDay) {
                    alert(`Habit '${habitDetails.name}' completed ${currentDailyCompletions + 1}/${habitDetails.timesPerDay} times today.`);
                } else {
                    alert(`Habit '${habitDetails.name}' fully completed (${habitDetails.timesPerDay}/${habitDetails.timesPerDay}) for today! You can now collect your reward.`);
                }
            } else {
                console.log(`Habit ${habitId} already fully completed (${habitDetails.timesPerDay} times) for today.`);
                alert(`Habit '${habitDetails.name}' is already fully completed (${habitDetails.timesPerDay} times) for today!`);
            }
        } catch (err) {
            console.error("Failed to check in habit:", err);
            setError("Failed to check in habit.");
        }
    };

    const collectHabitReward = async (habitId, checkinDate) => {
        if (!userId) return;
        try {
            const checkin = await getCheckInForHabitAndDate(habitId, checkinDate, userId);
            const habitDetails = await getSingleHabit(habitId, userId);

            if (!habitDetails) {
                console.warn(`Habit ${habitId} not found for user ${userId}. Cannot collect reward.`);
                return;
            }

            // Check if habit is fully completed for the day AND reward not yet collected
            if (checkin && checkin.dailyCompletionCount >= habitDetails.timesPerDay && !checkin.rewardCollected) {
                await updateCheckIn(checkin.id, { rewardCollected: true }, userId);
                if (habitDetails.rewardPoints > 0) {
                    onRewardPointsEarned(habitDetails.rewardPoints); // Call the callback to update total points
                    alert(`Congratulations! You earned ${habitDetails.rewardPoints} points for '${habitDetails.name}'.`);
                }
                await loadHabits(); // Reload habits to update UI (e.g., disable collect button)
            } else if (checkin && checkin.rewardCollected) {
                console.log(`Reward for habit ${habitId} on ${checkinDate} already collected.`);
                alert(`Reward for '${habitDetails.name}' on ${checkinDate} already collected.`);
            } else if (checkin && checkin.dailyCompletionCount < habitDetails.timesPerDay) {
                console.log(`Habit ${habitId} not yet fully completed ${habitDetails.timesPerDay} times today.`);
                alert(`Habit '${habitDetails.name}' needs to be completed ${habitDetails.timesPerDay} times today before collecting reward.`);
            } else {
                console.log(`No completed check-in found for habit ${habitId} on ${checkinDate}.`);
                alert(`Habit '${habitDetails.name}' has not been completed yet today.`);
            }
        } catch (err) {
            console.error("Failed to collect reward:", err);
            setError("Failed to collect reward.");
        }
    };

    return {
        habits,
        loading,
        error,
        addHabit: addHabitHandler,
        updateHabit: updateHabitHandler,
        deleteHabit: deleteHabitHandler,
        checkInHabit,
        collectHabitReward,
        refreshHabits: loadHabits
    };
};
