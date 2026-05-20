import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';
const { models } = mongoose;

const currencySchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, trim: true },
    flag: { type: String, default: '' },
    buy: { type: Number, required: true, min: 0 },
    sell: { type: Number, required: true, min: 0 },
    order:     { type: Number, default: 0 },
    contactUs: { type: Boolean, default: false },
    hidden:    { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type CurrencyDoc = InferSchemaType<typeof currencySchema>;
export const CurrencyModel = (models['Currency'] as Model<CurrencyDoc>) ?? model('Currency', currencySchema);
