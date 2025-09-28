// client/src/components/CategorySelector.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { generateCategoryAssets, getPredefinedCategories, validateCategoryName, getIconSuggestions } from '@/utils/iconGenerator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Wand2 } from 'lucide-react';

interface Category {
  id?: number;
  name: string;
  color: string;
  icon: string;
  isCustom?: boolean;
}

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  onColorChange?: (color: string) => void;
  onIconChange?: (icon: string) => void;
  disabled?: boolean;
}

export function CategorySelector({ 
  value, 
  onChange, 
  onColorChange, 
  onIconChange, 
  disabled = false 
}: CategorySelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#6366F1');
  const [customIcon, setCustomIcon] = useState('fas fa-star');
  const [iconSuggestions, setIconSuggestions] = useState<string[]>([]);

  // Fetch custom categories
  const { data: customCategories = [] } = useQuery<Category[]>({
    queryKey: ['/api/custom-categories'],
    queryFn: async () => {
      const response = await apiRequest('custom-categories', 'GET');
      const data = await response.json();
      return data.categories?.map((cat: any) => ({ ...cat, isCustom: true })) || [];
    },
    enabled: !!user,
  });

  // Create custom category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { name: string; color: string; icon: string }) => {
      const response = await apiRequest('custom-categories', 'POST', categoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-categories'] });
      toast({ title: 'Success', description: 'Custom category created successfully!' });
      setShowCustomModal(false);
      setCustomName('');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create custom category', variant: 'destructive' });
    },
  });

  // Get all available categories (predefined + custom)
  const allCategories = [
    ...getPredefinedCategories().map(cat => ({ ...cat, isCustom: false })),
    ...customCategories,
  ];

  // Find current category (unused for now)
  // const currentCategory = allCategories.find(cat => cat.name === value);

  // Generate icon suggestions when custom name changes
  useEffect(() => {
    if (customName.trim()) {
      const suggestions = getIconSuggestions(customName);
      setIconSuggestions(suggestions);
      
      // Auto-generate assets
      const assets = generateCategoryAssets(customName);
      setCustomColor(assets.color);
      setCustomIcon(assets.icon);
    }
  }, [customName]);

  const handleCategorySelect = (category: Category) => {
    onChange(category.name);
    onColorChange?.(category.color);
    onIconChange?.(category.icon);
  };

  const handleCreateCustom = () => {
    const validation = validateCategoryName(customName);
    if (!validation.isValid) {
      toast({ title: 'Invalid Name', description: validation.message, variant: 'destructive' });
      return;
    }

    createCategoryMutation.mutate({
      name: customName,
      color: customColor,
      icon: customIcon,
    });
  };

  const predefinedColors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#6366F1', '#EC4899', '#F59E0B',
    '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#A855F7', '#6B7280'
  ];

  return (
    <div className="space-y-4">
      <Label>Category</Label>
      
      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {allCategories.map((category) => (
          <Card
            key={category.name}
            className={`cursor-pointer transition-all hover:shadow-md ${
              value === category.name 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => !disabled && handleCategorySelect(category)}
          >
            <CardContent className="p-3 text-center">
              <div 
                className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white"
                style={{ backgroundColor: category.color }}
              >
                <i className={`${category.icon} text-sm`}></i>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {category.name}
              </div>
              {category.isCustom && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Custom
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
        
        {/* Add Custom Category Button */}
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:bg-gray-50 border-dashed border-2 border-gray-300"
          onClick={() => !disabled && setShowCustomModal(true)}
        >
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center bg-gray-100 text-gray-500">
              <Plus className="w-4 h-4" />
            </div>
            <div className="text-xs font-medium text-gray-500">
              Add Custom
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Category Modal */}
      <Dialog open={showCustomModal} onOpenChange={setShowCustomModal}>
        <DialogContent className="sm:max-w-md w-[95vw] max-w-[95vw] mx-2 sm:mx-0 p-4 sm:p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle>Create Custom Category</DialogTitle>
            <DialogDescription>
              Create a personalized category for your habits
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., Workout, Study, Meditation"
                maxLength={50}
              />
            </div>

            {/* Auto-generated Preview */}
            {customName.trim() && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: customColor }}
                  >
                    <i className={`${customIcon} text-lg`}></i>
                  </div>
                  <div>
                    <div className="font-medium">{customName}</div>
                    <div className="text-sm text-gray-500">
                      Auto-generated from name
                    </div>
                  </div>
                  <Wand2 className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            )}

            {/* Icon Suggestions */}
            {iconSuggestions.length > 0 && (
              <div className="space-y-2">
                <Label>Suggested Icons</Label>
                <div className="flex flex-wrap gap-2">
                  {iconSuggestions.map((icon, index) => (
                    <Button
                      key={index}
                      variant={customIcon === icon ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCustomIcon(icon)}
                      className="h-8 w-8 p-0"
                    >
                      <i className={icon}></i>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      customColor === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCustomColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCustomModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCustom}
                disabled={!customName.trim() || createCategoryMutation.isPending}
                className="flex-1"
              >
                {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
