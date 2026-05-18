import { Router } from "express";
import { analyzeProject } from "../api/controller.js";
const router = Router();
router.post("/analyze", analyzeProject);
export default router;
