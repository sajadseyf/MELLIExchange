import { Schema, model, type InferSchemaType } from 'mongoose';

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: {
      type: String,
      required: true,
      enum: ['ring', 'necklace', 'bracelet', 'earring', 'pendant', 'other'],
    },
    karat: { type: Number, required: true, enum: [18, 21, 22, 24] },
    weightGrams: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    inStock: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type ProductDoc = InferSchemaType<typeof productSchema>;
export const ProductModel = model('Product', productSchema);
