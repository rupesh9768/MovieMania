// ====================================
// Health Check Routes
// ====================================
import express from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Check if backend is running
 */
router.get('/', getHealth);

export default router;
