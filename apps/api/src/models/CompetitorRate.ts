import { Schema, model, models, type Model } from 'mongoose';

const rateEntrySchema = new Schema(
  { code: String, buy: Number, sell: Number },
  { _id: false },
);

const schema = new Schema(
  {
    source:     { type: String, required: true, enum: ['vanex', 'arzsina', 'vbce', 'daniel'] },
    recordedAt: { type: Date, required: true },
    rates:      { type: [rateEntrySchema], default: [] },
  },
  { timestamps: true },
);

schema.index({ source: 1, recordedAt: -1 });

export const CompetitorRateModel = (models['CompetitorRate'] as Model<any>) ?? model('CompetitorRate', schema);
