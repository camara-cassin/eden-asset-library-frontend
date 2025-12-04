import { get } from './client';
import type { AssetListItem, PaginatedResponse, AssetStatus, SubmissionStatus } from '../types/asset';

export interface ContributorAssetsParams {
  status?: AssetStatus;
  submission_status?: SubmissionStatus;
  page?: number;
  page_size?: number;
}

export async function getContributorAssets(
  contributorId: string,
  params?: ContributorAssetsParams
): Promise<PaginatedResponse<AssetListItem>> {
  return get<PaginatedResponse<AssetListItem>>(
    `/contributors/${contributorId}/assets`,
    params as Record<string, unknown>
  );
}
