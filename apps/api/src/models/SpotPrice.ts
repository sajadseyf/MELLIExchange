import { Schema, model, models, type Model } from 'mongoose';

const schema = new Schema(
  {
    metal:      { type: String, required: true, enum: ['gold', 'silver'] },
    priceUsd:   { type: Number, required: true },
    priceCad:   { type: Number, default: 0 },
    change24h:  { type: Number, default: 0 }, // percentage
    bid:        { type: Number, default: 0 },
    ask:        { type: Number, default: 0 },
    recordedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

schema.index({ metal: 1, recordedAt: -1 });
schema.index({ recordedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // auto-delete after 7 days

export const SpotPriceModel = (models['SpotPrice'] as Model<any>) ?? model('SpotPrice', schema);
