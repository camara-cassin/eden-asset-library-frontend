import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAsset, updateAsset, submitAsset, attachFile, aiExtract, uploadFilesWithTypes, type DocType } from '../api/assets';
import { getAssetTypes, getCategories, getScalingPotentials } from '../api/reference';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CategorySelector } from '@/components/CategorySelector';
import { SuggestCategoryModal } from '@/components/SuggestCategoryModal';
import { DocumentUpload, type UploadedFile } from '@/components/DocumentUpload';
import { ImageUpload, type PendingImage } from '@/components/ImageUpload';
import { BimModelLinks } from '@/components/BimModelLinks';
import type { EdenAsset, TimePeriod, AIExtractionResponse, CategorySelection, AssetImage } from '../types/asset';

const FILE_TARGETS = [
  { value: 'cad_file_urls', label: 'CAD Files' },
  { value: 'bim_file_urls', label: 'BIM Files' },
  { value: 'engineering_drawings_urls', label: 'Engineering Drawings' },
  { value: 'marketing_pdfs_urls', label: 'Marketing PDFs' },
  { value: 'instructional_video_urls', label: 'Instructional Videos' },
  { value: 'safety_data_sheets_urls', label: 'Safety Data Sheets' },
  { value: 'certifications_docs_urls', label: 'Certifications' },
  { value: 'patent_docs_urls', label: 'Patent Documents' },
  { value: 'additional_docs_urls', label: 'Additional Documents' },
];

// Unit options for functional_io inputs/outputs
const UNIT_OPTIONS = [
  // Energy
  { value: 'kW', label: 'kW (kilowatts)' },
  { value: 'kWh', label: 'kWh (kilowatt-hours)' },
  { value: 'W', label: 'W (watts)' },
  { value: 'Wh', label: 'Wh (watt-hours)' },
  { value: 'MWh', label: 'MWh (megawatt-hours)' },
  { value: 'BTU', label: 'BTU' },
  { value: 'calories', label: 'calories' },
  { value: 'joules', label: 'joules' },
  // Volume
  { value: 'gallons', label: 'gallons' },
  { value: 'liters', label: 'liters' },
  { value: 'cubic_meters', label: 'cubic meters (m³)' },
  { value: 'cubic_feet', label: 'cubic feet (ft³)' },
  { value: 'cubic_yards', label: 'cubic yards' },
  // Mass
  { value: 'tons', label: 'tons' },
  { value: 'kg', label: 'kg (kilograms)' },
  { value: 'pounds', label: 'pounds (lbs)' },
  { value: 'grams', label: 'grams' },
  // Light
  { value: 'lumens', label: 'lumens' },
  { value: 'lux', label: 'lux' },
  // Area
  { value: 'square_feet', label: 'square feet (ft²)' },
  { value: 'square_meters', label: 'square meters (m²)' },
  { value: 'acres', label: 'acres' },
  { value: 'hectares', label: 'hectares' },
  // Count
  { value: 'pieces', label: 'pieces' },
  { value: 'units', label: 'units' },
  { value: 'systems', label: 'systems' },
  { value: 'people_served', label: 'people served' },
  { value: 'households_served', label: 'households served' },
];

// Time period options for functional_io inputs/outputs
const TIME_PERIOD_OPTIONS = [
  { value: 'per_day', label: 'Per day' },
  { value: 'per_week', label: 'Per week' },
  { value: 'per_month', label: 'Per month' },
  { value: 'per_year', label: 'Per year' },
];

// Multipliers to convert time periods to yearly values
const YEARLY_MULTIPLIERS: Record<string, number> = {
  per_day: 365,
  per_week: 52,
  per_month: 12,
  per_year: 1,
};

// Edit sections for step-by-step navigation
const EDIT_SECTIONS = [
  { id: 1, name: 'Basic Information', key: 'basic_info' },
  { id: 2, name: 'Documentation', key: 'documentation' },
  { id: 3, name: 'Product Photos', key: 'images' },
  { id: 4, name: '3D & BIM Files', key: 'bim' },
  { id: 5, name: 'Physical Configuration', key: 'physical_config' },
  { id: 6, name: 'Functional I/O', key: 'functional_io' },
  { id: 7, name: 'Economics', key: 'economics' },
  { id: 8, name: 'Environmental Impact', key: 'environmental' },
  { id: 9, name: 'Human Impact', key: 'human_impact' },
  { id: 10, name: 'Deployment', key: 'deployment' },
  { id: 11, name: 'Review & Submit', key: 'review' },
];

// Dimension unit options
const DIMENSION_UNITS = [
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'inches', label: 'inches' },
  { value: 'ft', label: 'ft' },
];

// Weight unit options
const WEIGHT_UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

// Area unit options
const AREA_UNITS = [
  { value: 'm²', label: 'm²' },
  { value: 'ft²', label: 'ft²' },
  { value: 'acres', label: 'acres' },
  { value: 'hectares', label: 'hectares' },
];

// Environmental rating options
const ENVIRONMENTAL_RATINGS = [
  { value: 'Indoor', label: 'Indoor' },
  { value: 'Outdoor', label: 'Outdoor' },
  { value: 'Marine / Coastal', label: 'Marine / Coastal' },
  { value: 'High-Dust / Industrial', label: 'High-Dust / Industrial' },
  { value: 'High-Humidity', label: 'High-Humidity' },
  { value: 'Explosion-Proof / Hazardous Area', label: 'Explosion-Proof / Hazardous Area' },
  { value: 'Clean Room', label: 'Clean Room' },
  { value: 'Unknown', label: 'Unknown' },
];

// Modular interface types
const INTERFACE_TYPES = [
  'Electrical',
  'Plumbing',
  'Data',
  'Mechanical',
  'Fluid',
  'Hydraulic',
  'Pneumatic',
  'Other',
];

// Helper function to calculate yearly value
const calculateYearlyValue = (value: number | undefined, timePeriod: string | undefined): number | null => {
  if (value === undefined || value === null || !timePeriod) return null;
  const multiplier = YEARLY_MULTIPLIERS[timePeriod];
  if (!multiplier) return null;
  return value * multiplier;
};

export function EditAsset() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modal states
  const [showFileModal, setShowFileModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [fileTarget, setFileTarget] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [useUploadedDocs, setUseUploadedDocs] = useState(true);
  const [extraDocUrls, setExtraDocUrls] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<EdenAsset>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_hasChanges, setHasChanges] = useState(false);

  // Fetch asset
  const { data: asset, isLoading, error: fetchError } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => getAsset(id!),
    enabled: !!id,
  });

  // Success message state
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [aiMessage, setAiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fileMessage, setFileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // AI extraction response state
  const [aiExtractionResult, setAiExtractionResult] = useState<AIExtractionResponse | null>(null);

  // Document upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);

  // Image upload state
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Section navigation state
  const [currentSection, setCurrentSection] = useState(1);

  // Fetch reference data
  const { data: assetTypes } = useQuery({
    queryKey: ['assetTypes'],
    queryFn: getAssetTypes,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // State for suggest category modal
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  const { data: scalingPotentials } = useQuery({
    queryKey: ['scalingPotentials'],
    queryFn: getScalingPotentials,
  });

  // Initialize form data when asset loads
  useEffect(() => {
    if (asset) {
      setFormData(asset);
    }
  }, [asset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<EdenAsset>) => updateAsset(id!, data),
    onSuccess: () => {
      setLastSaved(new Date());
      setHasChanges(false);
      setShowSavedMessage(true);
      // Hide the saved message after 3 seconds
      setTimeout(() => setShowSavedMessage(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: () => submitAsset(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
  });

  // Attach file mutation
  const attachFileMutation = useMutation({
    mutationFn: ({ target, url }: { target: string; url: string }) =>
      attachFile(id!, { target, url }),
    onSuccess: () => {
      setShowFileModal(false);
      setFileTarget('');
      setFileUrl('');
      setFileMessage({ type: 'success', text: 'File attached successfully' });
      setTimeout(() => setFileMessage(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
    onError: (error) => {
      setFileMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to attach file' });
    },
  });

  // AI extract mutation
  const aiExtractMutation = useMutation({
    mutationFn: () =>
      aiExtract(id!, {
        sources: {
          use_uploaded_docs: useUploadedDocs,
          extra_doc_urls: extraDocUrls ? extraDocUrls.split('\n').filter(Boolean) : undefined,
        },
      }),
    onSuccess: (data) => {
      setShowAIModal(false);
      setExtraDocUrls('');
      setAiExtractionResult(data);
      setAiMessage({ type: 'success', text: 'AI prefill completed successfully' });
      setTimeout(() => setAiMessage(null), 5000);
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
    onError: (error) => {
      setAiMessage({ type: 'error', text: error instanceof Error ? error.message : 'AI prefill failed' });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  const handleAttachFile = () => {
    if (fileTarget && fileUrl) {
      attachFileMutation.mutate({ target: fileTarget, url: fileUrl });
    }
  };

  const handleAIExtract = () => {
    aiExtractMutation.mutate();
  };

  const updateFormField = (path: string, value: unknown) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const parts = path.split('.');
      let current: Record<string, unknown> = newData as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = value;
      return newData;
    });
    setHasChanges(true);
  };

  // Handle document upload
  const handleUploadDocuments = async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploadingDocs(true);
    try {
      const filesWithTypes = uploadedFiles.map((item) => ({
        file: item.file,
        docType: item.docType as DocType,
      }));

      const result = await uploadFilesWithTypes(id!, filesWithTypes);

      setUploadedFiles([]);
      setFileMessage({ type: 'success', text: `${result.uploaded.length} document(s) uploaded successfully` });
      setTimeout(() => setFileMessage(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    } catch (error) {
      setFileMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to upload documents' });
    } finally {
      setIsUploadingDocs(false);
    }
  };

  // Handle image upload
  const handleUploadImages = async () => {
    if (pendingImages.length === 0) return;

    setIsUploadingImages(true);
    try {
      const filesWithTypes = pendingImages.map((item) => ({
        file: item.file,
        docType: 'images' as DocType,
      }));

      const result = await uploadFilesWithTypes(id!, filesWithTypes);

      // Create new image entries with the uploaded URLs
      const existingImagesData = formData.overview?.images || [];
      const newImages: AssetImage[] = result.uploaded.map((file, index) => ({
        url: file.url,
        caption: pendingImages[index]?.caption || '',
        is_primary: pendingImages[index]?.is_primary || false,
      }));

      // If any new image is primary, clear primary from existing images
      const hasPrimaryNew = newImages.some(img => img.is_primary);
      const updatedExisting = hasPrimaryNew
        ? existingImagesData.map(img => ({ ...img, is_primary: false }))
        : existingImagesData;

      updateFormField('overview.images', [...updatedExisting, ...newImages]);
      setPendingImages([]);
      setFileMessage({ type: 'success', text: `${result.uploaded.length} image(s) uploaded successfully` });
      setTimeout(() => setFileMessage(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    } catch (error) {
      setFileMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to upload images' });
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Get existing documents from asset's documentation_uploads
  const getExistingDocuments = () => {
    const uploads = asset?.documentation_uploads;
    if (!uploads) return [];
    
    const docs: Array<{ url: string; filename: string; docType: string; size?: number }> = [];
    
    // Handle single URL fields
    const singleUrlFields: Array<{ field: keyof typeof uploads; docType: string }> = [
      { field: 'technical_spec_sheet_url', docType: 'technical_spec' },
      { field: 'product_datasheet_url', docType: 'technical_spec' },
      { field: 'build_manual_url', docType: 'manuals' },
      { field: 'step_by_step_instructions_url', docType: 'manuals' },
      { field: 'bom_url', docType: 'technical_spec' },
      { field: 'tools_required_doc_url', docType: 'technical_spec' },
      { field: 'skills_required_doc_url', docType: 'technical_spec' },
    ];
    
    singleUrlFields.forEach(({ field, docType }) => {
      const url = uploads[field];
      if (url && typeof url === 'string') {
        const filename = url.split('/').pop() || url;
        docs.push({ url, filename, docType });
      }
    });
    
    // Handle array URL fields
    const arrayUrlFields: Array<{ field: keyof typeof uploads; docType: string }> = [
      { field: 'cad_file_urls', docType: 'cad_files' },
      { field: 'bim_file_urls', docType: 'cad_files' },
      { field: 'engineering_drawings_urls', docType: 'engineering_drawings' },
      { field: 'safety_data_sheets_urls', docType: 'technical_spec' },
      { field: 'certifications_docs_urls', docType: 'technical_spec' },
      { field: 'patent_docs_urls', docType: 'technical_spec' },
      { field: 'marketing_pdfs_urls', docType: 'general' },
      { field: 'instructional_video_urls', docType: 'manuals' },
      { field: 'additional_docs_urls', docType: 'general' },
    ];
    
    arrayUrlFields.forEach(({ field, docType }) => {
      const urls = uploads[field];
      if (urls && Array.isArray(urls)) {
        urls.forEach((url) => {
          const filename = url.split('/').pop() || url;
          docs.push({ url, filename, docType });
        });
      }
    });
    
    return docs;
  };

  const existingDocuments = getExistingDocuments();

  // Get existing images from overview.images
  const existingImages: AssetImage[] = formData.overview?.images || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-8 h-8 text-[#1B4FFF]" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">Failed to load asset</p>
        <p className="text-red-500 text-sm mt-1">
          {fetchError instanceof Error ? fetchError.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12 text-[#7A7A7A]">
        Asset not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">
            Edit Asset: {asset.basic_information?.asset_name || 'Untitled'}
          </h1>
          <div className="flex items-center space-x-2 mt-2">
            <Badge className="bg-gray-100 text-gray-700">
              {asset.system_meta?.status || 'draft'}
            </Badge>
            <Badge variant="outline" className="text-[#4A4A4A]">
              {asset.system_meta?.version || 'v1'}
            </Badge>
            {showSavedMessage && (
              <span className="text-sm text-green-600 font-medium">
                Saved!
              </span>
            )}
            {lastSaved && !showSavedMessage && (
              <span className="text-sm text-[#7A7A7A]">
                Last saved at {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowAIModal(true)}
            className="border-[#1B4FFF] text-[#1B4FFF]"
          >
            Run AI Prefill
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFileModal(true)}
            className="border-[#1B4FFF] text-[#1B4FFF]"
          >
            Attach File URL
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {aiMessage && (
        <div className={`rounded-lg p-4 ${aiMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {aiMessage.text}
        </div>
      )}
      {fileMessage && (
        <div className={`rounded-lg p-4 ${fileMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {fileMessage.text}
        </div>
      )}

      {/* AI Prefill Summary Panel */}
      {(aiExtractionResult || formData.ai_assistance?.prefill_status === 'complete') && (
        <Card className="bg-blue-50 border-blue-200 rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
              AI Prefill Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Prefill Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-700">Status:</span>
              <Badge className={
                formData.ai_assistance?.prefill_status === 'complete' 
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : formData.ai_assistance?.prefill_status === 'failed'
                  ? 'bg-red-100 text-red-700 border-red-300'
                  : 'bg-yellow-100 text-yellow-700 border-yellow-300'
              }>
                {formData.ai_assistance?.prefill_status || 'not_run'}
              </Badge>
              {formData.ai_assistance?.last_run_at && (
                <span className="text-xs text-blue-600">
                  Last run: {new Date(formData.ai_assistance.last_run_at).toLocaleString()}
                </span>
              )}
            </div>

            {/* Fields Prefilled */}
            {(aiExtractionResult?.fields_prefilled?.length || formData.ai_assistance?.fields_prefilled?.length) ? (
              <div>
                <span className="text-sm font-medium text-blue-700">Fields Prefilled:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(aiExtractionResult?.fields_prefilled || formData.ai_assistance?.fields_prefilled || []).map((field, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-white border-blue-300 text-blue-600">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Sources Used */}
            {(aiExtractionResult?.sources_used?.length || formData.ai_assistance?.sources_used?.length) ? (
              <div>
                <span className="text-sm font-medium text-blue-700">Sources Used:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {aiExtractionResult?.sources_used ? (
                    aiExtractionResult.sources_used.map((source, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-white border-blue-300 text-blue-600">
                        {source.startsWith('http') ? (
                          <a href={source} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {source.length > 40 ? source.substring(0, 40) + '...' : source}
                          </a>
                        ) : (
                          source.length > 40 ? source.substring(0, 40) + '...' : source
                        )}
                      </Badge>
                    ))
                  ) : (
                    formData.ai_assistance?.sources_used?.map((source, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-white border-blue-300 text-blue-600">
                        {source.source_ref && source.source_ref.startsWith('http') ? (
                          <a href={source.source_ref} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {source.source_ref.length > 40 ? source.source_ref.substring(0, 40) + '...' : source.source_ref}
                          </a>
                        ) : (
                          source.source_ref ? (source.source_ref.length > 40 ? source.source_ref.substring(0, 40) + '...' : source.source_ref) : 'Unknown source'
                        )}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {/* Notes for Reviewer */}
            {aiExtractionResult?.notes_for_reviewer?.length ? (
              <div>
                <span className="text-sm font-medium text-blue-700">Notes for Reviewer:</span>
                <ul className="list-disc list-inside mt-1 text-sm text-blue-600">
                  {aiExtractionResult.notes_for_reviewer.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Dismiss button */}
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAiExtractionResult(null)}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                Dismiss Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Progress Indicator */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#1A1A1A]">
            Section {currentSection} of {EDIT_SECTIONS.length}: {EDIT_SECTIONS[currentSection - 1]?.name}
          </span>
          <span className="text-sm text-[#7A7A7A]">
            {Math.round((currentSection / EDIT_SECTIONS.length) * 100)}% complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-[#1B4FFF] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentSection / EDIT_SECTIONS.length) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {EDIT_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setCurrentSection(section.id)}
              className={`text-xs px-2 py-1 rounded ${
                section.id === currentSection
                  ? 'bg-[#1B4FFF] text-white'
                  : section.id < currentSection
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Basic Information */}
      {currentSection === 1 && (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Basic Information</CardTitle>
          <p className="text-sm text-[#7A7A7A] mt-1">
            Please complete as much of the following information as you can. Check the AI prefilled fields and ensure they are correct.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Asset Type</Label>
              <Select
                value={formData.asset_type}
                onValueChange={(v) => updateFormField('asset_type', v)}
              >
                <SelectTrigger className="border-[#D8D8D8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Asset Name</Label>
              <Input
                value={formData.basic_information?.asset_name || ''}
                onChange={(e) => updateFormField('basic_information.asset_name', e.target.value)}
                className="border-[#D8D8D8]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Scaling Potential</Label>
              <Select
                value={formData.basic_information?.scaling_potential || ''}
                onValueChange={(v) => updateFormField('basic_information.scaling_potential', v)}
              >
                <SelectTrigger className="border-[#D8D8D8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scalingPotentials?.map((sp) => (
                    <SelectItem key={sp} value={sp}>
                      {sp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-[#1A1A1A]">Categories (select 1-4)</Label>
            <CategorySelector
              value={formData.basic_information?.categories || []}
              onChange={(categories: CategorySelection[]) => updateFormField('basic_information.categories', categories)}
              maxCategories={4}
              minCategories={1}
              showSuggestLink={true}
              onSuggestCategory={() => setShowSuggestModal(true)}
            />
          </div>

                    <div className="space-y-2">
                      <Label className="text-[#1A1A1A]">Short Summary</Label>
                      <Textarea
                        value={formData.basic_information?.short_summary || ''}
                        onChange={(e) => updateFormField('basic_information.short_summary', e.target.value)}
                        rows={3}
                        className="border-[#D8D8D8]"
                      />
                    </div>

                    {/* Long Description (AI-generated, read-only) */}
                    <div className="space-y-2">
                      <Label className="text-[#1A1A1A]">
                        Long Description
                        <span className="ml-2 text-xs text-[#7A7A7A] font-normal">(AI-generated)</span>
                      </Label>
                      {formData.basic_information?.long_description ? (
                        <div className="p-4 bg-gray-50 border border-[#D8D8D8] rounded-md">
                          <p className="text-[#1A1A1A] whitespace-pre-wrap">
                            {formData.basic_information.long_description}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 border border-[#D8D8D8] rounded-md text-[#7A7A7A] italic">
                          No AI-generated description yet. Click "AI Prefill from Docs" to generate.
                        </div>
                      )}
                    </div>

                    {/* Contributor (read-only) */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-3">Contributor Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Name</Label>
                <Input
                  value={formData.contributor?.name || ''}
                  readOnly
                  className="border-[#D8D8D8] bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Email</Label>
                <Input
                  value={formData.contributor?.email || ''}
                  readOnly
                  className="border-[#D8D8D8] bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Contributor ID</Label>
                <Input
                  value={formData.contributor?.contributor_id || ''}
                  readOnly
                  className="border-[#D8D8D8] bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
            <p className="text-sm text-[#7A7A7A] mt-2">
              Contributor information is automatically managed by EDEN and cannot be edited here.
            </p>
          </div>
        </CardContent>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <Button
            variant="outline"
            disabled={currentSection === 1}
            onClick={() => setCurrentSection(currentSection - 1)}
            className="border-[#D8D8D8]"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(currentSection + 1)}
              className="border-[#D8D8D8]"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                handleSave();
                setCurrentSection(currentSection + 1);
              }}
              className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
            >
              Save & Next
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Section 2: Documentation */}
      {currentSection === 2 && (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Documentation</CardTitle>
          <CardDescription className="text-[#7A7A7A]">
            Upload technical specs, CAD files, manuals, and other supporting documents. For product photos, use the Images section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DocumentUpload
            uploadedFiles={uploadedFiles}
            onFilesChange={setUploadedFiles}
            existingDocuments={existingDocuments}
            disabled={isUploadingDocs}
          />
          {uploadedFiles.length > 0 && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleUploadDocuments}
                disabled={isUploadingDocs}
                className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
              >
                {isUploadingDocs ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${uploadedFiles.length} Document(s)`
                )}
              </Button>
            </div>
          )}
        </CardContent>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(currentSection - 1)}
            className="border-[#D8D8D8]"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(currentSection + 1)}
              className="border-[#D8D8D8]"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                handleSave();
                setCurrentSection(currentSection + 1);
              }}
              className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
            >
              Save & Next
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Section 3: Images */}
      {currentSection === 3 && (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Product Photos</CardTitle>
          <CardDescription className="text-[#7A7A7A]">
            Upload up to 4 product photos (JPG, PNG, GIF, WebP). Mark one as primary to display as the asset thumbnail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload
            images={existingImages}
            onImagesChange={(images) => updateFormField('overview.images', images)}
            pendingImages={pendingImages}
            onPendingImagesChange={setPendingImages}
            maxImages={4}
            disabled={isUploadingImages}
          />
          {pendingImages.length > 0 && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleUploadImages}
                disabled={isUploadingImages}
                className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
              >
                {isUploadingImages ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${pendingImages.length} Image(s)`
                )}
              </Button>
            </div>
          )}
        </CardContent>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(currentSection - 1)}
            className="border-[#D8D8D8]"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(currentSection + 1)}
              className="border-[#D8D8D8]"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                handleSave();
                setCurrentSection(currentSection + 1);
              }}
              className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
            >
              Save & Next
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Section 4: 3D & BIM Files */}
      {currentSection === 4 && (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">3D & BIM Files</CardTitle>
          <CardDescription className="text-[#7A7A7A]">
            Add links to 3D models or BIM files hosted externally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BimModelLinks
            models={formData.digital_assets?.bim_models || []}
            onChange={(models) => updateFormField('digital_assets.bim_models', models)}
          />
        </CardContent>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(currentSection - 1)}
            className="border-[#D8D8D8]"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(currentSection + 1)}
              className="border-[#D8D8D8]"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                handleSave();
                setCurrentSection(currentSection + 1);
              }}
              className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
            >
              Save & Next
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Section 5: Physical Configuration */}
      {currentSection === 5 && (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Physical Configuration</CardTitle>
          <CardDescription className="text-[#7A7A7A]">
            Define the physical specifications of this asset for EDEN.OS integration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unit Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[#1A1A1A]">Unit Variants</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const variants = formData.physical_configuration?.unit_variants_new || [];
                  updateFormField('physical_configuration.unit_variants_new', [...variants, { 
                    variant_name: '', 
                    model_number: '', 
                    notes: '' 
                  }]);
                }}
                className="border-[#1B4FFF] text-[#1B4FFF]"
              >
                Add Variant
              </Button>
            </div>
            <p className="text-sm text-[#7A7A7A] mb-3">
              List different versions or models of this asset (e.g., different sizes, capacities, or configurations).
            </p>
            {(formData.physical_configuration?.unit_variants_new || []).map((variant, index) => (
              <div key={index} className="border border-[#D8D8D8] rounded-lg p-4 mb-3">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-[#1A1A1A]">Variant {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const variants = [...(formData.physical_configuration?.unit_variants_new || [])];
                      variants.splice(index, 1);
                      updateFormField('physical_configuration.unit_variants_new', variants);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-sm">Variant Name</Label>
                    <Input
                      value={variant.variant_name || ''}
                      onChange={(e) => {
                        const variants = [...(formData.physical_configuration?.unit_variants_new || [])];
                        variants[index] = { ...variants[index], variant_name: e.target.value };
                        updateFormField('physical_configuration.unit_variants_new', variants);
                      }}
                      placeholder="e.g., Standard, Large, Industrial"
                      className="border-[#D8D8D8]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Model Number</Label>
                    <Input
                      value={variant.model_number || ''}
                      onChange={(e) => {
                        const variants = [...(formData.physical_configuration?.unit_variants_new || [])];
                        variants[index] = { ...variants[index], model_number: e.target.value };
                        updateFormField('physical_configuration.unit_variants_new', variants);
                      }}
                      placeholder="e.g., ABC-1000"
                      className="border-[#D8D8D8]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Notes</Label>
                    <Input
                      value={variant.notes || ''}
                      onChange={(e) => {
                        const variants = [...(formData.physical_configuration?.unit_variants_new || [])];
                        variants[index] = { ...variants[index], notes: e.target.value };
                        updateFormField('physical_configuration.unit_variants_new', variants);
                      }}
                      placeholder="Additional details"
                      className="border-[#D8D8D8]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dimensions */}
          <div>
            <h3 className="font-medium text-[#1A1A1A] mb-2">Dimensions</h3>
            <p className="text-sm text-[#7A7A7A] mb-3">
              Enter the physical dimensions of the asset. Volume is auto-calculated from L × W × H.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Length</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.physical_configuration?.dimensions?.length?.value || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      updateFormField('physical_configuration.dimensions.length.value', val);
                    }}
                    placeholder="0"
                    className="border-[#D8D8D8] flex-1"
                  />
                  <Select
                    value={formData.physical_configuration?.dimensions?.length?.unit || 'cm'}
                    onValueChange={(v) => updateFormField('physical_configuration.dimensions.length.unit', v)}
                  >
                    <SelectTrigger className="w-20 border-[#D8D8D8]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIMENSION_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Width</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.physical_configuration?.dimensions?.width?.value || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      updateFormField('physical_configuration.dimensions.width.value', val);
                    }}
                    placeholder="0"
                    className="border-[#D8D8D8] flex-1"
                  />
                  <Select
                    value={formData.physical_configuration?.dimensions?.width?.unit || 'cm'}
                    onValueChange={(v) => updateFormField('physical_configuration.dimensions.width.unit', v)}
                  >
                    <SelectTrigger className="w-20 border-[#D8D8D8]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIMENSION_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Height</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.physical_configuration?.dimensions?.height?.value || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      updateFormField('physical_configuration.dimensions.height.value', val);
                    }}
                    placeholder="0"
                    className="border-[#D8D8D8] flex-1"
                  />
                  <Select
                    value={formData.physical_configuration?.dimensions?.height?.unit || 'cm'}
                    onValueChange={(v) => updateFormField('physical_configuration.dimensions.height.unit', v)}
                  >
                    <SelectTrigger className="w-20 border-[#D8D8D8]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIMENSION_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Volume (auto-calculated)</Label>
                <div className="bg-gray-100 rounded-md px-3 py-2 text-sm text-[#7A7A7A]">
                  {(() => {
                    const l = formData.physical_configuration?.dimensions?.length?.value;
                    const w = formData.physical_configuration?.dimensions?.width?.value;
                    const h = formData.physical_configuration?.dimensions?.height?.value;
                    if (l && w && h) {
                      const volume = l * w * h;
                      const unit = formData.physical_configuration?.dimensions?.length?.unit || 'cm';
                      return `${volume.toLocaleString()} ${unit}³`;
                    }
                    return 'Enter L × W × H';
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Footprint Area */}
          <div>
            <h3 className="font-medium text-[#1A1A1A] mb-2">Footprint Area</h3>
            <p className="text-sm text-[#7A7A7A] mb-3">
              The floor space or ground area required for this asset.
            </p>
            <div className="flex gap-2 max-w-xs">
              <Input
                type="number"
                value={formData.physical_configuration?.footprint_area?.value || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  updateFormField('physical_configuration.footprint_area.value', val);
                }}
                placeholder="0"
                className="border-[#D8D8D8] flex-1"
              />
              <Select
                value={formData.physical_configuration?.footprint_area?.unit || 'm²'}
                onValueChange={(v) => updateFormField('physical_configuration.footprint_area.unit', v)}
              >
                <SelectTrigger className="w-28 border-[#D8D8D8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREA_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Unit Weight */}
          <div>
            <h3 className="font-medium text-[#1A1A1A] mb-2">Unit Weight</h3>
            <p className="text-sm text-[#7A7A7A] mb-3">
              The weight of a single unit of this asset.
            </p>
            <div className="flex gap-2 max-w-xs">
              <Input
                type="number"
                value={formData.physical_configuration?.unit_weight?.value || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  updateFormField('physical_configuration.unit_weight.value', val);
                }}
                placeholder="0"
                className="border-[#D8D8D8] flex-1"
              />
              <Select
                value={formData.physical_configuration?.unit_weight?.unit || 'kg'}
                onValueChange={(v) => updateFormField('physical_configuration.unit_weight.unit', v)}
              >
                <SelectTrigger className="w-20 border-[#D8D8D8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Package Size & Weight */}
          <div>
            <h3 className="font-medium text-[#1A1A1A] mb-2">Package Size & Weight</h3>
            <p className="text-sm text-[#7A7A7A] mb-3">
              Shipping package dimensions and weight for logistics planning.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">Package Length</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.physical_configuration?.package_size?.length?.value || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        updateFormField('physical_configuration.package_size.length.value', val);
                      }}
                      placeholder="0"
                      className="border-[#D8D8D8] flex-1"
                    />
                    <Select
                      value={formData.physical_configuration?.package_size?.length?.unit || 'cm'}
                      onValueChange={(v) => updateFormField('physical_configuration.package_size.length.unit', v)}
                    >
                      <SelectTrigger className="w-20 border-[#D8D8D8]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIMENSION_UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Package Width</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.physical_configuration?.package_size?.width?.value || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        updateFormField('physical_configuration.package_size.width.value', val);
                      }}
                      placeholder="0"
                      className="border-[#D8D8D8] flex-1"
                    />
                    <Select
                      value={formData.physical_configuration?.package_size?.width?.unit || 'cm'}
                      onValueChange={(v) => updateFormField('physical_configuration.package_size.width.unit', v)}
                    >
                      <SelectTrigger className="w-20 border-[#D8D8D8]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIMENSION_UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Package Height</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.physical_configuration?.package_size?.height?.value || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        updateFormField('physical_configuration.package_size.height.value', val);
                      }}
                      placeholder="0"
                      className="border-[#D8D8D8] flex-1"
                    />
                    <Select
                      value={formData.physical_configuration?.package_size?.height?.unit || 'cm'}
                      onValueChange={(v) => updateFormField('physical_configuration.package_size.height.unit', v)}
                    >
                      <SelectTrigger className="w-20 border-[#D8D8D8]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIMENSION_UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">Package Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.physical_configuration?.package_weight?.value || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        updateFormField('physical_configuration.package_weight.value', val);
                      }}
                      placeholder="0"
                      className="border-[#D8D8D8] flex-1"
                    />
                    <Select
                      value={formData.physical_configuration?.package_weight?.unit || 'kg'}
                      onValueChange={(v) => updateFormField('physical_configuration.package_weight.unit', v)}
                    >
                      <SelectTrigger className="w-20 border-[#D8D8D8]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEIGHT_UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Units per Package</Label>
                  <Input
                    type="number"
                    value={formData.physical_configuration?.units_per_package || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      updateFormField('physical_configuration.units_per_package', val);
                    }}
                    placeholder="1"
                    className="border-[#D8D8D8] max-w-[120px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stackability */}
          <div>
            <h3 className="font-medium text-[#1A1A1A] mb-2">Stackability</h3>
            <p className="text-sm text-[#7A7A7A] mb-3">
              Can this asset be stacked for storage or transport?
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_stackable"
                  checked={formData.physical_configuration?.stackability?.is_stackable || false}
                  onCheckedChange={(checked) => 
                    updateFormField('physical_configuration.stackability.is_stackable', checked as boolean)
                  }
                />
                <Label htmlFor="is_stackable" className="text-sm">This asset is stackable</Label>
              </div>
              {formData.physical_configuration?.stackability?.is_stackable && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div className="space-y-1">
                    <Label className="text-sm">Max Stack Height (units)</Label>
                    <Input
                      type="number"
                      value={formData.physical_configuration?.stackability?.max_stack_height_units || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        updateFormField('physical_configuration.stackability.max_stack_height_units', val);
                      }}
                      placeholder="e.g., 5"
                      className="border-[#D8D8D8]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Max Load per Unit</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.physical_configuration?.stackability?.max_load_per_unit?.value || ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : undefined;
                          updateFormField('physical_configuration.stackability.max_load_per_unit.value', val);
                        }}
                        placeholder="0"
                        className="border-[#D8D8D8] flex-1"
                      />
                      <Select
                        value={formData.physical_configuration?.stackability?.max_load_per_unit?.unit || 'kg'}
                        onValueChange={(v) => updateFormField('physical_configuration.stackability.max_load_per_unit.unit', v)}
                      >
                        <SelectTrigger className="w-20 border-[#D8D8D8]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEIGHT_UNITS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modular Interfaces */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[#1A1A1A]">Modular Interfaces</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const interfaces = formData.physical_configuration?.modular_interfaces || [];
                  updateFormField('physical_configuration.modular_interfaces', [...interfaces, { 
                    interface_types: [], 
                    specification: '', 
                    notes: '' 
                  }]);
                }}
                className="border-[#1B4FFF] text-[#1B4FFF]"
              >
                Add Interface
              </Button>
            </div>
            <p className="text-sm text-[#7A7A7A] mb-3">
              Define connection points for integrating this asset with other systems.
            </p>
            {(formData.physical_configuration?.modular_interfaces || []).map((iface, index) => (
              <div key={index} className="border border-[#D8D8D8] rounded-lg p-4 mb-3">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-[#1A1A1A]">Interface {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const interfaces = [...(formData.physical_configuration?.modular_interfaces || [])];
                      interfaces.splice(index, 1);
                      updateFormField('physical_configuration.modular_interfaces', interfaces);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm">Interface Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {INTERFACE_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`interface-${index}-${type}`}
                            checked={(iface.interface_types || []).includes(type)}
                            onCheckedChange={(checked) => {
                              const interfaces = [...(formData.physical_configuration?.modular_interfaces || [])];
                              const currentTypes = interfaces[index].interface_types || [];
                              if (checked) {
                                interfaces[index] = { ...interfaces[index], interface_types: [...currentTypes, type] };
                              } else {
                                interfaces[index] = { ...interfaces[index], interface_types: currentTypes.filter(t => t !== type) };
                              }
                              updateFormField('physical_configuration.modular_interfaces', interfaces);
                            }}
                          />
                          <Label htmlFor={`interface-${index}-${type}`} className="text-sm">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm">Specification</Label>
                      <Input
                        value={iface.specification || ''}
                        onChange={(e) => {
                          const interfaces = [...(formData.physical_configuration?.modular_interfaces || [])];
                          interfaces[index] = { ...interfaces[index], specification: e.target.value };
                          updateFormField('physical_configuration.modular_interfaces', interfaces);
                        }}
                        placeholder="e.g., 240V AC, 1/2 inch NPT"
                        className="border-[#D8D8D8]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Notes</Label>
                      <Input
                        value={iface.notes || ''}
                        onChange={(e) => {
                          const interfaces = [...(formData.physical_configuration?.modular_interfaces || [])];
                          interfaces[index] = { ...interfaces[index], notes: e.target.value };
                          updateFormField('physical_configuration.modular_interfaces', interfaces);
                        }}
                        placeholder="Additional details"
                        className="border-[#D8D8D8]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Environmental Rating */}
          <div>
            <h3 className="font-medium text-[#1A1A1A] mb-2">Environmental Rating</h3>
            <p className="text-sm text-[#7A7A7A] mb-3">
              The environmental conditions this asset is designed to operate in.
            </p>
            <Select
              value={formData.physical_configuration?.environmental_rating || ''}
              onValueChange={(v) => updateFormField('physical_configuration.environmental_rating', v)}
            >
              <SelectTrigger className="max-w-xs border-[#D8D8D8]">
                <SelectValue placeholder="Select environmental rating" />
              </SelectTrigger>
              <SelectContent>
                {ENVIRONMENTAL_RATINGS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(currentSection - 1)}
            className="border-[#D8D8D8]"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(currentSection + 1)}
              className="border-[#D8D8D8]"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                handleSave();
                setCurrentSection(currentSection + 1);
              }}
              className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
            >
              Save & Next
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Section 6: Functional Inputs & Outputs */}
      {currentSection === 6 && (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Functional Inputs & Outputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[#1A1A1A]">Inputs</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const inputs = formData.functional_io?.inputs || [];
                  updateFormField('functional_io.inputs', [...inputs, { 
                    input_type: '', 
                    quantity: undefined, 
                    unit: '', 
                    time_period: '', 
                    quality_spec: '',
                    estimated_financial_value_usd: undefined
                  }]);
                }}
                className="border-[#1B4FFF] text-[#1B4FFF]"
              >
                Add Input
              </Button>
            </div>
            <p className="text-sm text-[#7A7A7A] mb-3">
              List all resources required for this asset to operate. Examples: electricity, biomass, food waste, water, labour, maintenance costs, replacement parts, consumables, etc.
            </p>
            {formData.functional_io?.inputs && formData.functional_io.inputs.length > 0 ? (
              <div className="space-y-4">
                {formData.functional_io.inputs.map((input, index) => {
                  const costPerYear = calculateYearlyValue(input.estimated_financial_value_usd, input.time_period);
                  return (
                    <div key={index} className="border border-[#D8D8D8] rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-[#7A7A7A]">Input #{index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const inputs = formData.functional_io?.inputs?.filter((_, i) => i !== index) || [];
                            updateFormField('functional_io.inputs', inputs);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Input Type</Label>
                          <Input
                            value={input.input_type || ''}
                            onChange={(e) => {
                              const inputs = [...(formData.functional_io?.inputs || [])];
                              inputs[index] = { ...inputs[index], input_type: e.target.value };
                              updateFormField('functional_io.inputs', inputs);
                            }}
                            className="border-[#D8D8D8]"
                            placeholder="e.g., Electricity, Water"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Quantity</Label>
                          <Input
                            type="number"
                            value={input.quantity ?? ''}
                            onChange={(e) => {
                              const inputs = [...(formData.functional_io?.inputs || [])];
                              inputs[index] = { ...inputs[index], quantity: e.target.value ? Number(e.target.value) : undefined };
                              updateFormField('functional_io.inputs', inputs);
                            }}
                            className="border-[#D8D8D8]"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Unit</Label>
                          <Select
                            value={input.unit || ''}
                            onValueChange={(v) => {
                              const inputs = [...(formData.functional_io?.inputs || [])];
                              inputs[index] = { ...inputs[index], unit: v };
                              updateFormField('functional_io.inputs', inputs);
                            }}
                          >
                            <SelectTrigger className="border-[#D8D8D8]">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Time Period</Label>
                          <Select
                            value={input.time_period || ''}
                            onValueChange={(v) => {
                              const inputs = [...(formData.functional_io?.inputs || [])];
                              inputs[index] = { ...inputs[index], time_period: v as TimePeriod };
                              updateFormField('functional_io.inputs', inputs);
                            }}
                          >
                            <SelectTrigger className="border-[#D8D8D8]">
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_PERIOD_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Estimated Cost (USD)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={input.estimated_financial_value_usd ?? ''}
                            onChange={(e) => {
                              const inputs = [...(formData.functional_io?.inputs || [])];
                              inputs[index] = { ...inputs[index], estimated_financial_value_usd: e.target.value ? Number(e.target.value) : undefined };
                              updateFormField('functional_io.inputs', inputs);
                            }}
                            className="border-[#D8D8D8]"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Cost per Year (USD)</Label>
                          <Input
                            type="text"
                            value={costPerYear !== null ? `$${costPerYear.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                            readOnly
                            disabled
                            className="border-[#D8D8D8] bg-gray-50"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Quality Spec</Label>
                          <Input
                            value={input.quality_spec || ''}
                            onChange={(e) => {
                              const inputs = [...(formData.functional_io?.inputs || [])];
                              inputs[index] = { ...inputs[index], quality_spec: e.target.value };
                              updateFormField('functional_io.inputs', inputs);
                            }}
                            className="border-[#D8D8D8]"
                            placeholder="e.g., 120V AC"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Total Input Cost per Year */}
                <div className="flex justify-end items-center pt-2 border-t border-[#D8D8D8]">
                  <span className="text-sm font-medium text-[#1A1A1A] mr-3">Total Input Cost per Year:</span>
                  <span className="text-lg font-semibold text-[#1B4FFF]">
                    ${(formData.functional_io?.inputs || []).reduce((sum, input) => {
                      const yearly = calculateYearlyValue(input.estimated_financial_value_usd, input.time_period);
                      return sum + (yearly || 0);
                    }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[#7A7A7A] text-sm">No inputs defined. Click "Add Input" to add one.</p>
            )}
          </div>

          {/* Outputs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-[#1A1A1A]">Outputs</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const outputs = formData.functional_io?.outputs || [];
                  updateFormField('functional_io.outputs', [...outputs, { 
                    output_type: '', 
                    quantity: undefined, 
                    unit: '', 
                    time_period: '', 
                    variability_profile: '', 
                    quality_spec: '',
                    estimated_financial_value_usd: undefined
                  }]);
                }}
                className="border-[#1B4FFF] text-[#1B4FFF]"
              >
                Add Output
              </Button>
            </div>
            {formData.functional_io?.outputs && formData.functional_io.outputs.length > 0 ? (
              <div className="space-y-4">
                {formData.functional_io.outputs.map((output, index) => {
                  const valuePerYear = calculateYearlyValue(output.estimated_financial_value_usd, output.time_period);
                  return (
                    <div key={index} className="border border-[#D8D8D8] rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-[#7A7A7A]">Output #{index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const outputs = formData.functional_io?.outputs?.filter((_, i) => i !== index) || [];
                            updateFormField('functional_io.outputs', outputs);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Output Type</Label>
                          <Input
                            value={output.output_type || ''}
                            onChange={(e) => {
                              const outputs = [...(formData.functional_io?.outputs || [])];
                              outputs[index] = { ...outputs[index], output_type: e.target.value };
                              updateFormField('functional_io.outputs', outputs);
                            }}
                            className="border-[#D8D8D8]"
                            placeholder="e.g., Electricity, Heat"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Quantity</Label>
                          <Input
                            type="number"
                            value={output.quantity ?? ''}
                            onChange={(e) => {
                              const outputs = [...(formData.functional_io?.outputs || [])];
                              outputs[index] = { ...outputs[index], quantity: e.target.value ? Number(e.target.value) : undefined };
                              updateFormField('functional_io.outputs', outputs);
                            }}
                            className="border-[#D8D8D8]"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Unit</Label>
                          <Select
                            value={output.unit || ''}
                            onValueChange={(v) => {
                              const outputs = [...(formData.functional_io?.outputs || [])];
                              outputs[index] = { ...outputs[index], unit: v };
                              updateFormField('functional_io.outputs', outputs);
                            }}
                          >
                            <SelectTrigger className="border-[#D8D8D8]">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Time Period</Label>
                          <Select
                            value={output.time_period || ''}
                            onValueChange={(v) => {
                              const outputs = [...(formData.functional_io?.outputs || [])];
                              outputs[index] = { ...outputs[index], time_period: v as TimePeriod };
                              updateFormField('functional_io.outputs', outputs);
                            }}
                          >
                            <SelectTrigger className="border-[#D8D8D8]">
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_PERIOD_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Estimated Value (USD)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={output.estimated_financial_value_usd ?? ''}
                            onChange={(e) => {
                              const outputs = [...(formData.functional_io?.outputs || [])];
                              outputs[index] = { ...outputs[index], estimated_financial_value_usd: e.target.value ? Number(e.target.value) : undefined };
                              updateFormField('functional_io.outputs', outputs);
                            }}
                            className="border-[#D8D8D8]"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Value per Year (USD)</Label>
                          <Input
                            type="text"
                            value={valuePerYear !== null ? `$${valuePerYear.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                            readOnly
                            disabled
                            className="border-[#D8D8D8] bg-gray-50"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Variability Profile</Label>
                          <Input
                            value={output.variability_profile || ''}
                            onChange={(e) => {
                              const outputs = [...(formData.functional_io?.outputs || [])];
                              outputs[index] = { ...outputs[index], variability_profile: e.target.value };
                              updateFormField('functional_io.outputs', outputs);
                            }}
                            className="border-[#D8D8D8]"
                            placeholder="e.g., Seasonal"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-[#7A7A7A]">Quality Spec</Label>
                          <Input
                            value={output.quality_spec || ''}
                            onChange={(e) => {
                              const outputs = [...(formData.functional_io?.outputs || [])];
                              outputs[index] = { ...outputs[index], quality_spec: e.target.value };
                              updateFormField('functional_io.outputs', outputs);
                            }}
                            className="border-[#D8D8D8]"
                            placeholder="e.g., Grade A"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Total Output Value per Year */}
                <div className="flex justify-end items-center pt-2 border-t border-[#D8D8D8]">
                  <span className="text-sm font-medium text-[#1A1A1A] mr-3">Total Output Value per Year:</span>
                  <span className="text-lg font-semibold text-green-600">
                    ${(formData.functional_io?.outputs || []).reduce((sum, output) => {
                      const yearly = calculateYearlyValue(output.estimated_financial_value_usd, output.time_period);
                      return sum + (yearly || 0);
                    }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[#7A7A7A] text-sm">No outputs defined. Click "Add Output" to add one.</p>
            )}
          </div>
        </CardContent>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(currentSection - 1)}
            className="border-[#D8D8D8]"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(currentSection + 1)}
              className="border-[#D8D8D8]"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                handleSave();
                setCurrentSection(currentSection + 1);
              }}
              className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
            >
              Save & Next
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Section 6: Economics */}
      {currentSection === 7 && (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Economics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Annual Financial Summary */}
          {(() => {
            const totalInputCost = (formData.functional_io?.inputs || []).reduce((sum, input) => {
              const yearly = calculateYearlyValue(input.estimated_financial_value_usd, input.time_period);
              return sum + (yearly || 0);
            }, 0);
            const totalOutputValue = (formData.functional_io?.outputs || []).reduce((sum, output) => {
              const yearly = calculateYearlyValue(output.estimated_financial_value_usd, output.time_period);
              return sum + (yearly || 0);
            }, 0);
            const netProfit = totalOutputValue - totalInputCost;
            return (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Annual Financial Summary (USD)</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-[#7A7A7A]">Total Input Cost</p>
                    <p className="text-lg font-semibold text-red-600">
                      ${totalInputCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#7A7A7A]">Total Output Value</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${totalOutputValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#7A7A7A]">Net Profit/Cost</p>
                    <p className={`text-lg font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Retail Price (USD)</Label>
              <Input
                type="number"
                value={formData.economics?.retail_price || ''}
                onChange={(e) => updateFormField('economics.retail_price', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Wholesale Price (USD)</Label>
              <Input
                type="number"
                value={formData.economics?.wholesale_price || ''}
                onChange={(e) => updateFormField('economics.wholesale_price', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Minimum Wholesale Quantity</Label>
              <Input
                type="number"
                value={formData.economics?.minimum_wholesale_quantity || ''}
                onChange={(e) => updateFormField('economics.minimum_wholesale_quantity', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Production Lead Time (Days)</Label>
              <Input
                type="number"
                value={formData.economics?.production_lead_time_days || ''}
                onChange={(e) => updateFormField('economics.production_lead_time_days', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Production Capacity (per month)</Label>
              <Input
                type="number"
                value={formData.economics?.production_capacity_per_month || ''}
                onChange={(e) => updateFormField('economics.production_capacity_per_month', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Availability Type</Label>
              <Select
                value={formData.economics?.availability_type || ''}
                onValueChange={(v) => updateFormField('economics.availability_type', v)}
              >
                <SelectTrigger className="border-[#D8D8D8]">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="for_sale">For Sale</SelectItem>
                  <SelectItem value="licensed">Licensed</SelectItem>
                  <SelectItem value="open_source">Open Source</SelectItem>
                  <SelectItem value="proprietary">Proprietary</SelectItem>
                  <SelectItem value="not_available">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(currentSection - 1)}
            className="border-[#D8D8D8]"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(currentSection + 1)}
              className="border-[#D8D8D8]"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                handleSave();
                setCurrentSection(currentSection + 1);
              }}
              className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
            >
              Save & Next
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Section 7: Environmental Impact */}
      {currentSection === 8 && (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Environmental Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Embodied Carbon (kg CO2e)</Label>
              <Input
                type="number"
                value={formData.environmental_impact?.embodied_carbon_kg_co2e || ''}
                onChange={(e) => updateFormField('environmental_impact.embodied_carbon_kg_co2e', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Operational Carbon (kg CO2e/year)</Label>
              <Input
                type="number"
                value={formData.environmental_impact?.operational_carbon_kg_co2e_per_year || ''}
                onChange={(e) => updateFormField('environmental_impact.operational_carbon_kg_co2e_per_year', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Material Toxicity</Label>
              <Select
                value={formData.environmental_impact?.material_toxicity || ''}
                onValueChange={(v) => updateFormField('environmental_impact.material_toxicity', v)}
              >
                <SelectTrigger className="border-[#D8D8D8]">
                  <SelectValue placeholder="Select toxicity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non_toxic">Non-Toxic</SelectItem>
                  <SelectItem value="low_toxicity">Low Toxicity</SelectItem>
                  <SelectItem value="moderate_toxicity">Moderate Toxicity</SelectItem>
                  <SelectItem value="high_toxicity">High Toxicity</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Manufacturing Toxicity</Label>
              <Select
                value={formData.environmental_impact?.manufacturing_toxicity || ''}
                onValueChange={(v) => updateFormField('environmental_impact.manufacturing_toxicity', v)}
              >
                <SelectTrigger className="border-[#D8D8D8]">
                  <SelectValue placeholder="Select emissions level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="low_emissions">Low Emissions</SelectItem>
                  <SelectItem value="moderate_emissions">Moderate Emissions</SelectItem>
                  <SelectItem value="high_emissions">High Emissions</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Recyclability (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.environmental_impact?.recyclability_percent || ''}
                onChange={(e) => updateFormField('environmental_impact.recyclability_percent', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Biodegradation Timeline (years)</Label>
              <Input
                type="number"
                value={formData.environmental_impact?.biodegradation_timeline_years || ''}
                onChange={(e) => updateFormField('environmental_impact.biodegradation_timeline_years', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#1A1A1A]">Regenerative Outputs Notes</Label>
            <Textarea
              value={formData.environmental_impact?.regenerative_outputs_notes || ''}
              onChange={(e) => updateFormField('environmental_impact.regenerative_outputs_notes', e.target.value)}
              rows={3}
              className="border-[#D8D8D8]"
              placeholder="Describe any regenerative or positive environmental outputs..."
            />
          </div>
        </CardContent>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(currentSection - 1)}
            className="border-[#D8D8D8]"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(currentSection + 1)}
              className="border-[#D8D8D8]"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                handleSave();
                setCurrentSection(currentSection + 1);
              }}
              className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
            >
              Save & Next
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Section 8: Human Impact */}
      {currentSection === 9 && (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Human Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Safety Rating</Label>
              <Input
                value={formData.human_impact?.safety_rating || ''}
                onChange={(e) => updateFormField('human_impact.safety_rating', e.target.value)}
                className="border-[#D8D8D8]"
                placeholder="e.g., UL Listed, CE Certified"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Noise Level (dB)</Label>
              <Input
                type="number"
                value={formData.human_impact?.noise_level_db || ''}
                onChange={(e) => updateFormField('human_impact.noise_level_db', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Ergonomics Score (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.human_impact?.ergonomics_score || ''}
                onChange={(e) => updateFormField('human_impact.ergonomics_score', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="1-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#1A1A1A]">Health Benefits Notes</Label>
            <Textarea
              value={formData.human_impact?.health_benefits_notes || ''}
              onChange={(e) => updateFormField('human_impact.health_benefits_notes', e.target.value)}
              rows={2}
              className="border-[#D8D8D8]"
              placeholder="Describe any health benefits..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#1A1A1A]">Risk Factors Notes</Label>
            <Textarea
              value={formData.human_impact?.risk_factors_notes || ''}
              onChange={(e) => updateFormField('human_impact.risk_factors_notes', e.target.value)}
              rows={2}
              className="border-[#D8D8D8]"
              placeholder="Describe any risk factors..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#1A1A1A]">Social Benefit Notes</Label>
            <Textarea
              value={formData.human_impact?.social_benefit_notes || ''}
              onChange={(e) => updateFormField('human_impact.social_benefit_notes', e.target.value)}
              rows={2}
              className="border-[#D8D8D8]"
              placeholder="Describe any social benefits..."
            />
          </div>
        </CardContent>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(currentSection - 1)}
            className="border-[#D8D8D8]"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(currentSection + 1)}
              className="border-[#D8D8D8]"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                handleSave();
                setCurrentSection(currentSection + 1);
              }}
              className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
            >
              Save & Next
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Section 9: Deployment */}
      {currentSection === 10 && (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Deployment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Min Operating Temperature (°C)</Label>
              <Input
                type="number"
                value={formData.deployment?.min_operating_temperature || ''}
                onChange={(e) => updateFormField('deployment.min_operating_temperature', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="-40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Max Operating Temperature (°C)</Label>
              <Input
                type="number"
                value={formData.deployment?.max_operating_temperature || ''}
                onChange={(e) => updateFormField('deployment.max_operating_temperature', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Min Relative Humidity (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.deployment?.min_relative_humidity || ''}
                onChange={(e) => updateFormField('deployment.min_relative_humidity', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Max Relative Humidity (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.deployment?.max_relative_humidity || ''}
                onChange={(e) => updateFormField('deployment.max_relative_humidity', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Max Wind Speed Rating (m/s)</Label>
              <Input
                type="number"
                value={formData.deployment?.max_wind_speed_rating || ''}
                onChange={(e) => updateFormField('deployment.max_wind_speed_rating', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Max Rainfall Intensity (mm/hr)</Label>
              <Input
                type="number"
                value={formData.deployment?.max_rainfall_intensity || ''}
                onChange={(e) => updateFormField('deployment.max_rainfall_intensity', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#1A1A1A]">Geographic Suitability Notes</Label>
            <Textarea
              value={formData.deployment?.geographic_suitability_notes || ''}
              onChange={(e) => updateFormField('deployment.geographic_suitability_notes', e.target.value)}
              rows={3}
              className="border-[#D8D8D8]"
              placeholder="Describe geographic suitability..."
            />
          </div>
        </CardContent>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(currentSection - 1)}
            className="border-[#D8D8D8]"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(currentSection + 1)}
              className="border-[#D8D8D8]"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                handleSave();
                setCurrentSection(currentSection + 1);
              }}
              className="bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
            >
              Save & Next
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Section 10: Review & Submit */}
      {currentSection === 11 && (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Review & Submit</CardTitle>
          <p className="text-sm text-[#7A7A7A] mt-1">
            Review your asset information and submit for approval when ready.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Asset Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Name:</span>{' '}
                <span className="text-blue-800">{formData.basic_information?.asset_name || 'Not set'}</span>
              </div>
              <div>
                <span className="text-blue-600">Type:</span>{' '}
                <span className="text-blue-800">{formData.asset_type || 'Not set'}</span>
              </div>
              <div>
                <span className="text-blue-600">Status:</span>{' '}
                <span className="text-blue-800">{formData.system_meta?.status || 'draft'}</span>
              </div>
              <div>
                <span className="text-blue-600">Categories:</span>{' '}
                <span className="text-blue-800">
                  {formData.basic_information?.categories?.map(c => c.primary).join(', ') || 'Not set'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSave}
              variant="outline"
              className="w-full border-[#1B4FFF] text-[#1B4FFF]"
            >
              Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              className="w-full bg-[#1B4FFF] hover:bg-[#1B4FFF]/90"
            >
              Submit for Review
            </Button>
          </div>
        </CardContent>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(currentSection - 1)}
            className="border-[#D8D8D8]"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="border-[#D8D8D8]"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Error displays */}
      {updateMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Save failed: {updateMutation.error instanceof Error ? updateMutation.error.message : 'Unknown error'}
        </div>
      )}

      {submitMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Submit failed: {submitMutation.error instanceof Error ? submitMutation.error.message : 'Unknown error'}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(`/assets/${id}`)}
          className="border-[#D8D8D8] text-[#4A4A4A]"
        >
          View Details
        </Button>
        <div className="flex space-x-4">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-[#1B4FFF] hover:bg-[#0F2C8C] text-white"
          >
            {updateMutation.isPending ? <Spinner className="w-4 h-4 mr-2" /> : null}
            Save
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || asset.system_meta?.status !== 'draft'}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {submitMutation.isPending ? <Spinner className="w-4 h-4 mr-2" /> : null}
            Submit for Review
          </Button>
        </div>
      </div>

      {/* Attach File Modal */}
      <Dialog open={showFileModal} onOpenChange={setShowFileModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach File URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target</Label>
              <Select value={fileTarget} onValueChange={setFileTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TARGETS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://example.com/file.pdf"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFileModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAttachFile}
              disabled={!fileTarget || !fileUrl || attachFileMutation.isPending}
              className="bg-[#1B4FFF] text-white"
            >
              {attachFileMutation.isPending ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Attach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Extract Modal */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run AI Prefill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useUploadedDocs"
                checked={useUploadedDocs}
                onCheckedChange={(checked) => setUseUploadedDocs(checked as boolean)}
              />
              <Label htmlFor="useUploadedDocs">Use uploaded documents</Label>
            </div>
            <div className="space-y-2">
              <Label>Extra Document URLs</Label>
              <Textarea
                value={extraDocUrls}
                onChange={(e) => setExtraDocUrls(e.target.value)}
                placeholder="Enter URLs, one per line"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAIExtract}
              disabled={aiExtractMutation.isPending}
              className="bg-[#1B4FFF] text-white"
            >
              {aiExtractMutation.isPending ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Run AI Prefill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suggest Category Modal */}
      <SuggestCategoryModal
        open={showSuggestModal}
        onOpenChange={setShowSuggestModal}
        primaryCategories={categoriesData?.categories.map(c => c.primary) || []}
      />
    </div>
  );
}
