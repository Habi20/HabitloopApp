// server/routes/customCategoryRoutes.ts
import express from 'express';
import { requireAuth } from './middlewareRoutes';
import { storage } from '../storage';
import { z } from 'zod';

const router = express.Router();

// Schema for custom category validation
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Category name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  icon: z.string().min(1, 'Icon is required'),
});

const updateCategorySchema = createCategorySchema.partial();

// Get user's custom categories
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const categories = await storage.getCustomCategories(userId);
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching custom categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch custom categories' });
  }
});

// Create new custom category
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = createCategorySchema.parse(req.body);
    
    const category = await storage.createCustomCategory({
      userId,
      name: validatedData.name,
      color: validatedData.color,
      icon: validatedData.icon,
    });

    res.json({ success: true, category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error creating custom category:', error);
    res.status(500).json({ success: false, error: 'Failed to create custom category' });
  }
});

// Update custom category
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ success: false, error: 'Invalid category ID' });
    }

    const validatedData = updateCategorySchema.parse(req.body);
    
    const category = await storage.updateCustomCategory(categoryId, validatedData);
    res.json({ success: true, category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error updating custom category:', error);
    res.status(500).json({ success: false, error: 'Failed to update custom category' });
  }
});

// Delete custom category
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ success: false, error: 'Invalid category ID' });
    }

    const deleted = await storage.deleteCustomCategory(categoryId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom category:', error);
    res.status(500).json({ success: false, error: 'Failed to delete custom category' });
  }
});

export default router;
