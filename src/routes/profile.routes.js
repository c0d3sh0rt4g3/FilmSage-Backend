import { Router } from 'express';
import profileController from '../controllers/profile.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.post('/', profileController.createProfile);
router.get('/', profileController.getAllProfiles);
router.get('/search', profileController.searchProfiles);
router.get('/user/:userId', profileController.getProfileByUserId);
router.get('/user/:userId/stats', profileController.getProfileStats);
router.get('/:id', profileController.getProfileById);
router.put('/user/:userId', profileController.updateProfile);
router.delete('/user/:userId', profileController.deleteProfile);

export default router;
