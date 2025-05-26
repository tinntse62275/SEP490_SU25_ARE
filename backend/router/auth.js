import express from 'express';
import { login, register, verifynormal, googleAuth } from '../controllers/authController.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router()

router.post('/login', login)
router.post('/verify', verifyUser, verifynormal)
router.post('/register', register)

router.post("/google", googleAuth)
export default router;