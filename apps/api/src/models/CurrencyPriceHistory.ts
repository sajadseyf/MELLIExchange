import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';
const { models } = mongoose;

const currencyPriceHistorySchema = new Schema({
  code:       { type: String, required: true, uppercase: true },
  buy:        { type: Number, required: true, min: 0 },
  sell:       { type: Number, required: true, min: 0 },
  recordedAt: { type: Date,   required: true, index: true },
});

currencyPriceHistorySchema.index({ code: 1, recordedAt: 1 }, { unique: true });

export type CurrencyPriceHistoryDoc = InferSchemaType<typeof currencyPriceHistorySchema>;
export const CurrencyPriceHistoryModel = (models['CurrencyPriceHistory'] as Model<CurrencyPriceHistoryDoc>) ?? model('CurrencyPriceHistory', currencyPriceHistorySchema);
