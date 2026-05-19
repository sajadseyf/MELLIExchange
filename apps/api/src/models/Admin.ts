import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export type AdminDoc = InferSchemaType<typeof adminSchema>;
export const AdminModel = (models['Admin'] as Model<AdminDoc>) ?? model('Admin', adminSchema);
