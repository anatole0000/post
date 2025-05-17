const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: String, // danh mục
  status: { type: String, enum: ['draft', 'published'], default: 'draft' }, // trạng thái
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  approved: { type: Boolean, default: false }
});

// ✅ Đặt index full-text sau khi schema đã được tạo
postSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Post', postSchema);
