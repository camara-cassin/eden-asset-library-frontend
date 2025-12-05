import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createSuggestion } from '@/api/category-suggestions';

interface SuggestCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryCategories: string[];
}

export function SuggestCategoryModal({
  open,
  onOpenChange,
  primaryCategories,
}: SuggestCategoryModalProps) {
  const [suggestionType, setSuggestionType] = useState<'primary_category' | 'subcategory'>('subcategory');
  const [parentCategory, setParentCategory] = useState<string>('');
  const [suggestedName, setSuggestedName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!suggestedName.trim() || !reason.trim()) return;
    if (suggestionType === 'subcategory' && !parentCategory) return;
    if (suggestedName.trim().length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createSuggestion({
        suggestion_type: suggestionType,
        primary_category: suggestionType === 'subcategory' ? parentCategory : undefined,
        suggested_name: suggestedName.trim(),
        reason: reason.trim(),
      });
      
      setSubmitted(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit suggestion';
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuggestionType('subcategory');
    setParentCategory('');
    setSuggestedName('');
    setReason('');
    setSubmitted(false);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Suggest a New Category</DialogTitle>
          <DialogDescription>
            Help us improve our category system by suggesting new categories or subcategories.
            Your suggestion will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center">
            <div className="text-green-600 text-5xl mb-4">&#10003;</div>
            <div className="text-green-600 text-lg font-medium mb-2">
              Suggestion Submitted!
            </div>
            <p className="text-sm text-gray-500">
              Your suggestion "{suggestedName}" has been sent to the EDEN admin team for review.
            </p>
            <Button className="mt-4" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="suggestion-type">What would you like to suggest?</Label>
                <Select
                  value={suggestionType}
                  onValueChange={(value: 'primary_category' | 'subcategory') => setSuggestionType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subcategory">New Subcategory</SelectItem>
                    <SelectItem value="primary_category">New Primary Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {suggestionType === 'subcategory' && (
                <div className="grid gap-2">
                  <Label htmlFor="parent-category">Parent Category</Label>
                  <Select value={parentCategory} onValueChange={setParentCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a primary category" />
                    </SelectTrigger>
                    <SelectContent>
                      {primaryCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="suggested-name">
                  {suggestionType === 'primary_category' ? 'Category' : 'Subcategory'} Name *
                </Label>
                <Input
                  id="suggested-name"
                  value={suggestedName}
                  onChange={(e) => setSuggestedName(e.target.value)}
                  placeholder={suggestionType === 'primary_category' ? 'e.g., Community Governance Systems' : 'e.g., Tidal Energy Systems'}
                  minLength={3}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">3-100 characters</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reason">Why is this {suggestionType === 'primary_category' ? 'category' : 'subcategory'} needed? *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this addition would be valuable to the EDEN ecosystem..."
                  rows={4}
                  minLength={10}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">{reason.length}/500 characters (minimum 10)</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || suggestedName.trim().length < 3 || reason.trim().length < 10 || (suggestionType === 'subcategory' && !parentCategory)}
              >
                {submitting ? 'Submitting...' : 'Submit Suggestion'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
