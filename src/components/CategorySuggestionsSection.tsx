import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  getAllSuggestions,
  updateSuggestion,
  deleteSuggestion,
  CategorySuggestion,
  CategorySuggestionListResponse,
} from '@/api/category-suggestions';

interface CategorySuggestionsSectionProps {
  isAdmin: boolean;
}

export function CategorySuggestionsSection({ isAdmin }: CategorySuggestionsSectionProps) {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAdmin) {
      fetchSuggestions();
    }
  }, [isAdmin, statusFilter]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: CategorySuggestionListResponse = await getAllSuggestions(statusFilter);
      setSuggestions(response.suggestions);
      setCounts({
        pending: response.pending_count,
        approved: response.approved_count,
        rejected: response.rejected_count,
      });
    } catch (err) {
      setError('Failed to load suggestions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (suggestionId: string) => {
    setProcessingId(suggestionId);
    try {
      await updateSuggestion(suggestionId, {
        status: 'approved',
        admin_notes: adminNotes[suggestionId] || undefined,
      });
      await fetchSuggestions();
      setAdminNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[suggestionId];
        return newNotes;
      });
    } catch (err) {
      console.error('Failed to approve suggestion:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (suggestionId: string) => {
    setProcessingId(suggestionId);
    try {
      await updateSuggestion(suggestionId, {
        status: 'rejected',
        admin_notes: adminNotes[suggestionId] || undefined,
      });
      await fetchSuggestions();
      setAdminNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[suggestionId];
        return newNotes;
      });
    } catch (err) {
      console.error('Failed to reject suggestion:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (suggestionId: string) => {
    if (!confirm('Are you sure you want to delete this suggestion?')) return;
    setProcessingId(suggestionId);
    try {
      await deleteSuggestion(suggestionId);
      await fetchSuggestions();
    } catch (err) {
      console.error('Failed to delete suggestion:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Category Suggestions</h2>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            Pending ({counts.pending})
          </Button>
          <Button
            variant={statusFilter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('approved')}
          >
            Approved ({counts.approved})
          </Button>
          <Button
            variant={statusFilter === 'rejected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected ({counts.rejected})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading suggestions...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No {statusFilter} suggestions found.
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map(suggestion => (
            <div
              key={suggestion.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">{suggestion.suggested_name}</span>
                    {getStatusBadge(suggestion.status)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {suggestion.suggestion_type === 'primary_category' ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                        New Primary Category
                      </span>
                    ) : (
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
                        Subcategory for: {suggestion.primary_category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500 text-right">
                  <div>Submitted: {formatDate(suggestion.created_at)}</div>
                  <div>By: {suggestion.suggested_by_email || 'Unknown'}</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Reason:</div>
                <p className="text-gray-600 bg-gray-50 p-2 rounded">{suggestion.reason}</p>
              </div>

              {suggestion.asset_name && (
                <div className="mb-3 text-sm text-gray-500">
                  Related Asset: {suggestion.asset_name}
                </div>
              )}

              {suggestion.status !== 'pending' && (
                <div className="mb-3 border-t pt-3">
                  <div className="text-sm text-gray-500">
                    Reviewed: {suggestion.reviewed_at ? formatDate(suggestion.reviewed_at) : 'N/A'}
                    {suggestion.reviewed_by_email && ` by ${suggestion.reviewed_by_email}`}
                  </div>
                  {suggestion.admin_notes && (
                    <div className="mt-2">
                      <div className="text-sm font-medium text-gray-700">Admin Notes:</div>
                      <p className="text-gray-600 bg-gray-50 p-2 rounded text-sm">{suggestion.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {suggestion.status === 'pending' && (
                <div className="border-t pt-3 mt-3">
                  <div className="mb-3">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Admin Notes (optional)
                    </label>
                    <Textarea
                      value={adminNotes[suggestion.id] || ''}
                      onChange={(e) => setAdminNotes(prev => ({
                        ...prev,
                        [suggestion.id]: e.target.value
                      }))}
                      placeholder="Add notes about this decision..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(suggestion.id)}
                      disabled={processingId === suggestion.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingId === suggestion.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(suggestion.id)}
                      disabled={processingId === suggestion.id}
                    >
                      {processingId === suggestion.id ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              )}

              {suggestion.status !== 'pending' && (
                <div className="border-t pt-3 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(suggestion.id)}
                    disabled={processingId === suggestion.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
