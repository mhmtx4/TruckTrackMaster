// server/index.ts
import express2 from "express";

// server/routes.ts
import dotenv2 from "dotenv";
import { createServer } from "http";

// server/storage.ts
import { nanoid } from "nanoid";

// server/database.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
var tirSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  plate: { type: String, default: "" },
  trailerPlate: { type: String, default: "" },
  location: { type: String, default: "" },
  lastUpdated: { type: Date, default: Date.now }
});
var documentSchema = new mongoose.Schema({
  tirId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: {
    type: String,
    enum: ["T1", "CMR", "Invoice", "Doctor", "TurkishInvoice", "Other"],
    default: "Other"
  },
  cloudinaryUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  fileSize: { type: Number },
  mimeType: { type: String }
});
var shareLinkSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["tir", "list"],
    required: true
  },
  tirId: { type: String },
  token: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  expiryDate: { type: Date },
  lastAccessed: { type: Date },
  accessCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
var TirModel = mongoose.model("Tir", tirSchema);
var DocumentModel = mongoose.model("Document", documentSchema);
var ShareLinkModel = mongoose.model("ShareLink", shareLinkSchema);
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://mxhmet:meh332211@truckdb.ji3rbus.mongodb.net/?retryWrites=true&w=majority&appName=truckdb";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// server/mongo-storage.ts
var MongoStorage = class {
  // TIR operations
  async getTir(id) {
    const tir = await TirModel.findById(id).exec();
    return tir ? this.mongoToTir(tir) : void 0;
  }
  async getAllTirs() {
    const tirs = await TirModel.find().sort({ lastUpdated: -1 }).exec();
    return tirs.map((tir) => this.mongoToTir(tir));
  }
  async createTir(tir) {
    const newTir = new TirModel({
      ...tir,
      lastUpdated: /* @__PURE__ */ new Date()
    });
    const savedTir = await newTir.save();
    return this.mongoToTir(savedTir);
  }
  async updateTir(id, tirUpdate) {
    const updatedTir = await TirModel.findByIdAndUpdate(
      id,
      { ...tirUpdate, lastUpdated: /* @__PURE__ */ new Date() },
      { new: true }
    ).exec();
    return updatedTir ? this.mongoToTir(updatedTir) : void 0;
  }
  async deleteTir(id) {
    await DocumentModel.deleteMany({ tirId: id }).exec();
    await ShareLinkModel.deleteMany({ type: "tir", tirId: id }).exec();
    const result = await TirModel.findByIdAndDelete(id).exec();
    return !!result;
  }
  async getTirWithDocuments(id) {
    const tir = await this.getTir(id);
    if (!tir) return void 0;
    const documents = await this.getDocumentsByTirId(id);
    return {
      ...tir,
      documents,
      documentCount: documents.length
    };
  }
  // Document operations
  async getDocument(id) {
    const doc = await DocumentModel.findById(id).exec();
    return doc ? this.mongoToDocument(doc) : void 0;
  }
  async getDocumentsByTirId(tirId) {
    const documents = await DocumentModel.find({ tirId }).sort({ uploadDate: -1 }).exec();
    return documents.map((doc) => this.mongoToDocument(doc));
  }
  async getDocumentsByType(tirId) {
    const documents = await this.getDocumentsByTirId(tirId);
    return {
      T1: documents.filter((doc) => doc.fileType === "T1"),
      CMR: documents.filter((doc) => doc.fileType === "CMR"),
      Invoice: documents.filter((doc) => doc.fileType === "Invoice"),
      Doctor: documents.filter((doc) => doc.fileType === "Doctor"),
      TurkishInvoice: documents.filter((doc) => doc.fileType === "TurkishInvoice"),
      Other: documents.filter((doc) => doc.fileType === "Other")
    };
  }
  async createDocument(document) {
    const newDocument = new DocumentModel({
      ...document,
      uploadDate: /* @__PURE__ */ new Date()
    });
    const savedDocument = await newDocument.save();
    await TirModel.findByIdAndUpdate(document.tirId, { lastUpdated: /* @__PURE__ */ new Date() });
    return this.mongoToDocument(savedDocument);
  }
  async deleteDocument(id) {
    const document = await DocumentModel.findById(id).exec();
    if (!document) return false;
    await DocumentModel.findByIdAndDelete(id).exec();
    await TirModel.findByIdAndUpdate(document.tirId, { lastUpdated: /* @__PURE__ */ new Date() });
    return true;
  }
  async deleteDocumentsByTirId(tirId) {
    await DocumentModel.deleteMany({ tirId }).exec();
    return true;
  }
  // Share link operations
  async getShareLink(token) {
    const shareLink = await ShareLinkModel.findOne({ token }).exec();
    return shareLink ? this.mongoToShareLink(shareLink) : void 0;
  }
  async getShareLinksByType(type) {
    const shareLinks = await ShareLinkModel.find({ type }).exec();
    return shareLinks.map((link) => this.mongoToShareLink(link));
  }
  async createShareLink(shareLink) {
    const newShareLink = new ShareLinkModel({
      ...shareLink,
      createdAt: /* @__PURE__ */ new Date(),
      accessCount: 0
    });
    const savedShareLink = await newShareLink.save();
    return this.mongoToShareLink(savedShareLink);
  }
  async updateShareLink(id, shareLinkUpdate) {
    const updatedLink = await ShareLinkModel.findByIdAndUpdate(
      id,
      shareLinkUpdate,
      { new: true }
    ).exec();
    return updatedLink ? this.mongoToShareLink(updatedLink) : void 0;
  }
  async deleteShareLink(id) {
    const result = await ShareLinkModel.findByIdAndDelete(id).exec();
    return !!result;
  }
  async recordAccess(token) {
    await ShareLinkModel.findOneAndUpdate(
      { token },
      {
        lastAccessed: /* @__PURE__ */ new Date(),
        $inc: { accessCount: 1 }
      }
    ).exec();
  }
  // Helper methods to convert MongoDB documents to our types
  mongoToTir(mongoTir) {
    return {
      id: mongoTir._id.toString(),
      phone: mongoTir.phone,
      plate: mongoTir.plate,
      trailerPlate: mongoTir.trailerPlate,
      location: mongoTir.location,
      lastUpdated: mongoTir.lastUpdated,
      shareActive: false,
      shareToken: void 0,
      shareExpiry: void 0
    };
  }
  mongoToDocument(mongoDoc) {
    return {
      id: mongoDoc._id.toString(),
      tirId: mongoDoc.tirId,
      fileName: mongoDoc.fileName,
      fileType: mongoDoc.fileType,
      cloudinaryUrl: mongoDoc.cloudinaryUrl,
      cloudinaryPublicId: mongoDoc.cloudinaryPublicId,
      uploadDate: mongoDoc.uploadDate,
      fileSize: mongoDoc.fileSize,
      mimeType: mongoDoc.mimeType
    };
  }
  mongoToShareLink(mongoLink) {
    return {
      id: mongoLink._id.toString(),
      type: mongoLink.type,
      tirId: mongoLink.tirId,
      token: mongoLink.token,
      active: mongoLink.active,
      expiryDate: mongoLink.expiryDate,
      lastAccessed: mongoLink.lastAccessed,
      accessCount: mongoLink.accessCount,
      createdAt: mongoLink.createdAt
    };
  }
};

// server/storage.ts
var MemStorage = class {
  tirs = /* @__PURE__ */ new Map();
  documents = /* @__PURE__ */ new Map();
  shareLinks = /* @__PURE__ */ new Map();
  // TIR operations
  async getTir(id) {
    return this.tirs.get(id);
  }
  async getAllTirs() {
    return Array.from(this.tirs.values()).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }
  async createTir(tir) {
    const id = nanoid();
    const newTir = {
      ...tir,
      id,
      lastUpdated: /* @__PURE__ */ new Date()
    };
    this.tirs.set(id, newTir);
    return newTir;
  }
  async updateTir(id, tirUpdate) {
    const existingTir = this.tirs.get(id);
    if (!existingTir) return void 0;
    const updatedTir = {
      ...existingTir,
      ...tirUpdate,
      lastUpdated: /* @__PURE__ */ new Date()
    };
    this.tirs.set(id, updatedTir);
    return updatedTir;
  }
  async deleteTir(id) {
    const deleted = this.tirs.delete(id);
    if (deleted) {
      await this.deleteDocumentsByTirId(id);
      for (const [linkId, shareLink] of this.shareLinks.entries()) {
        if (shareLink.type === "tir" && shareLink.tirId === id) {
          this.shareLinks.delete(linkId);
        }
      }
    }
    return deleted;
  }
  async getTirWithDocuments(id) {
    const tir = await this.getTir(id);
    if (!tir) return void 0;
    const documents = await this.getDocumentsByTirId(id);
    return {
      ...tir,
      documents,
      documentCount: documents.length
    };
  }
  // Document operations
  async getDocument(id) {
    return this.documents.get(id);
  }
  async getDocumentsByTirId(tirId) {
    return Array.from(this.documents.values()).filter((doc) => doc.tirId === tirId).sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
  }
  async getDocumentsByType(tirId) {
    const documents = await this.getDocumentsByTirId(tirId);
    return {
      T1: documents.filter((doc) => doc.fileType === "T1"),
      CMR: documents.filter((doc) => doc.fileType === "CMR"),
      Invoice: documents.filter((doc) => doc.fileType === "Invoice"),
      Doctor: documents.filter((doc) => doc.fileType === "Doctor"),
      TurkishInvoice: documents.filter((doc) => doc.fileType === "TurkishInvoice"),
      Other: documents.filter((doc) => doc.fileType === "Other")
    };
  }
  async createDocument(document) {
    const id = nanoid();
    const newDocument = {
      ...document,
      id,
      uploadDate: /* @__PURE__ */ new Date()
    };
    this.documents.set(id, newDocument);
    const tir = this.tirs.get(document.tirId);
    if (tir) {
      tir.lastUpdated = /* @__PURE__ */ new Date();
      this.tirs.set(document.tirId, tir);
    }
    return newDocument;
  }
  async deleteDocument(id) {
    const document = this.documents.get(id);
    if (!document) return false;
    const deleted = this.documents.delete(id);
    if (deleted) {
      const tir = this.tirs.get(document.tirId);
      if (tir) {
        tir.lastUpdated = /* @__PURE__ */ new Date();
        this.tirs.set(document.tirId, tir);
      }
    }
    return deleted;
  }
  async deleteDocumentsByTirId(tirId) {
    const documents = await this.getDocumentsByTirId(tirId);
    for (const doc of documents) {
      this.documents.delete(doc.id);
    }
    return true;
  }
  // Share link operations
  async getShareLink(token) {
    return Array.from(this.shareLinks.values()).find((link) => link.token === token);
  }
  async getShareLinksByType(type) {
    return Array.from(this.shareLinks.values()).filter((link) => link.type === type);
  }
  async createShareLink(shareLink) {
    const id = nanoid();
    const newShareLink = {
      ...shareLink,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      accessCount: 0
    };
    this.shareLinks.set(id, newShareLink);
    return newShareLink;
  }
  async updateShareLink(id, shareLinkUpdate) {
    const existingLink = this.shareLinks.get(id);
    if (!existingLink) return void 0;
    const updatedLink = {
      ...existingLink,
      ...shareLinkUpdate
    };
    this.shareLinks.set(id, updatedLink);
    return updatedLink;
  }
  async deleteShareLink(id) {
    return this.shareLinks.delete(id);
  }
  async recordAccess(token) {
    const shareLink = await this.getShareLink(token);
    if (shareLink) {
      shareLink.lastAccessed = /* @__PURE__ */ new Date();
      shareLink.accessCount++;
      this.shareLinks.set(shareLink.id, shareLink);
    }
  }
};
async function createStorage() {
  try {
    await connectDatabase();
    console.log("Using MongoDB storage");
    return new MongoStorage();
  } catch (error) {
    console.error("MongoDB connection failed, falling back to memory storage:", error);
    return new MemStorage();
  }
}
var storage = new MemStorage();
createStorage().then((storageInstance) => {
  storage = storageInstance;
}).catch((error) => {
  console.error("Storage initialization failed:", error);
});

// shared/schema.ts
import { z } from "zod";
var tirSchema2 = z.object({
  id: z.string(),
  phone: z.string().min(1, "Telefon numaras\u0131 gereklidir"),
  plate: z.string().optional(),
  trailerPlate: z.string().optional(),
  location: z.string().optional(),
  lastUpdated: z.date(),
  shareToken: z.string().optional(),
  shareActive: z.boolean().default(false),
  shareExpiry: z.date().optional()
});
var insertTirSchema = tirSchema2.omit({ id: true, lastUpdated: true });
var documentSchema2 = z.object({
  id: z.string(),
  tirId: z.string(),
  fileName: z.string(),
  fileType: z.enum(["T1", "CMR", "Invoice", "Doctor", "TurkishInvoice", "Other"]).default("Other"),
  cloudinaryUrl: z.string(),
  cloudinaryPublicId: z.string(),
  uploadDate: z.date(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional()
});
var insertDocumentSchema = documentSchema2.omit({ id: true, uploadDate: true });
var shareLinkSchema2 = z.object({
  id: z.string(),
  type: z.enum(["tir", "list"]),
  tirId: z.string().optional(),
  // Only for tir type
  token: z.string(),
  active: z.boolean().default(true),
  expiryDate: z.date().optional(),
  lastAccessed: z.date().optional(),
  accessCount: z.number().default(0),
  createdAt: z.date()
});
var insertShareLinkSchema = shareLinkSchema2.omit({ id: true, createdAt: true, lastAccessed: true, accessCount: true });

// server/routes.ts
import { nanoid as nanoid2 } from "nanoid";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
dotenv2.config();
cloudinary.config({
  cloud_name: "dcpfymulz",
  api_key: "992117663959846",
  api_secret: "Ahqr9myXUnEawqkH6WcjIMLV6Q0"
});
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Sadece PDF ve resim dosyalar\u0131 (JPG, JPEG, PNG) y\xFCklenebilir."));
    }
  }
});
async function registerRoutes(app2) {
  app2.get("/api/tirs", async (req, res) => {
    try {
      const tirs = await storage.getAllTirs();
      const tirsWithCounts = await Promise.all(
        tirs.map(async (tir) => {
          const documents = await storage.getDocumentsByTirId(tir.id);
          return {
            ...tir,
            documentCount: documents.length
          };
        })
      );
      res.json(tirsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "TIR listesi al\u0131n\u0131rken hata olu\u015Ftu" });
    }
  });
  app2.get("/api/tirs/:id", async (req, res) => {
    try {
      const tirWithDocs = await storage.getTirWithDocuments(req.params.id);
      if (!tirWithDocs) {
        return res.status(404).json({ message: "TIR bulunamad\u0131" });
      }
      const documentsByType = await storage.getDocumentsByType(req.params.id);
      res.json({ ...tirWithDocs, documentsByType });
    } catch (error) {
      res.status(500).json({ message: "TIR bilgileri al\u0131n\u0131rken hata olu\u015Ftu" });
    }
  });
  app2.post("/api/tirs", async (req, res) => {
    try {
      const result = insertTirSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Ge\xE7ersiz TIR bilgileri", errors: result.error.errors });
      }
      const tir = await storage.createTir(result.data);
      res.status(201).json(tir);
    } catch (error) {
      res.status(500).json({ message: "TIR olu\u015Fturulurken hata olu\u015Ftu" });
    }
  });
  app2.patch("/api/tirs/:id", async (req, res) => {
    try {
      const result = insertTirSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Ge\xE7ersiz TIR bilgileri", errors: result.error.errors });
      }
      const updatedTir = await storage.updateTir(req.params.id, result.data);
      if (!updatedTir) {
        return res.status(404).json({ message: "TIR bulunamad\u0131" });
      }
      res.json(updatedTir);
    } catch (error) {
      res.status(500).json({ message: "TIR g\xFCncellenirken hata olu\u015Ftu" });
    }
  });
  app2.delete("/api/tirs/:id", async (req, res) => {
    try {
      const documents = await storage.getDocumentsByTirId(req.params.id);
      for (const doc of documents) {
        try {
          await cloudinary.uploader.destroy(doc.cloudinaryPublicId);
        } catch (cloudinaryError) {
          console.error("Cloudinary'den dosya silinirken hata:", cloudinaryError);
        }
      }
      const deleted = await storage.deleteTir(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "TIR bulunamad\u0131" });
      }
      res.json({ message: "TIR ba\u015Far\u0131yla silindi" });
    } catch (error) {
      res.status(500).json({ message: "TIR silinirken hata olu\u015Ftu" });
    }
  });
  app2.post("/api/tirs/:tirId/documents", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Dosya gereklidir" });
      }
      const tir = await storage.getTir(req.params.tirId);
      if (!tir) {
        return res.status(404).json({ message: "TIR bulunamad\u0131" });
      }
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "gmi-tir-documents",
            public_id: `${req.params.tirId}_${nanoid2()}`
          },
          (error, result2) => {
            if (error) reject(error);
            else resolve(result2);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      const documentData = {
        tirId: req.params.tirId,
        fileName: req.file.originalname,
        fileType: req.body.fileType || "Other",
        cloudinaryUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      };
      const result = insertDocumentSchema.safeParse(documentData);
      if (!result.success) {
        await cloudinary.uploader.destroy(uploadResult.public_id);
        return res.status(400).json({ message: "Ge\xE7ersiz belge bilgileri", errors: result.error.errors });
      }
      const document = await storage.createDocument(result.data);
      res.status(201).json(document);
    } catch (error) {
      console.error("Belge y\xFCklenirken hata:", error);
      res.status(500).json({ message: "Belge y\xFCklenirken hata olu\u015Ftu" });
    }
  });
  app2.delete("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Belge bulunamad\u0131" });
      }
      try {
        await cloudinary.uploader.destroy(document.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary'den dosya silinirken hata:", cloudinaryError);
      }
      const deleted = await storage.deleteDocument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Belge bulunamad\u0131" });
      }
      res.json({ message: "Belge ba\u015Far\u0131yla silindi" });
    } catch (error) {
      res.status(500).json({ message: "Belge silinirken hata olu\u015Ftu" });
    }
  });
  app2.post("/api/tirs/:id/share", async (req, res) => {
    try {
      const tir = await storage.getTir(req.params.id);
      if (!tir) {
        return res.status(404).json({ message: "TIR bulunamad\u0131" });
      }
      const shareLink = await storage.createShareLink({
        type: "tir",
        tirId: req.params.id,
        token: nanoid2(32),
        active: true,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : void 0
      });
      res.status(201).json(shareLink);
    } catch (error) {
      res.status(500).json({ message: "Payla\u015F\u0131m linki olu\u015Fturulurken hata olu\u015Ftu" });
    }
  });
  app2.post("/api/share/list", async (req, res) => {
    try {
      const shareLink = await storage.createShareLink({
        type: "list",
        token: nanoid2(32),
        active: true,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : void 0
      });
      res.status(201).json(shareLink);
    } catch (error) {
      res.status(500).json({ message: "Liste payla\u015F\u0131m linki olu\u015Fturulurken hata olu\u015Ftu" });
    }
  });
  app2.get("/api/share/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const shareLinks = await storage.getShareLinksByType(type);
      res.json(shareLinks);
    } catch (error) {
      res.status(500).json({ message: "Payla\u015F\u0131m linkleri al\u0131n\u0131rken hata olu\u015Ftu" });
    }
  });
  app2.patch("/api/share/:id", async (req, res) => {
    try {
      const updatedLink = await storage.updateShareLink(req.params.id, req.body);
      if (!updatedLink) {
        return res.status(404).json({ message: "Payla\u015F\u0131m linki bulunamad\u0131" });
      }
      res.json(updatedLink);
    } catch (error) {
      res.status(500).json({ message: "Payla\u015F\u0131m linki g\xFCncellenirken hata olu\u015Ftu" });
    }
  });
  app2.get("/api/public/tir/:token", async (req, res) => {
    try {
      const shareLink = await storage.getShareLink(req.params.token);
      if (!shareLink || !shareLink.active || shareLink.type !== "tir") {
        return res.status(404).json({ message: "Ge\xE7ersiz veya pasif payla\u015F\u0131m linki" });
      }
      if (shareLink.expiryDate && shareLink.expiryDate < /* @__PURE__ */ new Date()) {
        return res.status(404).json({ message: "Payla\u015F\u0131m linkinin s\xFCresi dolmu\u015F" });
      }
      if (!shareLink.tirId) {
        return res.status(404).json({ message: "TIR ID bulunamad\u0131" });
      }
      const tirWithDocs = await storage.getTirWithDocuments(shareLink.tirId);
      if (!tirWithDocs) {
        return res.status(404).json({ message: "TIR bulunamad\u0131" });
      }
      const documentsByType = await storage.getDocumentsByType(shareLink.tirId);
      await storage.recordAccess(req.params.token);
      res.json({ ...tirWithDocs, documentsByType });
    } catch (error) {
      res.status(500).json({ message: "Payla\u015F\u0131lan TIR bilgileri al\u0131n\u0131rken hata olu\u015Ftu" });
    }
  });
  app2.get("/api/public/list/:token", async (req, res) => {
    try {
      const shareLink = await storage.getShareLink(req.params.token);
      if (!shareLink || !shareLink.active || shareLink.type !== "list") {
        return res.status(404).json({ message: "Ge\xE7ersiz veya pasif payla\u015F\u0131m linki" });
      }
      if (shareLink.expiryDate && shareLink.expiryDate < /* @__PURE__ */ new Date()) {
        return res.status(404).json({ message: "Payla\u015F\u0131m linkinin s\xFCresi dolmu\u015F" });
      }
      const tirs = await storage.getAllTirs();
      const tirShareLinks = await storage.getShareLinksByType("tir");
      const publicTirs = await Promise.all(
        tirs.map(async (tir) => {
          const documents = await storage.getDocumentsByTirId(tir.id);
          const shareLink2 = tirShareLinks.find((link) => link.tirId === tir.id && link.active);
          return {
            id: tir.id,
            phone: tir.phone,
            plate: tir.plate,
            location: tir.location,
            lastUpdated: tir.lastUpdated,
            documentCount: documents.length,
            shareToken: shareLink2?.token
            // Include share token if available
          };
        })
      );
      await storage.recordAccess(req.params.token);
      res.json(publicTirs);
    } catch (error) {
      res.status(500).json({ message: "Payla\u015F\u0131lan TIR listesi al\u0131n\u0131rken hata olu\u015Ftu" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid as nanoid3 } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid3()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  app.listen(5e3, "0.0.0.0", () => {
    console.log("Sunucu \xE7al\u0131\u015F\u0131yor");
  });
  log("Server is running in " + app.get("env") + " mode");
  log("API is available at http://localhost:" + port + "/api");
  log("Client is available at http://localhost:" + port);
  log("Documentation is available at http://localhost:" + port + "/docs");
  log("Share your TIRs at http://localhost:" + port + "/share/tir/:token");
  log("Share your lists at http://localhost:" + port + "/share/list/:token");
})();
