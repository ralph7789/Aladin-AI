import type { Document } from 'mongoose';

export interface ILicense extends Document {
  name: string;
  models: string[];
  features: string[];
  maxChats: number;
  createdAt: Date;
  updatedAt: Date;
}
