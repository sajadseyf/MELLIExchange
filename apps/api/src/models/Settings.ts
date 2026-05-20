import mongoose, { Schema, model, type Model } from 'mongoose';
const { models } = mongoose;

export type CurrencySource =
  | 'vanex_scrape'
  | 'vbce_scrape'
  | 'bank_of_canada'
  | 'frankfurter'
  | 'open_er_api'
  | 'open_exchange_rates'
  | 'currency_api';

export type GoldSource = 'kitco' | 'yahoo_finance' | 'metals_api' | 'gold_api';

const schema = new Schema(
  {
    currencySource: { type: String, default: 'vanex_scrape' },
    goldSource:     { type: String, default: 'yahoo_finance' },
    spread:         { type: Number, default: 1.5 }, // percentage — e.g. 1.5 = ±1.5%
    apiKeys: {
      open_exchange_rates: { type: String, default: '' },
      currency_api:        { type: String, default: '' },
      metals_api:          { type: String, default: '' },
      gold_api:            { type: String, default: '' },
    },
    alerts: {
      enabled:       { type: Boolean, default: false },
      email:         { type: String, default: '' },
      phone:         { type: String, default: '' },
      thresholdPct:  { type: Number, default: 0.5 },
      smtpHost:      { type: String, default: '' },
      smtpPort:      { type: Number, default: 587 },
      smtpUser:      { type: String, default: '' },
      smtpPass:      { type: String, default: '' },
      twilioSid:     { type: String, default: '' },
      twilioToken:   { type: String, default: '' },
      twilioFrom:    { type: String, default: '' },
    },
  },
  { timestamps: true },
);

export const SettingsModel = (models['Settings'] as Model<any>) ?? model('Settings', schema);

export async function getSettings() {
  const doc = await SettingsModel.findOne().lean();
  if (doc) return doc;
  const created = await SettingsModel.create({});
  return created.toObject();
}
