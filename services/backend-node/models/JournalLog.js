const mongoose = require('mongoose');

const journalLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Untitled Entry',
    },
    content: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    emotion: {
      type: String,
      default: 'neutral',
    },
    confidence: {
      type: Number,
      default: 0.0,
    },
    sentiment: {
      type: Number,
      default: 0.0,
    },
    wellness_index: {
      type: Number,
      default: 50,
    },
    risk_level: {
      type: String,
      default: 'none',
    },
    created_at: {
      type: String,
    },
  },
  {
    collection: 'journal_logs'
  }
);

module.exports = mongoose.model('JournalLog', journalLogSchema);
