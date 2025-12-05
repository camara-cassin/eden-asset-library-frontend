import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
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

const STORAGE_KEY = 'eden_create_asset_draft';

interface ValidationErrors {
  assetType?: string;
  assetName?: string;
  categories?: string;
}

interface UploadedFile {
  file: File;
  docType: 'technical_spec' | 'cad_files' | 'engineering_drawings' | 'manuals' | 'images' | 'general';
}

interface FormData {
  assetType: AssetType;
  assetName: string;
  categories: CategorySelection[];
  shortSummary: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  websiteUrl: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  technical_spec: 'Technical Specifications',
  cad_files: 'CAD Files',
  engineering_drawings: 'Engineering Drawings',
  manuals: 'Manuals & Instructions',
  images: 'Product Images',
  general: 'Other Documents',
};

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Name, type, and categories' },
  { id: 2, name: 'Supplier', description: 'Company and contact details' },
  { id: 3, name: 'Documentation', description: 'Upload files and URLs' },
  { id: 4, name: 'Review', description: 'Review and submit' },
];

const getInitialFormData = (): FormData => {
  // Try to load from localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        assetType: parsed.assetType || 'physical',
        assetName: parsed.assetName || '',
        categories: parsed.categories || [],
        shortSummary: parsed.shortSummary || '',
        companyName: parsed.companyName || '',
        companyEmail: parsed.companyEmail || '',
        companyPhone: parsed.companyPhone || '',
        websiteUrl: parsed.websiteUrl || '',
      };
    }
  } catch (e) {
    console.error('Failed to load draft from localStorage:', e);
  }
  
  return {
    assetType: 'physical',
    assetName: '',
    categories: [],
    shortSummary: '',
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    websiteUrl: '',
  };
};

export function CreateAsset() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current step (1-4)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state with auto-save
  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  
  // File upload state (not saved to localStorage - files can't be serialized)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentDocType, setCurrentDocType] = useState<UploadedFile['docType']>('general');
  
  // Validation and UI state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Suggest category modal state
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  // Auto-save to localStorage whenever form data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.error('Failed to save draft to localStorage:', e);
    }
  }, [formData]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear draft from localStorage:', e);
    }
  }, []);

  // Update form data helper
  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const validateStep1 = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.assetType) {
      errors.assetType = 'Asset type is required';
    }
    if (!formData.assetName.trim()) {
      errors.assetName = 'Asset name is required';
    }
    if (formData.categories.length === 0) {
      errors.categories = 'At least one category is required';
    } else if (formData.categories.length > 4) {
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
      
      // Clear the draft from localStorage on success
      clearDraft();
      
      // Navigate to edit page
      navigate(`/assets/${assetId}/edit`);
    },
    onError: (error) => {
      // Extract detailed error message from backend
      let errorMessage = 'Failed to create asset. Please try again.';
      
      if (axios.isAxiosError(error) && error.response?.data) {
        const detail = error.response.data.detail;
        if (detail?.error?.message) {
          errorMessage = detail.error.message;
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
      // Don't clear form data on error - preserve user input
    },
  });

  // AI Extract mutation
  const extractMutation = useMutation({
    mutationFn: async (assetId: string) => {
      return aiExtract(assetId, {
        website_url: formData.websiteUrl || undefined,
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

  const handleNext = () => {
    if (currentStep === 1) {
      setTouched({
        assetType: true,
        assetName: true,
        categories: true,
      });
      
      if (!validateStep1()) {
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    // Clear any previous errors
    setSubmitError(null);
    
    // Final validation
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    
    createMutation.mutate({
      asset_type: formData.assetType,
      basic_information: {
        asset_name: formData.assetName,
        categories: formData.categories,
        short_summary: formData.shortSummary || undefined,
        company_name: formData.companyName || undefined,
        company_email: formData.companyEmail || undefined,
        company_phone: formData.companyPhone || undefined,
        company_website_url: formData.websiteUrl || undefined,
      },
    });
  };

  const handleExtractWithAI = async () => {
    // Clear any previous errors
    setSubmitError(null);
    
    // Final validation
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    
    setIsExtracting(true);
    
    try {
      // Create the asset first
      const asset = await createMutation.mutateAsync({
        asset_type: formData.assetType,
        basic_information: {
          asset_name: formData.assetName,
          categories: formData.categories,
          short_summary: formData.shortSummary || undefined,
          company_name: formData.companyName || undefined,
          company_email: formData.companyEmail || undefined,
          company_phone: formData.companyPhone || undefined,
          company_website_url: formData.websiteUrl || undefined,
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
      
      // Clear the draft from localStorage on success
      clearDraft();
      
      // Navigate to edit page
      navigate(`/assets/${assetId}/edit`);
    } catch (error) {
      console.error('Extract with AI error:', error);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create asset. Please try again.';
      
      if (axios.isAxiosError(error) && error.response?.data) {
        const detail = error.response.data.detail;
        if (detail?.error?.message) {
          errorMessage = detail.error.message;
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
      setIsExtracting(false);
    }
  };

  const formatAssetType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const isProcessing = createMutation.isPending || isUploading || isExtracting;

  // Step indicator component
  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.id
                    ? 'bg-[#1B4FFF] text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-[#1A1A1A]' : 'text-gray-500'}`}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-400 hidden sm:block">{step.description}</p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-1 w-12 sm:w-24 mx-2 ${
                  currentStep > step.id ? 'bg-[#1B4FFF]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Step 1: Basic Information
  const renderStep1 = () => (
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
              value={formData.assetName}
              onChange={(e) => updateFormData({ assetName: e.target.value })}
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
            <Select value={formData.assetType} onValueChange={(v) => updateFormData({ assetType: v as AssetType })}>
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
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <Label className="text-[#1A1A1A]">Categories * (select 1-4)</Label>
          <CategorySelector
            value={formData.categories}
            onChange={(categories) => updateFormData({ categories })}
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
            value={formData.shortSummary}
            onChange={(e) => updateFormData({ shortSummary: e.target.value })}
            placeholder="Brief description of the asset and its purpose"
            rows={3}
            className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
          />
        </div>
      </CardContent>
    </Card>
  );

  // Step 2: Supplier Information
  const renderStep2 = () => (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-[#1A1A1A]">Supplier Information</CardTitle>
        <CardDescription>Company and contact details (optional)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-[#1A1A1A]">Company Name</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => updateFormData({ companyName: e.target.value })}
              placeholder="e.g., SolarTech Inc."
              className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl" className="text-[#1A1A1A]">Website / Product URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => updateFormData({ websiteUrl: e.target.value })}
              placeholder="https://example.com/product"
              className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyEmail" className="text-[#1A1A1A]">Contact Email</Label>
            <Input
              id="companyEmail"
              type="email"
              value={formData.companyEmail}
              onChange={(e) => updateFormData({ companyEmail: e.target.value })}
              placeholder="contact@company.com"
              className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyPhone" className="text-[#1A1A1A]">Contact Phone</Label>
            <Input
              id="companyPhone"
              type="tel"
              value={formData.companyPhone}
              onChange={(e) => updateFormData({ companyPhone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
            />
          </div>
        </div>

        <p className="text-sm text-[#7A7A7A]">
          AI will use the website URL (plus any documents you upload) to pre-fill technical details, specs, and impact fields.
        </p>
      </CardContent>
    </Card>
  );

  // Step 3: Documentation
  const renderStep3 = () => (
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
  );

  // Step 4: Review
  const renderStep4 = () => (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-[#1A1A1A]">Review Your Asset</CardTitle>
        <CardDescription>Please review the information before submitting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info Summary */}
        <div className="space-y-2">
          <h3 className="font-medium text-[#1A1A1A]">Basic Information</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-[#7A7A7A]">Asset Name:</span>
              <span className="font-medium">{formData.assetName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7A7A]">Asset Type:</span>
              <span className="font-medium">{formatAssetType(formData.assetType)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7A7A]">Categories:</span>
              <span className="font-medium">
                {formData.categories.length > 0 
                  ? formData.categories.map(c => c.primary).join(', ')
                  : '-'}
              </span>
            </div>
            {formData.shortSummary && (
              <div>
                <span className="text-[#7A7A7A]">Summary:</span>
                <p className="mt-1 text-sm">{formData.shortSummary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Supplier Info Summary */}
        <div className="space-y-2">
          <h3 className="font-medium text-[#1A1A1A]">Supplier Information</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-[#7A7A7A]">Company:</span>
              <span className="font-medium">{formData.companyName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7A7A]">Email:</span>
              <span className="font-medium">{formData.companyEmail || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7A7A]">Phone:</span>
              <span className="font-medium">{formData.companyPhone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7A7A]">Website:</span>
              <span className="font-medium truncate max-w-[200px]">{formData.websiteUrl || '-'}</span>
            </div>
          </div>
        </div>

        {/* Files Summary */}
        <div className="space-y-2">
          <h3 className="font-medium text-[#1A1A1A]">Documentation</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {uploadedFiles.length > 0 ? (
              <ul className="space-y-1">
                {uploadedFiles.map((item, index) => (
                  <li key={index} className="text-sm">
                    {item.file.name} ({DOC_TYPE_LABELS[item.docType]})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#7A7A7A]">No files uploaded</p>
            )}
          </div>
        </div>

        <p className="text-sm text-[#7A7A7A]">
          After creating the asset, you can add more details on the edit page. 
          Use "Extract with AI" to automatically fill in technical specifications from your documents and website.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Add New Asset</h1>
        <p className="text-[#7A7A7A] mt-1">
          Enter the basics and upload any documents or a product URL. AI will help extract the detailed specifications later.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator />

      {/* Auto-save indicator */}
      <div className="text-sm text-[#7A7A7A] flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        Draft auto-saved
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      {/* Error display */}
      {(submitError || uploadError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {submitError || uploadError}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
            className="border-[#D8D8D8] text-[#7A7A7A]"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="border-[#D8D8D8] text-[#1A1A1A]"
              disabled={isProcessing}
            >
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-[#1B4FFF] hover:bg-[#0F2C8C] text-white"
              disabled={isProcessing}
            >
              Next
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={handleSubmit}
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
            </>
          )}
        </div>
      </div>

      {currentStep === 4 && (
        <p className="text-sm text-[#7A7A7A] text-center">
          "Extract with AI" will create the asset, upload your files, and use AI to pre-fill detailed specifications.
          You can review and edit all fields on the next page.
        </p>
      )}

      {/* Suggest Category Modal */}
      <SuggestCategoryModal
        open={showSuggestModal}
        onOpenChange={setShowSuggestModal}
        primaryCategories={categoriesData?.categories.map(c => c.primary) || []}
      />
    </div>
  );
}
