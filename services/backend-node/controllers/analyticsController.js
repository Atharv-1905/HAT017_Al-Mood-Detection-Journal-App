const mongoose = require('mongoose');
const EmotionLog = require('../models/EmotionLog');

/**
 * @desc    Get dashboard historical analytics data
 * @route   GET /api/dashboard-analytics
 * @access  Private
 */
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Assume req.user.id is set by auth middleware
    const userId = req.user?.id || 'mocked-user-id-for-testing';
    const { timeframe } = req.query; // 'daily', 'weekly', 'monthly'

    // 1. Determine Date Range based on timeframe
    const now = new Date();
    let startDate = new Date();
    let groupByFormat = '';

    switch (timeframe) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0); // Start of today
        // Group by hour for daily view
        groupByFormat = '%Y-%m-%d %H:00';
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        // Group by day for weekly view
        groupByFormat = '%Y-%m-%d';
        break;
      case 'monthly':
      default:
        startDate.setDate(now.getDate() - 30);
        // Group by day for monthly view
        groupByFormat = '%Y-%m-%d';
        break;
    }

    const matchStage = {
      $match: {
        created_at: { $gte: startDate.toISOString(), $lte: now.toISOString() },
        user_id: userId,
      },
    };

    // 2. Aggregate Wellness Index over time (Line Chart)
    const wellnessTrend = await EmotionLog.aggregate([
      matchStage,
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: { $dateFromString: { dateString: '$created_at' } } } },
          averageWellness: { $avg: '$wellness_index' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          time: '$_id',
          wellness: { $round: ['$averageWellness', 1] },
        },
      },
    ]);

    // 3. Aggregate Emotion Frequencies (Bar Chart)
    const emotionFrequency = await EmotionLog.aggregate([
      matchStage,
      {
        $group: {
          _id: '$emotion',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: '$count',
        },
      },
    ]);

    // 4. Return formatted data for Recharts
    res.status(200).json({
      success: true,
      timeframe: timeframe || 'monthly',
      lineData: wellnessTrend,
      barData: emotionFrequency,
    });
  } catch (error) {
    console.error('Dashboard Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving analytics.',
      error: error.message,
    });
  }
};
