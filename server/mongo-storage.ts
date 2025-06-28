import { TirModel, DocumentModel, ShareLinkModel } from './database';
import { Tir, InsertTir, Document, InsertDocument, ShareLink, InsertShareLink, TirWithDocuments, DocumentsByType } from "@shared/schema";
import { IStorage } from './storage';
import { nanoid } from "nanoid";

export class MongoStorage implements IStorage {
  
  // TIR operations
  async getTir(id: string): Promise<Tir | undefined> {
    const tir = await TirModel.findById(id).exec();
    return tir ? this.mongoToTir(tir) : undefined;
  }

  async getAllTirs(): Promise<Tir[]> {
    const tirs = await TirModel.find().sort({ lastUpdated: -1 }).exec();
    return tirs.map(tir => this.mongoToTir(tir));
  }

  async createTir(tir: InsertTir): Promise<Tir> {
    const newTir = new TirModel({
      ...tir,
      lastUpdated: new Date(),
    });
    const savedTir = await newTir.save();
    return this.mongoToTir(savedTir);
  }

  async updateTir(id: string, tirUpdate: Partial<InsertTir>): Promise<Tir | undefined> {
    const updatedTir = await TirModel.findByIdAndUpdate(
      id,
      { ...tirUpdate, lastUpdated: new Date() },
      { new: true }
    ).exec();
    return updatedTir ? this.mongoToTir(updatedTir) : undefined;
  }

  async deleteTir(id: string): Promise<boolean> {
    // Delete associated documents and share links first
    await DocumentModel.deleteMany({ tirId: id }).exec();
    await ShareLinkModel.deleteMany({ type: 'tir', tirId: id }).exec();
    
    const result = await TirModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async getTirWithDocuments(id: string): Promise<TirWithDocuments | undefined> {
    const tir = await this.getTir(id);
    if (!tir) return undefined;

    const documents = await this.getDocumentsByTirId(id);
    return {
      ...tir,
      documents,
      documentCount: documents.length,
    };
  }

  // Document operations
  async getDocument(id: string): Promise<Document | undefined> {
    const doc = await DocumentModel.findById(id).exec();
    return doc ? this.mongoToDocument(doc) : undefined;
  }

  async getDocumentsByTirId(tirId: string): Promise<Document[]> {
    const documents = await DocumentModel.find({ tirId }).sort({ uploadDate: -1 }).exec();
    return documents.map(doc => this.mongoToDocument(doc));
  }

  async getDocumentsByType(tirId: string): Promise<DocumentsByType> {
    const documents = await this.getDocumentsByTirId(tirId);
    
    return {
      T1: documents.filter(doc => doc.fileType === "T1"),
      CMR: documents.filter(doc => doc.fileType === "CMR"),
      Invoice: documents.filter(doc => doc.fileType === "Invoice"),
      Doctor: documents.filter(doc => doc.fileType === "Doctor"),
      TurkishInvoice: documents.filter(doc => doc.fileType === "TurkishInvoice"),
      Other: documents.filter(doc => doc.fileType === "Other"),
    };
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const newDocument = new DocumentModel({
      ...document,
      uploadDate: new Date(),
    });
    const savedDocument = await newDocument.save();
    
    // Update TIR lastUpdated
    await TirModel.findByIdAndUpdate(document.tirId, { lastUpdated: new Date() });
    
    return this.mongoToDocument(savedDocument);
  }

  async deleteDocument(id: string): Promise<boolean> {
    const document = await DocumentModel.findById(id).exec();
    if (!document) return false;

    await DocumentModel.findByIdAndDelete(id).exec();
    
    // Update TIR lastUpdated
    await TirModel.findByIdAndUpdate(document.tirId, { lastUpdated: new Date() });
    
    return true;
  }

  async deleteDocumentsByTirId(tirId: string): Promise<boolean> {
    await DocumentModel.deleteMany({ tirId }).exec();
    return true;
  }

  // Share link operations
  async getShareLink(token: string): Promise<ShareLink | undefined> {
    const shareLink = await ShareLinkModel.findOne({ token }).exec();
    return shareLink ? this.mongoToShareLink(shareLink) : undefined;
  }

  async getShareLinksByType(type: "tir" | "list"): Promise<ShareLink[]> {
    const shareLinks = await ShareLinkModel.find({ type }).exec();
    return shareLinks.map(link => this.mongoToShareLink(link));
  }

  async createShareLink(shareLink: InsertShareLink): Promise<ShareLink> {
    const newShareLink = new ShareLinkModel({
      ...shareLink,
      createdAt: new Date(),
      accessCount: 0,
    });
    const savedShareLink = await newShareLink.save();
    return this.mongoToShareLink(savedShareLink);
  }

  async updateShareLink(id: string, shareLinkUpdate: Partial<InsertShareLink>): Promise<ShareLink | undefined> {
    const updatedLink = await ShareLinkModel.findByIdAndUpdate(
      id,
      shareLinkUpdate,
      { new: true }
    ).exec();
    return updatedLink ? this.mongoToShareLink(updatedLink) : undefined;
  }

  async deleteShareLink(id: string): Promise<boolean> {
    const result = await ShareLinkModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async recordAccess(token: string): Promise<void> {
    await ShareLinkModel.findOneAndUpdate(
      { token },
      { 
        lastAccessed: new Date(),
        $inc: { accessCount: 1 }
      }
    ).exec();
  }

  // Helper methods to convert MongoDB documents to our types
  private mongoToTir(mongoTir: any): Tir {
    return {
      id: mongoTir._id.toString(),
      phone: mongoTir.phone,
      plate: mongoTir.plate,
      trailerPlate: mongoTir.trailerPlate,
      location: mongoTir.location,
      lastUpdated: mongoTir.lastUpdated,
      shareActive: false,
      shareToken: undefined,
      shareExpiry: undefined,
    };
  }

  private mongoToDocument(mongoDoc: any): Document {
    return {
      id: mongoDoc._id.toString(),
      tirId: mongoDoc.tirId,
      fileName: mongoDoc.fileName,
      fileType: mongoDoc.fileType,
      cloudinaryUrl: mongoDoc.cloudinaryUrl,
      cloudinaryPublicId: mongoDoc.cloudinaryPublicId,
      uploadDate: mongoDoc.uploadDate,
      fileSize: mongoDoc.fileSize,
      mimeType: mongoDoc.mimeType,
    };
  }

  private mongoToShareLink(mongoLink: any): ShareLink {
    return {
      id: mongoLink._id.toString(),
      type: mongoLink.type,
      tirId: mongoLink.tirId,
      token: mongoLink.token,
      active: mongoLink.active,
      expiryDate: mongoLink.expiryDate,
      lastAccessed: mongoLink.lastAccessed,
      accessCount: mongoLink.accessCount,
      createdAt: mongoLink.createdAt,
    };
  }
}