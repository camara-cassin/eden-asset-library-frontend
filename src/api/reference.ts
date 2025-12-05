import { get } from './client';
import { CategoriesResponse, CategoryDefinition } from '../types/asset';

export async function getAssetTypes(): Promise<string[]> {
  return get<string[]>('/reference/asset-types');
}

// Get hierarchical categories with subcategories and colors
export async function getCategories(): Promise<CategoriesResponse> {
  return get<CategoriesResponse>('/reference/categories');
}

// Get flat list of primary category names (for backwards compatibility)
export async function getCategoriesFlat(): Promise<string[]> {
  return get<string[]>('/reference/categories/flat');
}

export async function getSubcategories(category?: string): Promise<string[]> {
  return get<string[]>('/reference/subcategories', category ? { category } : undefined);
}

// Helper to get category definition by primary name
export function getCategoryByPrimary(categories: CategoryDefinition[], primary: string): CategoryDefinition | undefined {
  return categories.find(cat => cat.primary === primary);
}

export async function getScalingPotentials(): Promise<string[]> {
  return get<string[]>('/reference/scaling-potentials');
}

export async function getLicenseTypes(): Promise<string[]> {
  return get<string[]>('/reference/license-types');
}

export async function getClimateZones(): Promise<string[]> {
  return get<string[]>('/reference/climate-zones');
}

export async function getSubmissionStatuses(): Promise<string[]> {
  return get<string[]>('/reference/submission-statuses');
}

export async function getSystemStatuses(): Promise<string[]> {
  return get<string[]>('/reference/system-statuses');
}
