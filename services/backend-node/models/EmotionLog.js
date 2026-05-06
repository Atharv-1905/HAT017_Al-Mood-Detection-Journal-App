const mongoose = require('mongoose');

const emotionLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    text_snippet: {
      type: String,
      default: '',
    },
    emotion: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
    },
    sentiment: {
      type: Number,
      required: true,
    },
    wellness_index: {
      type: Number,
      required: true,
    },
    risk_level: {
      type: String,
      required: true,
    },
    trigger_intervention: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      default: 'live_analysis',
    },
    created_at: {
      type: String,
    },
  },
  {
    collection: 'emotion_logs'
  }
);

module.exports = mongoose.model('EmotionLog', emotionLogSchema);
