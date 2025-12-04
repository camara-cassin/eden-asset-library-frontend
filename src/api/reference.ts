import { get } from './client';

export async function getAssetTypes(): Promise<string[]> {
  return get<string[]>('/reference/asset-types');
}

export async function getCategories(): Promise<string[]> {
  return get<string[]>('/reference/categories');
}

export async function getSubcategories(category?: string): Promise<string[]> {
  return get<string[]>('/reference/subcategories', category ? { category } : undefined);
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
