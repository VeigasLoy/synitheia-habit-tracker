import React, { useState, useEffect } from 'react';

// Days of the week for display
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Days of the month for display
const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

// Accept habitToEdit and onSaveHabit props
const AddHabitForm = ({ onAddHabit, onRequestNotificationPermission, onSendLocalReminder, habitToEdit, onSaveHabit, onClose }) => {
    // Determine if we are in edit mode
    const isEditMode = !!habitToEdit;

    // Initialize states based on whether we are in edit mode or adding a new habit
    const [name, setName] = useState(isEditMode ? habitToEdit.name : '');
    const [description, setDescription] = useState(isEditMode ? habitToEdit.description : '');
    const [timesPerDay, setTimesPerDay] = useState(isEditMode ? habitToEdit.timesPerDay : 1);
    const [difficulty, setDifficulty] = useState(isEditMode ? habitToEdit.difficulty : 'medium');
    const [timeTaken, setTimeTaken] = useState(isEditMode ? habitToEdit.timeTaken : 15);
    const [type, setType] = useState(isEditMode ? habitToEdit.type : 'good');
    const [reminderTime, setReminderTime] = useState(isEditMode && habitToEdit.reminderTime ? habitToEdit.reminderTime : '');

    // States for the flexible Period feature
    const [repeatType, setRepeatType] = useState(isEditMode ? habitToEdit.period.type : 'daily');
    const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState(
        isEditMode && habitToEdit.period.config?.selectedDaysOfWeek 
            ? habitToEdit.period.config.selectedDaysOfWeek 
            : DAYS_OF_WEEK.map((_, index) => index) // Default: Everyday
    );
    const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState(
        isEditMode && habitToEdit.period.config?.selectedDaysOfMonth
            ? habitToEdit.period.config.selectedDaysOfMonth
            : [1] // Default: 1st of month
    );
    const [intervalDays, setIntervalDays] = useState(isEditMode && habitToEdit.period.config?.intervalDays ? habitToEdit.period.config.intervalDays : 2);

    // States for Label feature
    // Initial labels; in a real app, these would be loaded from user preferences/database
    const [availableLabels, setAvailableLabels] = useState(['None', 'Health', 'Workout', 'Study']);
    const [selectedLabel, setSelectedLabel] = useState(isEditMode && habitToEdit.label ? habitToEdit.label : 'None');
    const [showNewLabelInput, setShowNewLabelInput] = useState(false);
    const [newLabelInputValue, setNewLabelInputValue] = useState('');

    // Effect to update form fields when habitToEdit changes (only relevant in edit mode)
    // This ensures the form re-renders with the correct data if a different habit is selected for editing
    useEffect(() => {
        if (isEditMode && habitToEdit) {
            setName(habitToEdit.name || '');
            setDescription(habitToEdit.description || '');
            setTimesPerDay(habitToEdit.timesPerDay || 1);
            setDifficulty(habitToEdit.difficulty || 'medium');
            setTimeTaken(habitToEdit.timeTaken || 15);
            setType(habitToEdit.type || 'good');
            setReminderTime(habitToEdit.reminderTime || '');
            setRepeatType(habitToEdit.period?.type || 'daily');
            setSelectedDaysOfWeek(habitToEdit.period?.config?.selectedDaysOfWeek || DAYS_OF_WEEK.map((_, index) => index));
            setSelectedDaysOfMonth(habitToEdit.period?.config?.selectedDaysOfMonth || [1]);
            setIntervalDays(habitToEdit.period?.config?.intervalDays || 2);
            setSelectedLabel(habitToEdit.label || 'None');
            
            // Handle custom labels: If the habit's label is not in our default available labels,
            // assume it's a new one and display the input field.
            if (habitToEdit.label && !availableLabels.includes(habitToEdit.label) && habitToEdit.label !== 'None') {
                setShowNewLabelInput(true);
                setNewLabelInputValue(habitToEdit.label);
            } else {
                setShowNewLabelInput(false);
                setNewLabelInputValue('');
            }
        }
    }, [habitToEdit, isEditMode, availableLabels]); // Re-run when habitToEdit, mode, or availableLabels change

    // Handler for toggling selected days of the week
    const handleDayOfWeekToggle = (dayIndex) => {
        setSelectedDaysOfWeek(prev =>
            prev.includes(dayIndex)
                ? prev.filter(d => d !== dayIndex)
                : [...prev, dayIndex].sort((a, b) => a - b)
        );
    };

    // Handler for toggling selected days of the month
    const handleDayOfMonthToggle = (day) => {
        setSelectedDaysOfMonth(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort((a, b) => a - b)
        );
    };

    // Function to calculate reward points based on difficulty
    const calculateRewardPoints = (selectedDifficulty) => {
        switch (selectedDifficulty) {
            case 'easy':
                return 5;
            case 'medium':
                return 10;
            case 'hard':
                return 20;
            default:
                return 10; // Default for safety
        }
    };

    // Handler for changing the selected label from the dropdown
    const handleLabelChange = (e) => {
        const value = e.target.value;
        if (value === 'add-new') {
            setShowNewLabelInput(true);
            setSelectedLabel(''); // Clear selected label when "Add New" is chosen
        } else {
            setShowNewLabelInput(false);
            setSelectedLabel(value);
            setNewLabelInputValue(''); // Clear new label input if an existing one is selected
        }
    };

    // Handler for adding a new custom label
    const handleAddNewLabel = () => {
        const trimmedLabel = newLabelInputValue.trim();
        if (trimmedLabel && !availableLabels.some(label => label.toLowerCase() === trimmedLabel.toLowerCase())) {
            setAvailableLabels(prev => [...prev, trimmedLabel].sort()); // Add and sort
            setSelectedLabel(trimmedLabel); // Select the newly added label
            setNewLabelInputValue(''); // Clear input field
            setShowNewLabelInput(false); // Hide the input field
        } else if (trimmedLabel) {
            alert('Label already exists or is invalid.');
        } else {
            alert('Please enter a label name.');
        }
    };

    // Unified submit handler for both adding and editing habits
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Habit name cannot be empty.');
            return;
        }

        // Determine the final label value
        let finalLabel = selectedLabel;
        if (showNewLabelInput && newLabelInputValue.trim()) {
            finalLabel = newLabelInputValue.trim();
        } else if (showNewLabelInput && !newLabelInputValue.trim()) {
            alert('Please enter a new label or select an existing one.');
            return;
        } else if (!selectedLabel && !showNewLabelInput) {
            alert('Please select a label for the habit.');
            return;
        }


        // Prepare period configuration based on repeat type
        let periodConfig;
        if (repeatType === 'daily') {
            periodConfig = { type: 'daily', config: { selectedDaysOfWeek } };
            if (selectedDaysOfWeek.length === 0) {
                alert('Please select at least one day of the week for Daily repeat.');
                return;
            }
        } else if (repeatType === 'monthly') {
            periodConfig = { type: 'monthly', config: { selectedDaysOfMonth } };
            if (selectedDaysOfMonth.length === 0) {
                alert('Please select at least one day of the month for Monthly repeat.');
                return;
            }
        } else { // interval
            periodConfig = { type: 'interval', config: { intervalDays } };
            if (intervalDays < 1) {
                alert('Interval days must be at least 1.');
                return;
            }
        }

        // Calculate reward points based on selected difficulty
        const calculatedRewardPoints = calculateRewardPoints(difficulty);

        // Construct the habit data object
        const habitData = {
            id: isEditMode ? habitToEdit.id : undefined, // Include ID if editing
            name: name.trim(),
            description: description.trim(),
            timesPerDay: parseInt(timesPerDay, 10),
            period: periodConfig,
            difficulty: difficulty,
            timeTaken: parseInt(timeTaken, 10),
            type: type,
            rewardPoints: calculatedRewardPoints,
            label: finalLabel === 'None' ? '' : finalLabel, // Store 'None' as empty string
            createdAt: isEditMode && habitToEdit.createdAt ? habitToEdit.createdAt : new Date().toISOString(), // Preserve original creation date if editing
            reminderTime: reminderTime // Include reminder time
        };

        // Call the parent's onSaveHabit handler (which will either add or update)
        await onSaveHabit(habitData);

        // Reminder notification logic
        if (reminderTime) {
            const granted = await onRequestNotificationPermission();
            if (granted) {
                const [hours, minutes] = reminderTime.split(':').map(Number);
                const now = new Date();
                const reminderDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

                let delayMs = reminderDateTime.getTime() - now.getTime();
                if (delayMs < 0) {
                    reminderDateTime.setDate(reminderDateTime.getDate() + 1); // Schedule for next day if time has passed today
                    delayMs = reminderDateTime.getTime() - now.getTime();
                }
                
                const delayMinutes = delayMs / (1000 * 60);

                onSendLocalReminder(
                    `Reminder for ${habitData.name}!`,
                    `It's time for your habit: ${habitData.description || habitData.name}`,
                    delayMinutes
                );
                alert(`Reminder for '${habitData.name}' set for ${reminderTime} (${delayMinutes.toFixed(0)} mins from now if scheduled for today/tomorrow). Check console.`);
            } else {
                alert('Notification permission denied. Cannot set reminders.');
            }
        }

        // Clear form fields only if adding a new habit
        if (!isEditMode) { 
            setName('');
            setDescription('');
            setTimesPerDay(1);
            setRepeatType('daily');
            setSelectedDaysOfWeek(DAYS_OF_WEEK.map((_, index) => index));
            setSelectedDaysOfMonth([1]);
            setIntervalDays(2);
            setDifficulty('medium');
            setTimeTaken(15);
            setType('good');
            setReminderTime('');
            setSelectedLabel('None');
            setShowNewLabelInput(false);
            setNewLabelInputValue('');
        }
        onClose(); // Close the modal after saving/adding
    };

    return (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white border border-gray-200 rounded-none shadow-none">
            <h2 className="text-2xl font-bold mb-5 text-gray-900 border-b pb-3 border-gray-200">
                {isEditMode ? 'Edit Habit' : 'Add New Habit'}
            </h2>
            
            <div className="mb-4">
                <label htmlFor="habit-name" className="block text-sm font-medium text-gray-700 mb-1">Habit Name</label>
                <input
                    type="text"
                    id="habit-name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Drink 8 glasses of water"
                    required
                />
            </div>
            
            <div className="mb-4">
                <label htmlFor="habit-description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                    id="habit-description"
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Why this habit is important..."
                    rows="2"
                ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="times-per-day" className="block text-sm font-medium text-gray-700 mb-1">Times per Day</label>
                    <input
                        type="number"
                        id="times-per-day"
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base"
                        value={timesPerDay}
                        onChange={(e) => setTimesPerDay(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        min="1"
                    />
                </div>
                <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                        id="difficulty"
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base bg-white"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="time-taken" className="block text-sm font-medium text-gray-700 mb-1">Time Taken (minutes)</label>
                    <input
                        type="number"
                        id="time-taken"
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base"
                        value={timeTaken}
                        onChange={(e) => setTimeTaken(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        min="0"
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Habit Type</label>
                    <select
                        id="type"
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base bg-white"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="good">Good Habit</option>
                        <option value="bad">Bad Habit</option>
                    </select>
                </div>
            </div>

            {/* REWARD POINTS INPUT REMOVED - it's now calculated internally */}
            {/* Display the calculated reward points as read-only feedback */}
            <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-sm text-sm">
                Expected Reward Points for selected Difficulty: <span className="font-semibold">{calculateRewardPoints(difficulty)} Pts</span>
            </div>

            {/* Label Selection */}
            <div className="mb-4">
                <label htmlFor="habit-label" className="block text-sm font-medium text-gray-700 mb-1">Label (Category)</label>
                <select
                    id="habit-label"
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base bg-white"
                    value={showNewLabelInput ? 'add-new' : selectedLabel}
                    onChange={handleLabelChange}
                >
                    {availableLabels.map(label => (
                        <option key={label} value={label}>{label}</option>
                    ))}
                    <option value="add-new">-- Add New Label --</option>
                </select>
            </div>

            {showNewLabelInput && (
                <div className="mb-4 flex space-x-2">
                    <input
                        type="text"
                        placeholder="Enter new label"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base"
                        value={newLabelInputValue}
                        onChange={(e) => setNewLabelInputValue(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        onClick={handleAddNewLabel}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-sm"
                    >
                        Add
                    </button>
                </div>
            )}

            {/* Repeat / Period Section */}
            <div className="mb-6 p-4 border border-gray-200 rounded-sm bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Repeat</h3>
                <div className="flex justify-between items-center bg-gray-100 p-1 rounded-sm mb-4">
                    <button
                        type="button"
                        className={`flex-1 py-2 text-center text-sm font-medium ${repeatType === 'daily' ? 'bg-blue-600 text-white rounded-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => setRepeatType('daily')}
                    >
                        DAILY
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 text-center text-sm font-medium ${repeatType === 'monthly' ? 'bg-blue-600 text-white rounded-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => setRepeatType('monthly')}
                    >
                        MONTHLY
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 text-center text-sm font-medium ${repeatType === 'interval' ? 'bg-blue-600 text-white rounded-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => setRepeatType('interval')}
                    >
                        INTERVAL
                    </button>
                </div>

                {repeatType === 'daily' && (
                    <div>
                        <p className="text-sm text-gray-700 mb-2">Select days of the week:</p>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {DAYS_OF_WEEK.map((day, index) => (
                                <button
                                    type="button"
                                    key={day}
                                    className={`p-2 border border-gray-300 rounded-sm text-sm font-medium
                                        ${selectedDaysOfWeek.includes(index) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                    onClick={() => handleDayOfWeekToggle(index)}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {repeatType === 'monthly' && (
                    <div>
                        <p className="text-sm text-gray-700 mb-2">Select days of the month:</p>
                        <div className="grid grid-cols-7 gap-1">
                            {DAYS_OF_MONTH.map(day => (
                                <button
                                    type="button"
                                    key={day}
                                    className={`p-1 border border-gray-300 rounded-sm text-xs font-medium
                                        ${selectedDaysOfMonth.includes(day) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                    onClick={() => handleDayOfMonthToggle(day)}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {repeatType === 'interval' && (
                    <div>
                        <label htmlFor="interval-days" className="block text-sm font-medium text-gray-700 mb-1">Repeat Every (days)</label>
                        <input
                            type="number"
                            id="interval-days"
                            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base"
                            value={intervalDays}
                            onChange={(e) => setIntervalDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            min="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">e.g., '2' for every other day.</p>
                    </div>
                )}
            </div>

            <div className="mb-6">
                <label htmlFor="reminder-time" className="block text-sm font-medium text-gray-700 mb-1">
                    Set Reminder ({repeatType === 'daily' ? 'Daily' : 'For occurrence day'}) (Optional)
                </label>
                <input
                    type="time"
                    id="reminder-time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Setting a time will prompt for notification permission and set a local reminder for the specified occurrence.
                </p>
            </div>

            <div className="flex space-x-3">
                <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    {isEditMode ? 'Save Changes' : 'Add Habit'}
                </button>
                {isEditMode && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-none bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default AddHabitForm;
