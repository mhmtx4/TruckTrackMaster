import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTirSchema, insertDocumentSchema, insertShareLinkSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY || "demo",
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.SECRET_KEY || "demo",
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Sadece PDF ve resim dosyaları (JPG, JPEG, PNG) yüklenebilir."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // TIR Routes
  
  // Get all TIRs
  app.get("/api/tirs", async (req, res) => {
    try {
      const tirs = await storage.getAllTirs();
      const tirsWithCounts = await Promise.all(
        tirs.map(async (tir) => {
          const documents = await storage.getDocumentsByTirId(tir.id);
          return {
            ...tir,
            documentCount: documents.length,
          };
        })
      );
      res.json(tirsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "TIR listesi alınırken hata oluştu" });
    }
  });

  // Get TIR by ID with documents
  app.get("/api/tirs/:id", async (req, res) => {
    try {
      const tirWithDocs = await storage.getTirWithDocuments(req.params.id);
      if (!tirWithDocs) {
        return res.status(404).json({ message: "TIR bulunamadı" });
      }
      
      const documentsByType = await storage.getDocumentsByType(req.params.id);
      res.json({ ...tirWithDocs, documentsByType });
    } catch (error) {
      res.status(500).json({ message: "TIR bilgileri alınırken hata oluştu" });
    }
  });

  // Create new TIR
  app.post("/api/tirs", async (req, res) => {
    try {
      const result = insertTirSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Geçersiz TIR bilgileri", errors: result.error.errors });
      }

      const tir = await storage.createTir(result.data);
      res.status(201).json(tir);
    } catch (error) {
      res.status(500).json({ message: "TIR oluşturulurken hata oluştu" });
    }
  });

  // Update TIR
  app.patch("/api/tirs/:id", async (req, res) => {
    try {
      const result = insertTirSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Geçersiz TIR bilgileri", errors: result.error.errors });
      }

      const updatedTir = await storage.updateTir(req.params.id, result.data);
      if (!updatedTir) {
        return res.status(404).json({ message: "TIR bulunamadı" });
      }

      res.json(updatedTir);
    } catch (error) {
      res.status(500).json({ message: "TIR güncellenirken hata oluştu" });
    }
  });

  // Delete TIR
  app.delete("/api/tirs/:id", async (req, res) => {
    try {
      // Get all documents for this TIR to delete from Cloudinary
      const documents = await storage.getDocumentsByTirId(req.params.id);
      
      // Delete documents from Cloudinary
      for (const doc of documents) {
        try {
          await cloudinary.uploader.destroy(doc.cloudinaryPublicId);
        } catch (cloudinaryError) {
          console.error("Cloudinary'den dosya silinirken hata:", cloudinaryError);
        }
      }

      // Delete TIR (this also deletes associated documents and share links)
      const deleted = await storage.deleteTir(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "TIR bulunamadı" });
      }

      res.json({ message: "TIR başarıyla silindi" });
    } catch (error) {
      res.status(500).json({ message: "TIR silinirken hata oluştu" });
    }
  });

  // Document Routes
  
  // Upload document
  app.post("/api/tirs/:tirId/documents", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Dosya gereklidir" });
      }

      const tir = await storage.getTir(req.params.tirId);
      if (!tir) {
        return res.status(404).json({ message: "TIR bulunamadı" });
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "gmi-tir-documents",
            public_id: `${req.params.tirId}_${nanoid()}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file!.buffer);
      }) as any;

      const documentData = {
        tirId: req.params.tirId,
        fileName: req.file.originalname,
        fileType: (req.body.fileType as any) || "Other",
        cloudinaryUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      };

      const result = insertDocumentSchema.safeParse(documentData);
      if (!result.success) {
        // If validation fails, clean up the uploaded file
        await cloudinary.uploader.destroy(uploadResult.public_id);
        return res.status(400).json({ message: "Geçersiz belge bilgileri", errors: result.error.errors });
      }

      const document = await storage.createDocument(result.data);
      res.status(201).json(document);
    } catch (error) {
      console.error("Belge yüklenirken hata:", error);
      res.status(500).json({ message: "Belge yüklenirken hata oluştu" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Belge bulunamadı" });
      }

      // Delete from Cloudinary
      try {
        await cloudinary.uploader.destroy(document.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary'den dosya silinirken hata:", cloudinaryError);
      }

      // Delete from storage
      const deleted = await storage.deleteDocument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Belge bulunamadı" });
      }

      res.json({ message: "Belge başarıyla silindi" });
    } catch (error) {
      res.status(500).json({ message: "Belge silinirken hata oluştu" });
    }
  });

  // Share Link Routes
  
  // Create share link for TIR
  app.post("/api/tirs/:id/share", async (req, res) => {
    try {
      const tir = await storage.getTir(req.params.id);
      if (!tir) {
        return res.status(404).json({ message: "TIR bulunamadı" });
      }

      const shareLink = await storage.createShareLink({
        type: "tir",
        tirId: req.params.id,
        token: nanoid(32),
        active: true,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
      });

      res.status(201).json(shareLink);
    } catch (error) {
      res.status(500).json({ message: "Paylaşım linki oluşturulurken hata oluştu" });
    }
  });

  // Create share link for TIR list
  app.post("/api/share/list", async (req, res) => {
    try {
      const shareLink = await storage.createShareLink({
        type: "list",
        token: nanoid(32),
        active: true,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
      });

      res.status(201).json(shareLink);
    } catch (error) {
      res.status(500).json({ message: "Liste paylaşım linki oluşturulurken hata oluştu" });
    }
  });

  // Get share links
  app.get("/api/share/:type", async (req, res) => {
    try {
      const type = req.params.type as "tir" | "list";
      const shareLinks = await storage.getShareLinksByType(type);
      res.json(shareLinks);
    } catch (error) {
      res.status(500).json({ message: "Paylaşım linkleri alınırken hata oluştu" });
    }
  });

  // Update share link
  app.patch("/api/share/:id", async (req, res) => {
    try {
      const updatedLink = await storage.updateShareLink(req.params.id, req.body);
      if (!updatedLink) {
        return res.status(404).json({ message: "Paylaşım linki bulunamadı" });
      }
      res.json(updatedLink);
    } catch (error) {
      res.status(500).json({ message: "Paylaşım linki güncellenirken hata oluştu" });
    }
  });

  // Public Routes (for shared links)
  
  // Get TIR by share token
  app.get("/api/public/tir/:token", async (req, res) => {
    try {
      const shareLink = await storage.getShareLink(req.params.token);
      
      if (!shareLink || !shareLink.active || shareLink.type !== "tir") {
        return res.status(404).json({ message: "Geçersiz veya pasif paylaşım linki" });
      }

      if (shareLink.expiryDate && shareLink.expiryDate < new Date()) {
        return res.status(404).json({ message: "Paylaşım linkinin süresi dolmuş" });
      }

      if (!shareLink.tirId) {
        return res.status(404).json({ message: "TIR ID bulunamadı" });
      }

      const tirWithDocs = await storage.getTirWithDocuments(shareLink.tirId);
      if (!tirWithDocs) {
        return res.status(404).json({ message: "TIR bulunamadı" });
      }

      const documentsByType = await storage.getDocumentsByType(shareLink.tirId);
      
      // Record access
      await storage.recordAccess(req.params.token);

      res.json({ ...tirWithDocs, documentsByType });
    } catch (error) {
      res.status(500).json({ message: "Paylaşılan TIR bilgileri alınırken hata oluştu" });
    }
  });

  // Get TIR list by share token
  app.get("/api/public/list/:token", async (req, res) => {
    try {
      const shareLink = await storage.getShareLink(req.params.token);
      
      if (!shareLink || !shareLink.active || shareLink.type !== "list") {
        return res.status(404).json({ message: "Geçersiz veya pasif paylaşım linki" });
      }

      if (shareLink.expiryDate && shareLink.expiryDate < new Date()) {
        return res.status(404).json({ message: "Paylaşım linkinin süresi dolmuş" });
      }

      const tirs = await storage.getAllTirs();
      const publicTirs = tirs.map(tir => ({
        id: tir.id,
        phone: tir.phone,
        plate: tir.plate,
        location: tir.location,
        lastUpdated: tir.lastUpdated,
      }));

      // Record access
      await storage.recordAccess(req.params.token);

      res.json(publicTirs);
    } catch (error) {
      res.status(500).json({ message: "Paylaşılan TIR listesi alınırken hata oluştu" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
