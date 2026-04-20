import express from "express";
import { createVendor,getVendor } from "../controllers/vendor.controllers.js";

const router = express.Router();

// ✅ clean API
router.post("/create", createVendor);
router.get("/get",getVendor);
export default router;