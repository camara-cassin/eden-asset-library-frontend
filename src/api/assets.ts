import { get, post, patch, del, postFormData } from './client';
import type {
  EdenAsset,
  AssetListItem,
  PaginatedResponse,
  AssetCreatePayload,
  AssetUpdatePayload,
  FileAttachPayload,
  AIExtractPayload,
  AIExtractionResponse,
  ApprovePayload,
  RejectPayload,
  AssetListParams,
  UploadFilesResponse,
} from '../types/asset';

export async function createAsset(payload: AssetCreatePayload): Promise<EdenAsset> {
  return post<EdenAsset>('/assets', payload);
}

export async function getAsset(id: string): Promise<EdenAsset> {
  return get<EdenAsset>(`/assets/${id}`);
}

export async function updateAsset(id: string, payload: AssetUpdatePayload): Promise<EdenAsset> {
  return patch<EdenAsset>(`/assets/${id}`, payload);
}

export async function deleteAsset(id: string): Promise<void> {
  return del<void>(`/assets/${id}`);
}

export async function listAssets(params?: AssetListParams): Promise<PaginatedResponse<AssetListItem>> {
  return get<PaginatedResponse<AssetListItem>>('/assets', params as Record<string, unknown>);
}

export async function submitAsset(id: string): Promise<EdenAsset> {
  return post<EdenAsset>(`/assets/${id}/submit`);
}

export async function approveAsset(id: string, payload?: ApprovePayload): Promise<EdenAsset> {
  return post<EdenAsset>(`/assets/${id}/approve`, payload);
}

export async function rejectAsset(id: string, payload: RejectPayload): Promise<EdenAsset> {
  return post<EdenAsset>(`/assets/${id}/reject`, payload);
}

export async function attachFile(id: string, payload: FileAttachPayload): Promise<EdenAsset> {
  return post<EdenAsset>(`/assets/${id}/files`, payload);
}

export async function aiExtract(id: string, payload: AIExtractPayload): Promise<AIExtractionResponse> {
  return post<AIExtractionResponse>(`/assets/${id}/ai-extract`, payload);
}

export type DocType = 'technical_spec' | 'cad_files' | 'engineering_drawings' | 'manuals' | 'images' | 'general';

export async function uploadFiles(
  id: string, 
  files: File[], 
  docType: DocType = 'general'
): Promise<UploadFilesResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('doc_type', docType);
  return postFormData<UploadFilesResponse>(`/assets/${id}/uploads`, formData);
}

// Upload multiple files with different doc types
export async function uploadFilesWithTypes(
  id: string,
  filesWithTypes: Array<{ file: File; docType: DocType }>
): Promise<UploadFilesResponse> {
  const formData = new FormData();
  filesWithTypes.forEach(({ file, docType }) => {
    formData.append('files', file);
    formData.append('doc_types', docType);
  });
  return postFormData<UploadFilesResponse>(`/assets/${id}/uploads`, formData);
}

// Public endpoints
export async function listPublicAssets(params?: AssetListParams): Promise<PaginatedResponse<AssetListItem>> {
  return get<PaginatedResponse<AssetListItem>>('/public/assets', params as Record<string, unknown>);
}

export async function getPublicAsset(id: string): Promise<EdenAsset> {
  return get<EdenAsset>(`/public/assets/${id}`);
}
