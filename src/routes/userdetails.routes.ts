import express from "express";
import {
  createUserDetails,
  getUserDetails,
} from "$/controllers/userdetails.controller.js";

const router = express.Router();

// ✅ POST (save data)
router.post("/userdetails", createUserDetails);

// ✅ GET (fetch data)
router.get("/userdetails", getUserDetails);

export default router;