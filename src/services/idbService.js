import { openDB } from 'idb';

const DB_NAME = 'synitheiaDB';
const DB_VERSION = 6; // Increment to version 6 for dailyCompletionCount in checkins
const HABITS_STORE = 'habits';
const CHECKINS_STORE = 'checkins';

const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            if (oldVersion < 1) {
                const habitsStore = db.createObjectStore(HABITS_STORE, { keyPath: 'id', autoIncrement: true });
                habitsStore.createIndex('byUserId', 'userId', { unique: false });

                const checkinsStore = db.createObjectStore(CHECKINS_STORE, { keyPath: 'id', autoIncrement: true });
                checkinsStore.createIndex('byHabitIdAndDate', ['habitId', 'date'], { unique: false });
                checkinsStore.createIndex('byDate', 'date', { unique: false });
            }
            if (oldVersion < 2) {
                const habitsStore = transaction.objectStore(HABITS_STORE);
                if (!habitsStore.indexNames.contains('byUserId')) {
                    habitsStore.createIndex('byUserId', 'userId', { unique: false });
                }
                const checkinsStore = transaction.objectStore(CHECKINS_STORE);
                if (!checkinsStore.indexNames.contains('byUserId')) {
                    checkinsStore.createIndex('byUserId', 'userId', { unique: false });
                }
            }
            if (oldVersion < 3) {
                // No specific migration for 'period' field needed here, it was already handled as an object.
            }
            if (oldVersion < 4) {
                // No specific migration needed here.
            }
            if (oldVersion < 5) {
                const checkinsStore = transaction.objectStore(CHECKINS_STORE);
                checkinsStore.openCursor().then(function cursorIterate(cursor) {
                    if (cursor) {
                        const checkin = { ...cursor.value };
                        if (typeof checkin.rewardCollected === 'undefined') {
                            checkin.rewardCollected = false;
                            cursor.update(checkin);
                        }
                        cursor.continue();
                    }
                });
            }
            if (oldVersion < 6) {
                // Add dailyCompletionCount to existing checkins (default to 1 if status is completed)
                const checkinsStore = transaction.objectStore(CHECKINS_STORE);
                checkinsStore.openCursor().then(function cursorIterate(cursor) {
                    if (cursor) {
                        const checkin = { ...cursor.value };
                        if (typeof checkin.dailyCompletionCount === 'undefined') {
                            // If status was 'completed', assume 1 completion, else 0
                            checkin.dailyCompletionCount = (checkin.status === 'completed' ? 1 : 0);
                            cursor.update(checkin);
                        }
                        cursor.continue();
                    }
                });
            }
        },
    });
};

// --- Habit Operations ---

export const addHabit = async (habit, userId) => {
    const db = await initDB();
    return db.transaction(HABITS_STORE, 'readwrite').objectStore(HABITS_STORE).add({ ...habit, userId });
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

    if (existingHabit && existingHabit.userId === userId) {
        return store.put({ ...habit, userId });
    }
    console.warn(`Attempted to update habit ${habit.id} not owned by user ${userId} or not found.`);
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
        let cursor = await checkinsIndex.openCursor(IDBKeyRange.bound([id, ''], [id, 'z']));
        while (cursor) {
            if (cursor.value.userId === userId) {
                await cursor.delete();
            }
            cursor = await cursor.continue();
        }
    } else {
        console.warn(`Attempted to delete habit ${id} not owned by user ${userId} or not found.`);
    }
    return tx.done;
};

// --- Check-in Operations ---

// This function is now specifically for adding or updating a daily check-in count
export const upsertDailyCheckIn = async (habitId, userId) => {
    const db = await initDB();
    const today = new Date().toISOString().split('T')[0];
    const tx = db.transaction(CHECKINS_STORE, 'readwrite');
    const store = tx.objectStore(CHECKINS_STORE);
    const index = store.index('byHabitIdAndDate');

    let existingCheckIn = await index.get([habitId, today]);

    if (existingCheckIn && existingCheckIn.userId === userId) {
        // Update existing check-in: increment dailyCompletionCount
        existingCheckIn.dailyCompletionCount = (existingCheckIn.dailyCompletionCount || 0) + 1;
        // Ensure rewardCollected is explicitly false unless already true from a previous check-in
        existingCheckIn.rewardCollected = existingCheckIn.rewardCollected === true; 
        await store.put(existingCheckIn);
        return existingCheckIn;
    } else {
        // Add new check-in record for the first completion of the day
        const newCheckIn = {
            habitId,
            date: today,
            status: 'completed', // 'completed' means at least one completion for the day
            dailyCompletionCount: 1, // First completion for the day
            rewardCollected: false,
            userId
        };
        // Use add to insert a new record, if keyPath 'id' is autoIncrement, it will assign new ID
        await store.add(newCheckIn); 
        return newCheckIn;
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
        return updatedCheckIn;
    }
    console.warn(`Attempted to update check-in ${checkInId} not owned by user ${userId} or not found.`);
    return null;
};


export const getCheckInsForHabit = async (habitId, userId) => {
    const db = await initDB();
    const tx = db.transaction(CHECKINS_STORE, 'readonly');
    const store = tx.objectStore(CHECKINS_STORE);
    const index = store.index('byHabitIdAndDate');
    
    const allCheckinsForHabit = await index.getAll(IDBKeyRange.bound([habitId, ''], [habitId, 'z']));
    return allCheckinsForHabit.filter(c => c.userId === userId);
};


export const getCheckInForHabitAndDate = async (habitId, date, userId) => {
    const db = await initDB();
    const tx = db.transaction(CHECKINS_STORE, 'readonly');
    const store = tx.objectStore(CHECKINS_STORE);
    const index = store.index('byHabitIdAndDate');
    
    const checkin = await index.get([habitId, date]);
    if (checkin && checkin.userId === userId) {
        return checkin;
    }
    return undefined;
};
