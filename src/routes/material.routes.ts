import express from "express";
import {
  createMaterial,
  getMaterials,
  approveMaterial,
  rejectMaterial
} from "../controllers/material.controller.js";

const router = express.Router();

// ❗ REMOVE /material from here
router.post("/", createMaterial);
router.get("/", getMaterials);

router.put("/:id/approve", approveMaterial);
router.put("/:id/reject", rejectMaterial);

export default router;