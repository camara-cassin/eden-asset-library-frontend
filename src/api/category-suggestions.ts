import { get, post, patch, del } from './client';

export interface CategorySuggestionCreate {
  suggestion_type: 'primary_category' | 'subcategory';
  primary_category?: string;
  suggested_name: string;
  reason: string;
  asset_id?: string;
}

export interface CategorySuggestion {
  id: string;
  suggestion_type: string;
  primary_category?: string;
  suggested_name: string;
  reason: string;
  suggested_by_user_id: string;
  suggested_by_email?: string;
  asset_id?: string;
  asset_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by_user_id?: string;
  reviewed_by_email?: string;
}

export interface CategorySuggestionListResponse {
  suggestions: CategorySuggestion[];
  total: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
}

export interface CategorySuggestionUpdate {
  status: 'approved' | 'rejected';
  admin_notes?: string;
}

export const createSuggestion = async (data: CategorySuggestionCreate): Promise<CategorySuggestion> => {
  return post<CategorySuggestion>('/category-suggestions', data);
};

export const getMySuggestions = async (): Promise<CategorySuggestionListResponse> => {
  return get<CategorySuggestionListResponse>('/category-suggestions/my-suggestions');
};

export const getAllSuggestions = async (
  status?: string,
  suggestionType?: string
): Promise<CategorySuggestionListResponse> => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (suggestionType) params.suggestion_type = suggestionType;
  
  return get<CategorySuggestionListResponse>('/category-suggestions', params);
};

export const updateSuggestion = async (
  suggestionId: string,
  data: CategorySuggestionUpdate
): Promise<CategorySuggestion> => {
  return patch<CategorySuggestion>(`/category-suggestions/${suggestionId}`, data);
};

export const deleteSuggestion = async (suggestionId: string): Promise<void> => {
  await del<void>(`/category-suggestions/${suggestionId}`);
};
