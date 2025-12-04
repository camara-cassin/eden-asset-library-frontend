import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createAsset, uploadFiles, aiExtract } from '../api/assets';
import { getAssetTypes, getCategories } from '../api/reference';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { CategorySelector } from '@/components/CategorySelector';
import { SuggestCategoryModal } from '@/components/SuggestCategoryModal';
import type { AssetType, CategorySelection } from '../types/asset';

interface ValidationErrors {
  assetType?: string;
  assetName?: string;
  categories?: string;
}

interface UploadedFile {
  file: File;
  docType: 'technical_spec' | 'cad_files' | 'engineering_drawings' | 'manuals' | 'images' | 'general';
}

const DOC_TYPE_LABELS: Record<string, string> = {
  technical_spec: 'Technical Specifications',
  cad_files: 'CAD Files',
  engineering_drawings: 'Engineering Drawings',
  manuals: 'Manuals & Instructions',
  images: 'Product Images',
  general: 'Other Documents',
};

export function CreateAsset() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state - simplified onboarding fields only
  const [assetType, setAssetType] = useState<AssetType>('physical');
  const [assetName, setAssetName] = useState('');
  const [categories, setCategories] = useState<CategorySelection[]>([]);
  const [shortSummary, setShortSummary] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentDocType, setCurrentDocType] = useState<UploadedFile['docType']>('general');
  
  // Validation and UI state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Suggest category modal state
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!assetType) {
      errors.assetType = 'Asset type is required';
    }
    if (!assetName.trim()) {
      errors.assetName = 'Asset name is required';
    }
    if (categories.length === 0) {
      errors.categories = 'At least one category is required';
    } else if (categories.length > 4) {
      errors.categories = 'Maximum 4 categories allowed';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Fetch reference data
  const { data: assetTypes } = useQuery({
    queryKey: ['assetTypes'],
    queryFn: getAssetTypes,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: async (data) => {
      const assetId = data.id;
      
      // If there are files to upload, upload them
      if (uploadedFiles.length > 0 && assetId) {
        setIsUploading(true);
        try {
          // Group files by doc type
          const filesByType = uploadedFiles.reduce((acc, { file, docType }) => {
            if (!acc[docType]) acc[docType] = [];
            acc[docType].push(file);
            return acc;
          }, {} as Record<string, File[]>);
          
          // Upload each group
          for (const [docType, files] of Object.entries(filesByType)) {
            await uploadFiles(assetId, files, docType as UploadedFile['docType']);
          }
        } catch (error) {
          console.error('File upload error:', error);
          setUploadError('Some files failed to upload. You can add them later in the edit page.');
        } finally {
          setIsUploading(false);
        }
      }
      
      // Navigate to edit page
      navigate(`/assets/${assetId}/edit`);
    },
  });

  // AI Extract mutation
  const extractMutation = useMutation({
    mutationFn: async (assetId: string) => {
      return aiExtract(assetId, {
        website_url: websiteUrl || undefined,
        use_uploaded_docs: true,
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      file,
      docType: currentDocType,
    }));
    
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all required fields as touched
    setTouched({
      assetType: true,
      assetName: true,
      categories: true,
    });
    
    if (!validateForm()) {
      return;
    }
    
    createMutation.mutate({
      asset_type: assetType,
      basic_information: {
        asset_name: assetName,
        categories,
        short_summary: shortSummary || undefined,
        company_name: companyName || undefined,
        company_website_url: websiteUrl || undefined,
      },
    });
  };

  const handleExtractWithAI = async () => {
    // First, validate and create the asset
    setTouched({
      assetType: true,
      assetName: true,
      categories: true,
    });
    
    if (!validateForm()) {
      return;
    }
    
    setIsExtracting(true);
    
    try {
      // Create the asset first
      const asset = await createMutation.mutateAsync({
        asset_type: assetType,
        basic_information: {
          asset_name: assetName,
          categories,
          short_summary: shortSummary || undefined,
          company_name: companyName || undefined,
          company_website_url: websiteUrl || undefined,
        },
      });
      
      const assetId = asset.id;
      if (!assetId) {
        throw new Error('Asset ID not returned');
      }
      
      // Upload files if any
      if (uploadedFiles.length > 0) {
        setIsUploading(true);
        const filesByType = uploadedFiles.reduce((acc, { file, docType }) => {
          if (!acc[docType]) acc[docType] = [];
          acc[docType].push(file);
          return acc;
        }, {} as Record<string, File[]>);
        
        for (const [docType, files] of Object.entries(filesByType)) {
          await uploadFiles(assetId, files, docType as UploadedFile['docType']);
        }
        setIsUploading(false);
      }
      
      // Trigger AI extraction
      await extractMutation.mutateAsync(assetId);
      
      // Navigate to edit page
      navigate(`/assets/${assetId}/edit`);
    } catch (error) {
      console.error('Extract with AI error:', error);
      setIsExtracting(false);
    }
  };

  const formatAssetType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const isProcessing = createMutation.isPending || isUploading || isExtracting;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Add New Asset</h1>
        <p className="text-[#7A7A7A] mt-1">
          Enter only the basics and upload any documents or a product URL. AI will help extract the detailed specifications later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-[#1A1A1A]">Basic Information</CardTitle>
            <CardDescription>Required fields to create your asset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assetName" className="text-[#1A1A1A]">Asset Name *</Label>
                <Input
                  id="assetName"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  onBlur={() => handleBlur('assetName')}
                  placeholder="e.g., Solar Roof Tile X100"
                  className={`border-[#D8D8D8] focus:ring-[#1B4FFF] ${touched.assetName && validationErrors.assetName ? 'border-red-500' : ''}`}
                />
                {touched.assetName && validationErrors.assetName && (
                  <p className="text-sm text-red-500">{validationErrors.assetName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetType" className="text-[#1A1A1A]">Asset Type *</Label>
                <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
                  <SelectTrigger className={`border-[#D8D8D8] ${touched.assetType && validationErrors.assetType ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes?.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatAssetType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.assetType && validationErrors.assetType && (
                  <p className="text-sm text-red-500">{validationErrors.assetType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-[#1A1A1A]">Supplier Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., SolarTech Inc."
                  className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                />
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Categories * (select 1-4)</Label>
              <CategorySelector
                value={categories}
                onChange={setCategories}
                maxCategories={4}
                minCategories={1}
                showSuggestLink={true}
                onSuggestCategory={() => setShowSuggestModal(true)}
              />
              {touched.categories && validationErrors.categories && (
                <p className="text-sm text-red-500">{validationErrors.categories}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortSummary" className="text-[#1A1A1A]">Short Summary</Label>
              <Textarea
                id="shortSummary"
                value={shortSummary}
                onChange={(e) => setShortSummary(e.target.value)}
                placeholder="Brief description of the asset and its purpose"
                rows={3}
                className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="text-[#1A1A1A]">Website / Product URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com/product"
                className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
              />
              <p className="text-sm text-[#7A7A7A]">
                AI will use this URL (plus any documents you upload) to pre-fill technical details, specs, and impact fields.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Document Uploads */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-[#1A1A1A]">Documentation</CardTitle>
            <CardDescription>
              Upload technical specs, CAD files, manuals, and other documents. AI will extract information from these.
            </CardDescription>
            <p className="text-sm text-[#7A7A7A] mt-1">
              You can leave this empty if you don't have files yet. A URL alone is enough to start.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="docType" className="text-[#1A1A1A]">Document Type</Label>
                <Select value={currentDocType} onValueChange={(v) => setCurrentDocType(v as UploadedFile['docType'])}>
                  <SelectTrigger className="border-[#D8D8D8]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-[#1B4FFF] text-[#1B4FFF]"
                >
                  Select Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.dwg,.dxf,.step,.stp,.iges,.igs,.stl,.obj,.jpg,.jpeg,.png,.gif,.webp"
                />
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Selected Files ({uploadedFiles.length})</Label>
                <div className="border border-[#D8D8D8] rounded-lg divide-y divide-[#D8D8D8]">
                  {uploadedFiles.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A] truncate">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-[#7A7A7A]">
                          {DOC_TYPE_LABELS[item.docType]} - {(item.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadedFiles.length === 0 && (
              <div className="border-2 border-dashed border-[#D8D8D8] rounded-lg p-8 text-center">
                <p className="text-[#7A7A7A]">
                  No files selected. Upload technical specs, CAD files, manuals, or images.
                </p>
                <p className="text-sm text-[#7A7A7A] mt-1">
                  Supported: PDF, DOC, DWG, DXF, STEP, STL, JPG, PNG
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error display */}
        {(createMutation.isError || uploadError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {createMutation.error instanceof Error ? createMutation.error.message : uploadError || 'An error occurred'}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
            className="border-[#D8D8D8] text-[#7A7A7A]"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isProcessing}
            variant="outline"
            className="border-[#1B4FFF] text-[#1B4FFF]"
          >
            {createMutation.isPending && !isExtracting ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Saving...
              </>
            ) : (
              'Save Draft'
            )}
          </Button>
          <Button
            type="button"
            onClick={handleExtractWithAI}
            disabled={isProcessing}
            className="bg-[#1B4FFF] hover:bg-[#0F2C8C] text-white"
          >
            {isExtracting ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Extracting...'}
              </>
            ) : (
              'Extract with AI'
            )}
          </Button>
        </div>

        <p className="text-sm text-[#7A7A7A] text-center">
          "Extract with AI" will create the asset, upload your files, and use AI to pre-fill detailed specifications.
          You can review and edit all fields on the next page.
        </p>
      </form>

      {/* Suggest Category Modal */}
      <SuggestCategoryModal
        open={showSuggestModal}
        onOpenChange={setShowSuggestModal}
        primaryCategories={categoriesData?.categories.map(c => c.primary) || []}
      />
    </div>
  );
}
