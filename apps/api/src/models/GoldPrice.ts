import { Schema, model, type InferSchemaType } from 'mongoose';

const goldPriceSchema = new Schema(
  {
    karat: { type: Number, required: true, unique: true, enum: [10, 14, 18, 22, 24] },
    pricePerGram: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export type GoldPriceDoc = InferSchemaType<typeof goldPriceSchema>;
export const GoldPriceModel = model('GoldPrice', goldPriceSchema);
