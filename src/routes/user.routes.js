import { Router } from 'express';
import userController from "../controllers/user.controller.js";
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes (no authentication required)
router.post('/register', userController.register);
router.post('/login', userController.login);

// Apply authentication middleware to all routes below this point
router.use(authenticateToken);

// Protected routes that require authentication
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUserById);
router.get('/:id/stats', userController.getUserStats);
router.put('/:id', userController.updateUser);
router.patch('/:id/password', userController.changePassword);

// Admin-only routes
router.get('/', authorizeRole(['admin']), userController.getAllUsers);
router.delete('/:id', authorizeRole(['admin']), userController.deleteUser);
router.patch('/:id/role', authorizeRole(['admin']), userController.changeUserRole);
router.patch('/:id/activate', authorizeRole(['admin']), userController.activateUser);
router.patch('/:id/deactivate', authorizeRole(['admin']), userController.deactivateUser);

export default router;
