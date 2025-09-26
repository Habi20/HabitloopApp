// client/src/utils/iconGenerator.ts
// Icon generator for custom habit categories

// Predefined icon mappings for common category names
const iconMappings: Record<string, string> = {
  // Health & Fitness
  'health': 'fas fa-heart',
  'fitness': 'fas fa-dumbbell',
  'exercise': 'fas fa-running',
  'workout': 'fas fa-dumbbell',
  'gym': 'fas fa-dumbbell',
  'yoga': 'fas fa-om',
  'meditation': 'fas fa-om',
  'sleep': 'fas fa-bed',
  'nutrition': 'fas fa-apple-alt',
  'diet': 'fas fa-apple-alt',
  'water': 'fas fa-tint',
  'hydration': 'fas fa-tint',
  'vitamins': 'fas fa-pills',
  'medicine': 'fas fa-pills',
  'doctor': 'fas fa-user-md',
  'medical': 'fas fa-user-md',

  // Learning & Education
  'learning': 'fas fa-book',
  'education': 'fas fa-graduation-cap',
  'study': 'fas fa-book',
  'reading': 'fas fa-book',
  'writing': 'fas fa-pen',
  'journal': 'fas fa-book-open',
  'language': 'fas fa-language',
  'coding': 'fas fa-code',
  'programming': 'fas fa-code',
  'course': 'fas fa-chalkboard-teacher',
  'skill': 'fas fa-tools',
  'practice': 'fas fa-repeat',

  // Productivity & Work
  'productivity': 'fas fa-laptop',
  'work': 'fas fa-briefcase',
  'office': 'fas fa-building',
  'meeting': 'fas fa-users',
  'email': 'fas fa-envelope',
  'phone': 'fas fa-phone',
  'call': 'fas fa-phone',
  'project': 'fas fa-project-diagram',
  'task': 'fas fa-tasks',
  'goal': 'fas fa-bullseye',
  'planning': 'fas fa-calendar',
  'schedule': 'fas fa-clock',
  'focus': 'fas fa-crosshairs',
  'concentration': 'fas fa-crosshairs',

  // Mindfulness & Mental Health
  'mindfulness': 'fas fa-leaf',
  'mental': 'fas fa-brain',
  'therapy': 'fas fa-heart',
  'counseling': 'fas fa-comments',
  'stress': 'fas fa-heart',
  'anxiety': 'fas fa-heart',
  'depression': 'fas fa-heart',
  'gratitude': 'fas fa-heart',
  'positivity': 'fas fa-smile',
  'happiness': 'fas fa-smile',
  'joy': 'fas fa-smile',
  'peace': 'fas fa-dove',
  'calm': 'fas fa-dove',

  // Social & Relationships
  'social': 'fas fa-users',
  'friends': 'fas fa-user-friends',
  'family': 'fas fa-home',
  'relationship': 'fas fa-heart',
  'dating': 'fas fa-heart',
  'marriage': 'fas fa-ring',
  'community': 'fas fa-users',
  'volunteer': 'fas fa-hands-helping',
  'charity': 'fas fa-hands-helping',
  'help': 'fas fa-hands-helping',
  'support': 'fas fa-hands-helping',

  // Creative & Hobbies
  'creative': 'fas fa-palette',
  'art': 'fas fa-paint-brush',
  'music': 'fas fa-music',
  'singing': 'fas fa-microphone',
  'dancing': 'fas fa-music',
  'drawing': 'fas fa-pencil-alt',
  'painting': 'fas fa-paint-brush',
  'photography': 'fas fa-camera',
  'video': 'fas fa-video',
  'gaming': 'fas fa-gamepad',
  'sports': 'fas fa-futbol',
  'hobby': 'fas fa-puzzle-piece',
  'craft': 'fas fa-tools',

  // Finance & Money
  'finance': 'fas fa-dollar-sign',
  'money': 'fas fa-coins',
  'budget': 'fas fa-calculator',
  'saving': 'fas fa-piggy-bank',
  'investment': 'fas fa-chart-line',
  'trading': 'fas fa-chart-line',
  'banking': 'fas fa-university',
  'debt': 'fas fa-credit-card',
  'expense': 'fas fa-receipt',
  'income': 'fas fa-money-bill-wave',

  // Home & Lifestyle
  'home': 'fas fa-home',
  'cleaning': 'fas fa-broom',
  'cooking': 'fas fa-utensils',
  'baking': 'fas fa-birthday-cake',
  'gardening': 'fas fa-seedling',
  'plants': 'fas fa-leaf',
  'pets': 'fas fa-paw',
  'dog': 'fas fa-dog',
  'cat': 'fas fa-cat',
  'maintenance': 'fas fa-tools',
  'repair': 'fas fa-wrench',
  'organization': 'fas fa-sort',
  'declutter': 'fas fa-trash',

  // Technology & Digital
  'technology': 'fas fa-laptop',
  'digital': 'fas fa-mobile-alt',
  'app': 'fas fa-mobile-alt',
  'software': 'fas fa-desktop',
  'hardware': 'fas fa-microchip',
  'internet': 'fas fa-wifi',
  'social media': 'fas fa-share-alt',
  'blog': 'fas fa-blog',
  'website': 'fas fa-globe',
  'online': 'fas fa-globe',

  // Travel & Adventure
  'travel': 'fas fa-plane',
  'vacation': 'fas fa-umbrella-beach',
  'adventure': 'fas fa-mountain',
  'hiking': 'fas fa-hiking',
  'camping': 'fas fa-campground',
  'road trip': 'fas fa-car',
  'explore': 'fas fa-compass',
  'discover': 'fas fa-search',

  // Spiritual & Religious
  'spiritual': 'fas fa-pray',
  'religious': 'fas fa-church',
  'prayer': 'fas fa-pray',
  'faith': 'fas fa-cross',
  'worship': 'fas fa-church',
  'bible': 'fas fa-book',
  'church': 'fas fa-church',
  'temple': 'fas fa-place-of-worship',

  // Default fallbacks
  'default': 'fas fa-star',
  'misc': 'fas fa-ellipsis-h',
  'other': 'fas fa-ellipsis-h',
  'custom': 'fas fa-plus-circle',
};

// Color suggestions based on category type
const colorSuggestions: Record<string, string[]> = {
  'health': ['#10B981', '#059669', '#047857'], // Green shades
  'fitness': ['#EF4444', '#DC2626', '#B91C1C'], // Red shades
  'learning': ['#3B82F6', '#2563EB', '#1D4ED8'], // Blue shades
  'productivity': ['#8B5CF6', '#7C3AED', '#6D28D9'], // Purple shades
  'mindfulness': ['#06B6D4', '#0891B2', '#0E7490'], // Cyan shades
  'social': ['#EC4899', '#DB2777', '#BE185D'], // Pink shades
  'creative': ['#F59E0B', '#D97706', '#B45309'], // Orange shades
  'finance': ['#84CC16', '#65A30D', '#4D7C0F'], // Lime shades
  'home': ['#F97316', '#EA580C', '#C2410C'], // Orange shades
  'technology': ['#6366F1', '#4F46E5', '#4338CA'], // Indigo shades
  'travel': ['#14B8A6', '#0D9488', '#0F766E'], // Teal shades
  'spiritual': ['#A855F7', '#9333EA', '#7C3AED'], // Purple shades
  'default': ['#6B7280', '#4B5563', '#374151'], // Gray shades
};

// Generate icon for custom category
export function generateIconForCategory(categoryName: string): string {
  if (!categoryName) return iconMappings.default;

  const normalizedName = categoryName.toLowerCase().trim();
  
  // Direct match
  if (iconMappings[normalizedName]) {
    return iconMappings[normalizedName];
  }

  // Partial match - check if category name contains any of the keywords
  for (const [keyword, icon] of Object.entries(iconMappings)) {
    if (normalizedName.includes(keyword) || keyword.includes(normalizedName)) {
      return icon;
    }
  }

  // Word-based matching
  const words = normalizedName.split(/\s+/);
  for (const word of words) {
    if (iconMappings[word]) {
      return iconMappings[word];
    }
  }

  // Fallback to default
  return iconMappings.default;
}

// Generate color for custom category
export function generateColorForCategory(categoryName: string): string {
  if (!categoryName) return colorSuggestions.default[0];

  const normalizedName = categoryName.toLowerCase().trim();
  
  // Direct match
  for (const [categoryType, colors] of Object.entries(colorSuggestions)) {
    if (normalizedName.includes(categoryType)) {
      return colors[0]; // Return the first (primary) color
    }
  }

  // Word-based matching
  const words = normalizedName.split(/\s+/);
  for (const word of words) {
    for (const [categoryType, colors] of Object.entries(colorSuggestions)) {
      if (word.includes(categoryType) || categoryType.includes(word)) {
        return colors[0];
      }
    }
  }

  // Fallback to default
  return colorSuggestions.default[0];
}

// Generate both icon and color for a category
export function generateCategoryAssets(categoryName: string): { icon: string; color: string } {
  return {
    icon: generateIconForCategory(categoryName),
    color: generateColorForCategory(categoryName),
  };
}

// Get all available predefined categories with their assets
export function getPredefinedCategories(): Array<{ name: string; label: string; icon: string; color: string }> {
  return [
    { name: 'Health', label: 'Health & Fitness', icon: 'fas fa-heart', color: '#10B981' },
    { name: 'Productivity', label: 'Productivity', icon: 'fas fa-laptop', color: '#3B82F6' },
    { name: 'Learning', label: 'Learning', icon: 'fas fa-book', color: '#8B5CF6' },
    { name: 'Mindfulness', label: 'Mindfulness', icon: 'fas fa-om', color: '#6366F1' },
    { name: 'Social', label: 'Social', icon: 'fas fa-users', color: '#EC4899' },
    { name: 'Creative', label: 'Creative', icon: 'fas fa-palette', color: '#F59E0B' },
  ];
}

// Validate if a custom category name is appropriate
export function validateCategoryName(name: string): { isValid: boolean; message?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'Category name is required' };
  }

  if (name.length > 50) {
    return { isValid: false, message: 'Category name is too long (max 50 characters)' };
  }

  if (name.length < 2) {
    return { isValid: false, message: 'Category name is too short (min 2 characters)' };
  }

  // Check for inappropriate content (basic validation)
  const inappropriateWords = ['spam', 'test', 'temp', 'delete', 'remove'];
  const normalizedName = name.toLowerCase();
  
  for (const word of inappropriateWords) {
    if (normalizedName.includes(word)) {
      return { isValid: false, message: 'Please choose a more descriptive category name' };
    }
  }

  return { isValid: true };
}

// Get icon suggestions for a category name
export function getIconSuggestions(categoryName: string): string[] {
  const suggestions: string[] = [];
  const normalizedName = categoryName.toLowerCase().trim();
  
  // Get direct matches
  if (iconMappings[normalizedName]) {
    suggestions.push(iconMappings[normalizedName]);
  }

  // Get partial matches
  for (const [keyword, icon] of Object.entries(iconMappings)) {
    if (normalizedName.includes(keyword) && !suggestions.includes(icon)) {
      suggestions.push(icon);
    }
  }

  // Get word-based matches
  const words = normalizedName.split(/\s+/);
  for (const word of words) {
    for (const [keyword, icon] of Object.entries(iconMappings)) {
      if (word.includes(keyword) && !suggestions.includes(icon)) {
        suggestions.push(icon);
      }
    }
  }

  // Add some generic suggestions if we don't have enough
  if (suggestions.length < 3) {
    const genericIcons = ['fas fa-star', 'fas fa-circle', 'fas fa-square', 'fas fa-heart', 'fas fa-check'];
    for (const icon of genericIcons) {
      if (!suggestions.includes(icon)) {
        suggestions.push(icon);
      }
    }
  }

  return suggestions.slice(0, 5); // Return max 5 suggestions
}
