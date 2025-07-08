const express = require("express");
const legalDocumentsRouter = express.Router();
const upload = require("../middleware/upload"); // المسار حسب مكان ملف upload.js

const {
  createLegalDocuments,
  getAllLegalDocuments,
  getLegalDocumentById,
  updateLegalDocumentById,
  deleteLegalDocumentById,
  searchLegalDocuments,
  bulkUploadLegalDocuments,
} = require("../controllers/legal_documents");

const authentication = require("../middleware/authentication");

// POST مع رفع ملفات PDF متعددة (اسم المفتاح "documents")
legalDocumentsRouter.post(
  "/",
  authentication,
  upload.array("documents", 10), // 10 هو الحد الأقصى لعدد الملفات
  createLegalDocuments
);

legalDocumentsRouter.get("/", authentication, getAllLegalDocuments);
legalDocumentsRouter.get("/:id", authentication, getLegalDocumentById);
legalDocumentsRouter.put(
  "/:id",
  authentication,
  upload.array("documents", 10),
  updateLegalDocumentById
);

legalDocumentsRouter.put(
  "/delete/:id",
  authentication,
  deleteLegalDocumentById
);

legalDocumentsRouter.post(
  "/bulk_upload",
  authentication,
  bulkUploadLegalDocuments
);

legalDocumentsRouter.get("/search/:q", authentication, searchLegalDocuments);

module.exports = legalDocumentsRouter;
