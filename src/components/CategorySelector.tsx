import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { getCategories } from '@/api/reference';
import { CategoryDefinition, CategorySelection } from '@/types/asset';

// Color mapping for category badges (TailwindCSS classes)
const CATEGORY_COLORS: Record<string, string> = {
  'Shelter and Buildings': 'bg-amber-100 text-amber-800 border-amber-200',
  'Energy and Heat': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Water, Air and Climate': 'bg-blue-100 text-blue-800 border-blue-200',
  'Food Systems and Agriculture': 'bg-green-100 text-green-800 border-green-200',
  'Waste, Recycling and Bioprocessing': 'bg-purple-100 text-purple-800 border-purple-200',
  'Tools, Fabrication and Manufacturing': 'bg-gray-100 text-gray-800 border-gray-200',
  'Mobility and Transport': 'bg-red-100 text-red-800 border-red-200',
  'Household and Personal Items': 'bg-pink-100 text-pink-800 border-pink-200',
  'Health, Sanitation and Care': 'bg-teal-100 text-teal-800 border-teal-200',
};

interface CategorySelectorProps {
  value: CategorySelection[];
  onChange: (categories: CategorySelection[]) => void;
  maxCategories?: number;
  minCategories?: number;
  showSuggestLink?: boolean;
  onSuggestCategory?: () => void;
}

export function CategorySelector({
  value = [],
  onChange,
  maxCategories = 4,
  minCategories = 1,
  showSuggestLink = true,
  onSuggestCategory,
}: CategorySelectorProps) {
  const [categoryDefinitions, setCategoryDefinitions] = useState<CategoryDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await getCategories();
        setCategoryDefinitions(response.categories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  // Initialize expanded state for selected categories
  useEffect(() => {
    const selectedPrimaries = new Set(value.map(v => v.primary));
    setExpandedCategories(selectedPrimaries);
  }, []);

  const isPrimarySelected = (primary: string) => {
    return value.some(v => v.primary === primary);
  };

  const getSelectedSubcategories = (primary: string): string[] => {
    const selection = value.find(v => v.primary === primary);
    return selection?.subcategories || [];
  };

  const togglePrimaryCategory = (primary: string) => {
    if (isPrimarySelected(primary)) {
      // Remove this primary category
      const newValue = value.filter(v => v.primary !== primary);
      onChange(newValue);
      // Collapse the category
      const newExpanded = new Set(expandedCategories);
      newExpanded.delete(primary);
      setExpandedCategories(newExpanded);
    } else {
      // Add this primary category (if under max)
      if (value.length < maxCategories) {
        const newValue = [...value, { primary, subcategories: [] }];
        onChange(newValue);
        // Expand the category to show subcategories
        const newExpanded = new Set(expandedCategories);
        newExpanded.add(primary);
        setExpandedCategories(newExpanded);
      }
    }
  };

  const toggleSubcategory = (primary: string, subcategory: string) => {
    const existingSelection = value.find(v => v.primary === primary);
    if (!existingSelection) return;

    const currentSubs = existingSelection.subcategories || [];
    let newSubs: string[];
    
    if (currentSubs.includes(subcategory)) {
      newSubs = currentSubs.filter(s => s !== subcategory);
    } else {
      newSubs = [...currentSubs, subcategory];
    }

    const newValue = value.map(v => 
      v.primary === primary ? { ...v, subcategories: newSubs } : v
    );
    onChange(newValue);
  };

  const toggleExpanded = (primary: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(primary)) {
      newExpanded.delete(primary);
    } else {
      newExpanded.add(primary);
    }
    setExpandedCategories(newExpanded);
  };

  const removeCategory = (primary: string) => {
    const newValue = value.filter(v => v.primary !== primary);
    onChange(newValue);
  };

  const removeSubcategory = (primary: string, subcategory: string) => {
    const newValue = value.map(v => {
      if (v.primary === primary) {
        return {
          ...v,
          subcategories: (v.subcategories || []).filter(s => s !== subcategory)
        };
      }
      return v;
    });
    onChange(newValue);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading categories...</div>;
  }

  const selectedCount = value.length;
  const canAddMore = selectedCount < maxCategories;

  return (
    <div className="space-y-4">
      {/* Selected categories summary */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected Categories ({selectedCount}/{maxCategories})</Label>
          <div className="flex flex-wrap gap-2">
            {value.map(selection => (
              <div key={selection.primary} className="space-y-1">
                <Badge 
                  className={`${CATEGORY_COLORS[selection.primary] || 'bg-gray-100 text-gray-800'} cursor-pointer`}
                  onClick={() => removeCategory(selection.primary)}
                >
                  {selection.primary}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
                {selection.subcategories && selection.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-2">
                    {selection.subcategories.map(sub => (
                      <Badge 
                        key={sub} 
                        variant="outline" 
                        className="text-xs cursor-pointer"
                        onClick={() => removeSubcategory(selection.primary, sub)}
                      >
                        {sub}
                        <X className="ml-1 h-2 w-2" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation message */}
      {selectedCount < minCategories && (
        <p className="text-sm text-red-500">
          Please select at least {minCategories} category{minCategories > 1 ? 'ies' : ''}
        </p>
      )}
      {selectedCount >= maxCategories && (
        <p className="text-sm text-amber-600">
          Maximum {maxCategories} categories selected
        </p>
      )}

      {/* Category selection grid */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Available Categories</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryDefinitions.map(category => {
            const isSelected = isPrimarySelected(category.primary);
            const isExpanded = expandedCategories.has(category.primary);
            const selectedSubs = getSelectedSubcategories(category.primary);
            const colorClass = CATEGORY_COLORS[category.primary] || 'bg-gray-50';

            return (
              <div 
                key={category.primary} 
                className={`border rounded-lg p-3 ${isSelected ? colorClass : 'bg-white'} transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category.primary}`}
                      checked={isSelected}
                      onCheckedChange={() => togglePrimaryCategory(category.primary)}
                      disabled={!isSelected && !canAddMore}
                    />
                    <Label 
                      htmlFor={`cat-${category.primary}`}
                      className={`text-sm font-medium cursor-pointer ${!isSelected && !canAddMore ? 'text-gray-400' : ''}`}
                    >
                      {category.primary}
                    </Label>
                  </div>
                  {isSelected && category.subcategories.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleExpanded(category.primary)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Subcategories */}
                {isSelected && isExpanded && category.subcategories.length > 0 && (
                  <div className="mt-3 pl-6 space-y-2 border-t pt-2">
                    <p className="text-xs text-gray-500 mb-2">Select subcategories (optional):</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {category.subcategories.map(sub => (
                        <div key={sub} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sub-${category.primary}-${sub}`}
                            checked={selectedSubs.includes(sub)}
                            onCheckedChange={() => toggleSubcategory(category.primary, sub)}
                          />
                          <Label 
                            htmlFor={`sub-${category.primary}-${sub}`}
                            className="text-xs cursor-pointer"
                          >
                            {sub}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggest new category link */}
      {showSuggestLink && (
        <div className="pt-2 border-t">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto"
            onClick={onSuggestCategory}
          >
            <Plus className="h-3 w-3 mr-1" />
            Suggest a new category
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper component to display category badges (for asset cards and detail pages)
interface CategoryBadgesProps {
  categories?: CategorySelection[];
  maxVisible?: number;
  showSubcategories?: boolean;
  size?: 'sm' | 'md';
}

export function CategoryBadges({ 
  categories = [], 
  maxVisible = 3, 
  showSubcategories = false,
  size = 'sm'
}: CategoryBadgesProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const visibleCategories = categories.slice(0, maxVisible);
  const hiddenCount = categories.length - maxVisible;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex flex-wrap gap-1">
      {visibleCategories.map(cat => (
        <div key={cat.primary} className="flex flex-col gap-0.5">
          <Badge 
            className={`${CATEGORY_COLORS[cat.primary] || 'bg-gray-100 text-gray-800'} ${textSize}`}
          >
            {cat.primary}
          </Badge>
          {showSubcategories && cat.subcategories && cat.subcategories.length > 0 && (
            <div className="flex flex-wrap gap-0.5 ml-1">
              {cat.subcategories.map(sub => (
                <Badge key={sub} variant="outline" className="text-xs py-0">
                  {sub}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="secondary" className={textSize}>
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
}

// Export color mapping for use in other components
export { CATEGORY_COLORS };
