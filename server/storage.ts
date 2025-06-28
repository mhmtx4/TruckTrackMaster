import { Tir, InsertTir, Document, InsertDocument, ShareLink, InsertShareLink, TirWithDocuments, DocumentsByType } from "@shared/schema";
import { nanoid } from "nanoid";
import { MongoStorage } from "./mongo-storage";
import { connectDatabase } from "./database";

export interface IStorage {
  // TIR operations
  getTir(id: string): Promise<Tir | undefined>;
  getAllTirs(): Promise<Tir[]>;
  createTir(tir: InsertTir): Promise<Tir>;
  updateTir(id: string, tir: Partial<InsertTir>): Promise<Tir | undefined>;
  deleteTir(id: string): Promise<boolean>;
  getTirWithDocuments(id: string): Promise<TirWithDocuments | undefined>;
  
  // Document operations
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByTirId(tirId: string): Promise<Document[]>;
  getDocumentsByType(tirId: string): Promise<DocumentsByType>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;
  deleteDocumentsByTirId(tirId: string): Promise<boolean>;
  
  // Share link operations
  getShareLink(token: string): Promise<ShareLink | undefined>;
  getShareLinksByType(type: "tir" | "list"): Promise<ShareLink[]>;
  createShareLink(shareLink: InsertShareLink): Promise<ShareLink>;
  updateShareLink(id: string, shareLink: Partial<InsertShareLink>): Promise<ShareLink | undefined>;
  deleteShareLink(id: string): Promise<boolean>;
  recordAccess(token: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private tirs: Map<string, Tir> = new Map();
  private documents: Map<string, Document> = new Map();
  private shareLinks: Map<string, ShareLink> = new Map();

  // TIR operations
  async getTir(id: string): Promise<Tir | undefined> {
    return this.tirs.get(id);
  }

  async getAllTirs(): Promise<Tir[]> {
    return Array.from(this.tirs.values()).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  async createTir(tir: InsertTir): Promise<Tir> {
    const id = nanoid();
    const newTir: Tir = {
      ...tir,
      id,
      lastUpdated: new Date(),
    };
    this.tirs.set(id, newTir);
    return newTir;
  }

  async updateTir(id: string, tirUpdate: Partial<InsertTir>): Promise<Tir | undefined> {
    const existingTir = this.tirs.get(id);
    if (!existingTir) return undefined;

    const updatedTir: Tir = {
      ...existingTir,
      ...tirUpdate,
      lastUpdated: new Date(),
    };
    this.tirs.set(id, updatedTir);
    return updatedTir;
  }

  async deleteTir(id: string): Promise<boolean> {
    const deleted = this.tirs.delete(id);
    if (deleted) {
      // Also delete associated documents and share links
      await this.deleteDocumentsByTirId(id);
      // Delete TIR-specific share links
      for (const [linkId, shareLink] of this.shareLinks.entries()) {
        if (shareLink.type === "tir" && shareLink.tirId === id) {
          this.shareLinks.delete(linkId);
        }
      }
    }
    return deleted;
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
    return this.documents.get(id);
  }

  async getDocumentsByTirId(tirId: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.tirId === tirId)
      .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
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
    const id = nanoid();
    const newDocument: Document = {
      ...document,
      id,
      uploadDate: new Date(),
    };
    this.documents.set(id, newDocument);
    
    // Update TIR lastUpdated
    const tir = this.tirs.get(document.tirId);
    if (tir) {
      tir.lastUpdated = new Date();
      this.tirs.set(document.tirId, tir);
    }
    
    return newDocument;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const document = this.documents.get(id);
    if (!document) return false;

    const deleted = this.documents.delete(id);
    
    if (deleted) {
      // Update TIR lastUpdated
      const tir = this.tirs.get(document.tirId);
      if (tir) {
        tir.lastUpdated = new Date();
        this.tirs.set(document.tirId, tir);
      }
    }
    
    return deleted;
  }

  async deleteDocumentsByTirId(tirId: string): Promise<boolean> {
    const documents = await this.getDocumentsByTirId(tirId);
    for (const doc of documents) {
      this.documents.delete(doc.id);
    }
    return true;
  }

  // Share link operations
  async getShareLink(token: string): Promise<ShareLink | undefined> {
    return Array.from(this.shareLinks.values()).find(link => link.token === token);
  }

  async getShareLinksByType(type: "tir" | "list"): Promise<ShareLink[]> {
    return Array.from(this.shareLinks.values()).filter(link => link.type === type);
  }

  async createShareLink(shareLink: InsertShareLink): Promise<ShareLink> {
    const id = nanoid();
    const newShareLink: ShareLink = {
      ...shareLink,
      id,
      createdAt: new Date(),
      accessCount: 0,
    };
    this.shareLinks.set(id, newShareLink);
    return newShareLink;
  }

  async updateShareLink(id: string, shareLinkUpdate: Partial<InsertShareLink>): Promise<ShareLink | undefined> {
    const existingLink = this.shareLinks.get(id);
    if (!existingLink) return undefined;

    const updatedLink: ShareLink = {
      ...existingLink,
      ...shareLinkUpdate,
    };
    this.shareLinks.set(id, updatedLink);
    return updatedLink;
  }

  async deleteShareLink(id: string): Promise<boolean> {
    return this.shareLinks.delete(id);
  }

  async recordAccess(token: string): Promise<void> {
    const shareLink = await this.getShareLink(token);
    if (shareLink) {
      shareLink.lastAccessed = new Date();
      shareLink.accessCount++;
      this.shareLinks.set(shareLink.id, shareLink);
    }
  }
}

// Initialize storage with MongoDB
async function createStorage(): Promise<IStorage> {
  try {
    await connectDatabase();
    console.log('Using MongoDB storage');
    return new MongoStorage();
  } catch (error) {
    console.error('MongoDB connection failed, falling back to memory storage:', error);
    return new MemStorage();
  }
}

export let storage: IStorage = new MemStorage(); // Default to memory storage

// Initialize storage
createStorage().then(storageInstance => {
  storage = storageInstance;
}).catch(error => {
  console.error('Storage initialization failed:', error);
});
