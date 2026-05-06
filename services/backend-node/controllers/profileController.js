const mongoose = require('mongoose');
const User = require('../models/User');
const JournalLog = require('../models/JournalLog');

/**
 * @desc    Get user profile data and journal history
 * @route   GET /api/user-profile/history
 * @access  Private
 */
exports.getUserProfileHistory = async (req, res) => {
  try {
    const userId = req.user?.id || 'mocked-user-id-for-testing';

    // 1. Fetch User Profile (exclude sensitive data)
    let userQuery = {};
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userQuery._id = new mongoose.Types.ObjectId(userId);
    } else {
      userQuery._id = userId; // Fallback for mocking
    }

    const userProfile = await User.findOne(userQuery).select('-passwordHash -__v');
    
    if (!userProfile && mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    // 2. Fetch Recent Journal Logs (Limit 10)
    // We already store the emotion analysis data (emotion, risk_level, wellness_index) 
    // inside the JournalLog schema, so we don't necessarily need a complex $lookup 
    // unless they are completely separated. Based on the python architecture, 
    // journal_logs save this data together.
    const matchQuery = { user_id: userId };

    const recentJournals = await JournalLog.find(matchQuery)
      .sort({ created_at: -1 }) // Newest first
      .limit(10)
      .select('title content emotion risk_level wellness_index created_at confidence sentiment');

    // 3. Map to clean DTO
    const historyPayload = recentJournals.map(journal => ({
      id: journal._id,
      date: journal.created_at,
      text: journal.content.substring(0, 150) + (journal.content.length > 150 ? '...' : ''), // Snippet
      fullText: journal.content,
      emotion: journal.emotion,
      wellness: journal.wellness_index,
      riskLevel: journal.risk_level,
      confidence: journal.confidence || 0,
      sentiment: journal.sentiment || 0,
    }));

    // 4. Return Combined Payload
    res.status(200).json({
      success: true,
      profile: userProfile || { firstName: 'Mock', lastName: 'User', interests: [], freeTimeActivities: [] },
      history: historyPayload,
    });
  } catch (error) {
    console.error('User Profile History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving profile and history.',
      error: error.message,
    });
  }
};
