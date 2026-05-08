import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    currency:   { type: String, required: true },
    source:     { type: String, default: 'any' },
    fromRate:   { type: Number, required: true },
    toRate:     { type: Number, required: true },
    changePct:  { type: Number, required: true },
    message:    { type: String, default: '' },
    sentEmail:  { type: Boolean, default: false },
    sentSms:    { type: Boolean, default: false },
  },
  { timestamps: true },
);

schema.index({ createdAt: -1 });

export const RateAlertModel = model('RateAlert', schema);
