import { Schema, model, type InferSchemaType } from 'mongoose';

const goldPriceHistorySchema = new Schema({
  karat:        { type: Number, required: true, enum: [14, 18, 22, 24] },
  pricePerGram: { type: Number, required: true, min: 0 },
  recordedAt:   { type: Date,   required: true, index: true },
});

goldPriceHistorySchema.index({ karat: 1, recordedAt: 1 }, { unique: true });

export type GoldPriceHistoryDoc = InferSchemaType<typeof goldPriceHistorySchema>;
export const GoldPriceHistoryModel = model('GoldPriceHistory', goldPriceHistorySchema);
