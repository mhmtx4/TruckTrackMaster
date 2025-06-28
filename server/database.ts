import mongoose from 'mongoose';
import { Tir, Document, ShareLink } from '@shared/schema';

// TIR Schema
const tirSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  plate: { type: String, default: '' },
  trailerPlate: { type: String, default: '' },
  location: { type: String, default: '' },
  lastUpdated: { type: Date, default: Date.now },
});

// Document Schema
const documentSchema = new mongoose.Schema({
  tirId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { 
    type: String, 
    enum: ['T1', 'CMR', 'Invoice', 'Doctor', 'TurkishInvoice', 'Other'],
    default: 'Other'
  },
  cloudinaryUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  fileSize: { type: Number },
  mimeType: { type: String },
});

// Share Link Schema
const shareLinkSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['tir', 'list'], 
    required: true 
  },
  tirId: { type: String },
  token: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  expiryDate: { type: Date },
  lastAccessed: { type: Date },
  accessCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Models
export const TirModel = mongoose.model('Tir', tirSchema);
export const DocumentModel = mongoose.model('Document', documentSchema);
export const ShareLinkModel = mongoose.model('ShareLink', shareLinkSchema);

// Database connection
export async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}