import { z } from "zod";

// TIR Profile Schema
export const tirSchema = z.object({
  id: z.string(),
  phone: z.string().min(1, "Telefon numarası gereklidir"),
  plate: z.string().optional(),
  trailerPlate: z.string().optional(),
  location: z.string().optional(),
  lastUpdated: z.date(),
  shareToken: z.string().optional(),
  shareActive: z.boolean().default(false),
  shareExpiry: z.date().optional(),
});

export const insertTirSchema = tirSchema.omit({ id: true, lastUpdated: true });

export type Tir = z.infer<typeof tirSchema>;
export type InsertTir = z.infer<typeof insertTirSchema>;

// Document Schema
export const documentSchema = z.object({
  id: z.string(),
  tirId: z.string(),
  fileName: z.string(),
  fileType: z.enum(["T1", "CMR", "Invoice", "Doctor", "TurkishInvoice", "Other"]).default("Other"),
  cloudinaryUrl: z.string(),
  cloudinaryPublicId: z.string(),
  uploadDate: z.date(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

export const insertDocumentSchema = documentSchema.omit({ id: true, uploadDate: true });

export type Document = z.infer<typeof documentSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// Share Link Schema
export const shareLinkSchema = z.object({
  id: z.string(),
  type: z.enum(["tir", "list"]),
  tirId: z.string().optional(), // Only for tir type
  token: z.string(),
  active: z.boolean().default(true),
  expiryDate: z.date().optional(),
  lastAccessed: z.date().optional(),
  accessCount: z.number().default(0),
  createdAt: z.date(),
});

export const insertShareLinkSchema = shareLinkSchema.omit({ id: true, createdAt: true, lastAccessed: true, accessCount: true });

export type ShareLink = z.infer<typeof shareLinkSchema>;
export type InsertShareLink = z.infer<typeof insertShareLinkSchema>;

// API Response Types
export type TirWithDocuments = Tir & {
  documents: Document[];
  documentCount: number;
};

export type DocumentsByType = {
  T1: Document[];
  CMR: Document[];
  Invoice: Document[];
  Doctor: Document[];
  TurkishInvoice: Document[];
  Other: Document[];
};
