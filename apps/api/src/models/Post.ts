import { Schema, model, models, type Model } from 'mongoose';

const translationSchema = new Schema(
  { title: String, excerpt: String, content: String },
  { _id: false },
);

const postSchema = new Schema(
  {
    title:      { type: String, required: true, trim: true },
    slug:       { type: String, required: true, trim: true, unique: true, lowercase: true },
    excerpt:    { type: String, default: '', trim: true },
    content:    { type: String, default: '', trim: true },
    coverImage: { type: String, default: '' },
    tags:       { type: [String], default: [] },
    published:    { type: Boolean, default: false },
    publishedAt:  { type: Date },
    externalId:   { type: String, default: '' },
    translations: {
      fa: { type: translationSchema, default: null },
      zh: { type: translationSchema, default: null },
    },
  },
  { timestamps: true },
);

postSchema.index({ published: 1, publishedAt: -1 });

export const PostModel = (models['Post'] as Model<any>) ?? model('Post', postSchema);
