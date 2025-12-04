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

interface SuggestCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryCategories: string[];
}

interface CategorySuggestion {
  type: 'primary' | 'subcategory';
  parentCategory?: string;
  suggestedName: string;
  reason: string;
  submitterEmail?: string;
}

export function SuggestCategoryModal({
  open,
  onOpenChange,
  primaryCategories,
}: SuggestCategoryModalProps) {
  const [suggestionType, setSuggestionType] = useState<'primary' | 'subcategory'>('subcategory');
  const [parentCategory, setParentCategory] = useState<string>('');
  const [suggestedName, setSuggestedName] = useState('');
  const [reason, setReason] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!suggestedName.trim() || !reason.trim()) return;
    if (suggestionType === 'subcategory' && !parentCategory) return;

    setSubmitting(true);

    const suggestion: CategorySuggestion = {
      type: suggestionType,
      parentCategory: suggestionType === 'subcategory' ? parentCategory : undefined,
      suggestedName: suggestedName.trim(),
      reason: reason.trim(),
      submitterEmail: submitterEmail.trim() || undefined,
    };

    // For now, store in localStorage as a simple solution
    // In production, this would be sent to a backend endpoint
    try {
      const existingSuggestions = JSON.parse(localStorage.getItem('categorySuggestions') || '[]');
      existingSuggestions.push({
        ...suggestion,
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem('categorySuggestions', JSON.stringify(existingSuggestions));
      
      // TODO: In production, send to backend API
      // await post('/api/v1/reference/category-suggestions', suggestion);
      
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setSuggestionType('subcategory');
    setParentCategory('');
    setSuggestedName('');
    setReason('');
    setSubmitterEmail('');
    setSubmitted(false);
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
            <div className="text-green-600 text-lg font-medium mb-2">
              Thank you for your suggestion!
            </div>
            <p className="text-sm text-gray-500">
              Our team will review your suggestion and may add it to our category list.
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
                  onValueChange={(value: 'primary' | 'subcategory') => setSuggestionType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subcategory">New Subcategory</SelectItem>
                    <SelectItem value="primary">New Primary Category</SelectItem>
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
                  Suggested {suggestionType === 'primary' ? 'Category' : 'Subcategory'} Name
                </Label>
                <Input
                  id="suggested-name"
                  value={suggestedName}
                  onChange={(e) => setSuggestedName(e.target.value)}
                  placeholder={suggestionType === 'primary' ? 'e.g., Education and Learning' : 'e.g., Solar Cookers'}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reason">Why should we add this?</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this category would be useful and what types of assets it would include..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Your Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  placeholder="We'll notify you if your suggestion is approved"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !suggestedName.trim() || !reason.trim() || (suggestionType === 'subcategory' && !parentCategory)}
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
