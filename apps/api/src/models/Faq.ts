import { Schema, model } from 'mongoose';

const localeText = {
  fa: { type: String, default: '' },
  en: { type: String, default: '' },
  zh: { type: String, default: '' },
};

const schema = new Schema(
  {
    question: localeText,
    answer:   localeText,
    order:    { type: Number, default: 0 },
    active:   { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const FaqModel = model('Faq', schema);
