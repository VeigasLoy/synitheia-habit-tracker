    import React, { useMemo } from 'react';
    import {
        Chart as ChartJS,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        Filler // <-- IMPORT THE FILLER PLUGIN HERE
    } from 'chart.js';
    import { Line } from 'react-chartjs-2';
    import { getTodayDateString, getDatesInRange } from '../utils/dateUtils';

    // Register Chart.js components needed for a Line chart
    // Make sure to register Filler as well!
    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        Filler // <-- REGISTER THE FILLER PLUGIN HERE
    );

    const ChartComponent = ({ checkins }) => {
        const today = getTodayDateString();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // Go back 29 days to include today for 30 total
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        // Generate an array of date strings for the last 30 days
        const dates = useMemo(() => getDatesInRange(startDate, today), [startDate, today]);

        // Prepare chart data based on check-ins
        const data = useMemo(() => {
            const checkinMap = new Map();
            checkins.forEach(c => {
                if (c.status === 'completed') {
                    checkinMap.set(c.date, true); // Mark date as checked in
                }
            });

            // Map dates to 1 (checked in) or 0 (missed) for the chart
            const chartData = dates.map(date => checkinMap.has(date) ? 1 : 0);

            return {
                // Labels for the X-axis (dates)
                labels: dates.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Daily Check-ins', // Label for the dataset
                        data: chartData,
                        borderColor: 'rgb(59, 130, 246)', // Tailwind blue-500
                        backgroundColor: 'rgba(59, 130, 246, 0.5)', // Filled area color
                        tension: 0.3, // Smoothness of the line
                        pointRadius: 3, // Size of data points
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        fill: true, // This requires the Filler plugin!
                    },
                ],
            };
        }, [checkins, dates]); // Recalculate if checkins or dates change

        // Chart options for appearance and interactivity
        const options = {
            responsive: true,
            maintainAspectRatio: false, // Allows flexible height/width
            plugins: {
                legend: {
                    display: false, // Hide the legend for a single dataset
                },
                title: {
                    display: true,
                    text: 'Last 30 Days Progress',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#374151' // Tailwind gray-700
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.raw === 1 ? 'Checked In' : 'Missed';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false, // Hide vertical grid lines
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 7 // Show fewer ticks on x-axis for readability
                    }
                },
                y: {
                    min: 0,
                    max: 1, // Values are either 0 or 1
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return value === 1 ? 'Done' : 'Missed'; // Custom labels for Y-axis
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)' // Light horizontal grid lines
                    }
                },
            },
        };

        return (
            <div className="relative h-48 w-full"> {/* Fixed height for the chart container */}
                <Line data={data} options={options} />
            </div>
        );
    };

    export default ChartComponent;
    