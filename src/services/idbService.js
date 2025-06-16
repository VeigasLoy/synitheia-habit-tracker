import { openDB } from 'idb';

const DB_NAME = 'synitheiaDB';
// Increment version to 8 to add the new userSettings store
const DB_VERSION = 8; 
const HABITS_STORE = 'habits';
const CHECKINS_STORE = 'checkins';
const USER_DATA_STORE = 'userData'; // New store for user-specific global data

const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            // Migrations for previous versions
            if (oldVersion < 7) {
                // This block should handle migrations from versions < 7
                // If stores need to be recreated, ensure data is migrated.
                // For this project, we are assuming fresh creation/recreation for simplicity
                // if oldVersion is low, which might imply data loss for very old dbs.
                if (db.objectStoreNames.contains(HABITS_STORE)) {
                    db.deleteObjectStore(HABITS_STORE);
                }
                const habitsStore = db.createObjectStore(HABITS_STORE, { keyPath: 'id', autoIncrement: false });
                habitsStore.createIndex('byUserId', 'userId', { unique: false });

                if (db.objectStoreNames.contains(CHECKINS_STORE)) {
                    db.deleteObjectStore(CHECKINS_STORE);
                }
                const checkinsStore = db.createObjectStore(CHECKINS_STORE, { keyPath: 'id', autoIncrement: false });
                checkinsStore.createIndex('byHabitIdAndDate', ['habitId', 'date'], { unique: false });
                checkinsStore.createIndex('byDate', 'date', { unique: false });
            }

            if (oldVersion < 8) {
                // Create the new USER_DATA_STORE if upgrading from a version less than 8
                if (db.objectStoreNames.contains(USER_DATA_STORE)) {
                    db.deleteObjectStore(USER_DATA_STORE); // Delete if exists to ensure keyPath is set correctly
                }
                db.createObjectStore(USER_DATA_STORE, { keyPath: 'userId', autoIncrement: false });
                console.log(`Database upgraded to version ${newVersion}. ${USER_DATA_STORE} store created.`);
            }
        },
    });
};

// --- Habit Operations ---

export const addHabit = async (habit, userId) => {
    const db = await initDB();
    const tx = db.transaction(HABITS_STORE, 'readwrite');
    const store = tx.objectStore(HABITS_STORE);

    // Generate a unique ID if adding a new habit (id will be undefined)
    const habitToAdd = { ...habit, userId };
    if (!habitToAdd.id) { // Ensure id is always a valid UUID for new habits
        habitToAdd.id = crypto.randomUUID();
    }
    
    await store.add(habitToAdd);
    await tx.done;
    return habitToAdd; // Return the habit with its newly assigned ID
};

export const getHabits = async (userId) => {
    const db = await initDB();
    const tx = db.transaction(HABITS_STORE, 'readonly');
    const store = tx.objectStore(HABITS_STORE);
    const index = store.index('byUserId');
    return index.getAll(userId);
};

export const getHabit = async (id, userId) => {
    const db = await initDB();
    const tx = db.transaction(HABITS_STORE, 'readonly');
    const store = tx.objectStore(HABITS_STORE);
    const habit = await store.get(id);

    if (habit && habit.userId === userId) {
        return habit;
    }
    return undefined;
};

export const updateHabit = async (habit, userId) => {
    const db = await initDB();
    const tx = db.transaction(HABITS_STORE, 'readwrite');
    const store = tx.objectStore(HABITS_STORE);
    const existingHabit = await store.get(habit.id);

    // Only update if the habit exists and belongs to the current user
    if (existingHabit && existingHabit.userId === userId) {
        // Use put to update; if habit.id exists, it updates, otherwise it adds
        await store.put({ ...habit, userId }); 
        await tx.done;
        return { ...habit, userId }; // Return the updated habit
    }
    console.warn(`Attempted to update habit ${habit.id} not owned by user ${userId} or not found.`);
    await tx.done; // Ensure transaction completes
    return null;
};

export const deleteHabit = async (id, userId) => {
    const db = await initDB();
    const tx = db.transaction([HABITS_STORE, CHECKINS_STORE], 'readwrite');
    const habitsStore = tx.objectStore(HABITS_STORE);
    const checkinsStore = tx.objectStore(CHECKINS_STORE);

    const existingHabit = await habitsStore.get(id);

    if (existingHabit && existingHabit.userId === userId) {
        await habitsStore.delete(id);

        const checkinsIndex = checkinsStore.index('byHabitIdAndDate');
        // Use a cursor to delete all check-ins for this habit
        let cursor = await checkinsIndex.openCursor(IDBKeyRange.bound([id, ''], [id, 'z']));
        while (cursor) {
            if (cursor.value.userId === userId) { // Double check user ownership
                await cursor.delete();
            }
            cursor = await cursor.continue();
        }
    } else {
        console.warn(`Attempted to delete habit ${id} not owned by user ${userId} or not found.`);
    }
    await tx.done; // Ensure transaction completes
};

// --- Check-in Operations ---

// This function is now specifically for adding or updating a daily check-in count
export const upsertDailyCheckIn = async (habitId, userId) => {
    const db = await initDB();
    const today = new Date().toISOString().split('T')[0]; //YYYY-MM-DD
    const checkinId = `${habitId}-${today}`; // Use this as the unique ID for the checkin record

    const tx = db.transaction(CHECKINS_STORE, 'readwrite');
    const store = tx.objectStore(CHECKINS_STORE);
    // Use get directly with the composite key for efficiency
    let existingCheckIn = await store.get(checkinId); 

    if (existingCheckIn && existingCheckIn.userId === userId) {
        // Update existing check-in: increment dailyCompletionCount
        existingCheckIn.dailyCompletionCount = (existingCheckIn.dailyCompletionCount || 0) + 1;
        // Ensure rewardCollected is explicitly false unless already true from a previous check-in
        existingCheckIn.rewardCollected = existingCheckIn.rewardCollected === true; 
        await store.put(existingCheckIn);
        await tx.done;
        return existingCheckIn;
    } else {
        // Add new check-in record for the first completion of the day
        const newCheckIn = {
            id: checkinId, // Use the generated composite ID
            habitId,
            date: today,
            status: 'completed', // 'completed' means at least one completion for the day
            dailyCompletionCount: 1, // First completion for the day
            rewardCollected: false,
            userId
        };
        await store.add(newCheckIn); 
        await tx.done;
        return newCheckIn;
    }
};

/**
 * Decrements the dailyCompletionCount for a habit's check-in on a given date.
 * If dailyCompletionCount becomes 0, the check-in record is deleted.
 * @param {string} habitId - The ID of the habit.
 * @param {string} date - The date of the check-in (YYYY-MM-DD).
 * @param {string} userId - The ID of the current user.
 * @returns {Promise<boolean>} True if the check-in was successfully undone, false otherwise.
 */
export const undoLastCheckIn = async (habitId, date, userId) => {
    const db = await initDB();
    const checkinId = `${habitId}-${date}`;
    const tx = db.transaction(CHECKINS_STORE, 'readwrite');
    const store = tx.objectStore(CHECKINS_STORE);

    let checkin = await store.get(checkinId);

    if (checkin && checkin.userId === userId) {
        if (checkin.dailyCompletionCount > 0) {
            checkin.dailyCompletionCount -= 1;
            // If count drops to 0, reset rewardCollected and potentially delete the record
            if (checkin.dailyCompletionCount === 0) {
                checkin.rewardCollected = false; // Reset reward status if no completions left
                await store.delete(checkin.id); // Delete record if count is 0
                await tx.done;
                return true; // Successfully undone and removed
            } else {
                checkin.rewardCollected = false; // Reward might need to be re-collected if count > 0 but not yet full
                await store.put(checkin);
                await tx.done;
                return true; // Successfully undone
            }
        } else {
            console.warn(`Attempted to undo check-in for habit ${habitId} on ${date}, but dailyCompletionCount is already 0.`);
            await tx.done;
            return false;
        }
    } else {
        console.warn(`Check-in for habit ${habitId} on ${date} not found or not owned by user ${userId}. Cannot undo.`);
        await tx.done;
        return false;
    }
};

export const updateCheckIn = async (checkInId, updateData, userId) => {
    const db = await initDB();
    const tx = db.transaction(CHECKINS_STORE, 'readwrite');
    const store = tx.objectStore(CHECKINS_STORE);
    const existingCheckIn = await store.get(checkInId);

    if (existingCheckIn && existingCheckIn.userId === userId) {
        const updatedCheckIn = { ...existingCheckIn, ...updateData };
        await store.put(updatedCheckIn);
        await tx.done;
        return updatedCheckIn;
    }
    console.warn(`Attempted to update check-in ${checkInId} not owned by user ${userId} or not found.`);
    await tx.done; // Ensure transaction completes
    return null;
};


export const getCheckInsForHabit = async (habitId, userId) => {
    const db = await initDB();
    const tx = db.transaction(CHECKINS_STORE, 'readonly');
    const store = tx.objectStore(CHECKINS_STORE);
    const index = store.index('byHabitIdAndDate');
    
    // Using a range on the compound index to get all checkins for a specific habitId
    const allCheckinsForHabit = await index.getAll(IDBKeyRange.bound([habitId, ''], [habitId, 'z']));
    return allCheckinsForHabit.filter(c => c.userId === userId); // Filter by userId for safety
};


export const getCheckInForHabitAndDate = async (habitId, date, userId) => {
    const db = await initDB();
    const tx = db.transaction(CHECKINS_STORE, 'readonly');
    const store = tx.objectStore(CHECKINS_STORE);
    // Use get directly with the ID, which is the composite key
    const checkin = await store.get(`${habitId}-${date}`);
    if (checkin && checkin.userId === userId) {
        return checkin;
    }
    return undefined;
};

// --- User Data Operations (for totalRewardPoints) ---

export const getUserData = async (userId) => {
    const db = await initDB();
    const tx = db.transaction(USER_DATA_STORE, 'readonly');
    const store = tx.objectStore(USER_DATA_STORE);
    // User data is keyed by userId directly
    const userData = await store.get(userId);
    return userData || { userId, totalRewardPoints: 0 }; // Return default if not found
};

export const upsertUserData = async (userData) => {
    const db = await initDB();
    const tx = db.transaction(USER_DATA_STORE, 'readwrite');
    const store = tx.objectStore(USER_DATA_STORE);
    // Use put to update or add based on userId
    await store.put(userData);
    await tx.done;
    return userData;
};
