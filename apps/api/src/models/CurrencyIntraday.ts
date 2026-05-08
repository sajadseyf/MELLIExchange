import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    code:       { type: String, required: true, uppercase: true, trim: true },
    buy:        { type: Number, required: true },
    sell:       { type: Number, required: true },
    middle:     { type: Number },
    recordedAt: { type: Date, required: true },
  },
  { timestamps: false, versionKey: false },
);

schema.index({ code: 1, recordedAt: -1 });
schema.index({ code: 1, recordedAt: 1 }, { unique: true });
// Auto-delete records older than 90 days
schema.index({ recordedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const CurrencyIntradayModel = model('CurrencyIntraday', schema);
