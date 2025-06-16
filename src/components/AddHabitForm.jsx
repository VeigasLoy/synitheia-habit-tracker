import React, { useState, useEffect } from 'react';

// Days of the week for display
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Days of the month for display
const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

// Accept habitToEdit and onSaveHabit props
const AddHabitForm = ({ onRequestNotificationPermission, onSendLocalReminder, habitToEdit, onSaveHabit, onClose }) => {
    // Determine if we are in edit mode
    const isEditMode = !!habitToEdit && !!habitToEdit.id; // Check for actual ID to confirm edit mode

    // Initialize states based on whether we are in edit mode or adding a new habit
    // Use habitToEdit.type or default to 'good' for new habits
    // The type is now determined by the context (add good, add bad, or edit existing)
    // and is not directly selectable within the form.
    const initialType = isEditMode && habitToEdit.type ? habitToEdit.type : (habitToEdit && habitToEdit.type ? habitToEdit.type : 'good');


    const [name, setName] = useState(isEditMode ? habitToEdit.name : '');
    const [description, setDescription] = useState(isEditMode ? habitToEdit.description : '');
    const [timesPerDay, setTimesPerDay] = useState(isEditMode ? habitToEdit.timesPerDay : 1);
    const [difficulty, setDifficulty] = useState(isEditMode ? habitToEdit.difficulty : 'medium');
    const [timeTaken, setTimeTaken] = useState(isEditMode ? habitToEdit.timeTaken : 15);
    const [type, setType] = useState(initialType); // Use initialType for state, no longer a selectable input
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
        if (habitToEdit) { // Always check if habitToEdit exists, regardless of isEditMode
            setName(habitToEdit.name || '');
            setDescription(habitToEdit.description || '');
            setTimesPerDay(habitToEdit.timesPerDay || 1);
            setDifficulty(habitToEdit.difficulty || 'medium');
            setTimeTaken(habitToEdit.timeTaken || (habitToEdit.type === 'good' ? 15 : 0)); // Set timeTaken to 0 for bad habits
            setType(habitToEdit.type || 'good'); // Update type when editing
            setReminderTime(habitToEdit.reminderTime || ''); // Corrected typo here
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
        } else {
            // Reset for new habit creation when modal reopens for new habit
            setName('');
            setDescription('');
            setTimesPerDay(1);
            setDifficulty('medium');
            setTimeTaken(15);
            setType('good'); // Default to good for new habits
            setReminderTime('');
            setRepeatType('daily');
            setSelectedDaysOfWeek(DAYS_OF_WEEK.map((_, index) => index));
            setSelectedDaysOfMonth([1]);
            setIntervalDays(2);
            setSelectedLabel('None');
            setShowNewLabelInput(false);
            setNewLabelInputValue('');
        }
    }, [habitToEdit, availableLabels]); // Re-run when habitToEdit or availableLabels change

    const handleDayOfWeekToggle = (dayIndex) => {
        setSelectedDaysOfWeek(prev =>
            prev.includes(dayIndex)
                ? prev.filter(d => d !== dayIndex)
                : [...prev, dayIndex].sort((a, b) => a - b)
        );
    };

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
            // timeTaken is now conditional
            timeTaken: type === 'good' ? parseInt(timeTaken, 10) : 0, 
            type: type, // Type is determined by the FAB or existing habit, not form input
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

        onClose(); // Close the modal after saving/adding
    };

    // Determine dynamic styling and text based on habit type and mode
    const formThemeClasses = type === 'good' 
        ? "border-green-400" 
        : "border-red-400";
    const titleColorClass = type === 'good' 
        ? "text-green-700" 
        : "text-red-700";
    const buttonBgClass = type === 'good' 
        ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" 
        : "bg-red-600 hover:bg-red-700 focus:ring-red-500";
    const headerBorderClass = type === 'good'
        ? "border-green-300"
        : "border-red-300";

    return (
        <form onSubmit={handleSubmit} className={`mb-8 p-6 bg-white border-2 rounded-none shadow-none ${formThemeClasses}`}>
            <h2 className={`text-2xl font-bold mb-5 ${titleColorClass} border-b-2 pb-3 ${headerBorderClass}`}>
                {isEditMode 
                    ? `Edit ${type === 'good' ? 'Good' : 'Bad'} Habit` 
                    : (type === 'good' ? 'Add New Good Habit' : 'Quit a New Bad Habit')}
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
                    <label htmlFor="times-per-day" className="block text-sm font-medium text-gray-700 mb-1">
                        {type === 'good' ? 'Times per Day' : 'Limit to times per day'}
                    </label>
                    <input
                        type="number"
                        id="times-per-day"
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-base"
                        value={timesPerDay}
                        onChange={(e) => setTimesPerDay(Math.max(type === 'good' ? 1 : 0, parseInt(e.target.value, 10) || (type === 'good' ? 1 : 0)))}
                        min={type === 'good' ? "1" : "0"}
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

            {/* Conditional rendering for Time Taken */}
            {type === 'good' && (
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
                    {/* The other column of the grid will be empty or can be filled as needed for good habits */}
                    <div></div> 
                </div>
            )}

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
                    className={`flex-1 text-white font-semibold py-3 px-4 rounded-sm focus:outline-none focus:ring-1 ${buttonBgClass}`}
                >
                    {isEditMode ? 'Save Changes' : `Add ${type === 'good' ? 'Good' : 'Bad'} Habit`}
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
