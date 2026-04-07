import express from "express";
import {
  createQuotation,
  getQuotations,
  updateQuotation,
} from "../controllers/quotationController.js";

const router = express.Router();

// දත්ත ලබා ගැනීමට (GET)
router.get("/", getQuotations);

// දත්ත ඇතුළත් කිරීමට (POST)
router.post("/", createQuotation);

// දත්ත වෙනස් කිරීමට (PUT)
router.put("/:id", updateQuotation);

export default router;
