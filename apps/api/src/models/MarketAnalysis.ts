import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    title:       { en: String, fa: String },
    content:     { en: String, fa: String },
    publishedAt: { type: Date, default: () => new Date() },
    sources:     { type: [String], default: [] },
    model:       { type: String, default: '' },
  },
  { timestamps: true },
);

schema.index({ publishedAt: -1 });

export const MarketAnalysisModel = model('MarketAnalysis', schema);
