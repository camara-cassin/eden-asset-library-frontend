import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAsset, updateAsset, submitAsset, attachFile, aiExtract } from '../api/assets';
import { getAssetTypes, getCategories, getSubcategories, getScalingPotentials } from '../api/reference';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { EdenAsset, AssetImage } from '../types/asset';

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

const AVAILABILITY_TYPES = [
  { value: 'for_sale', label: 'For Sale' },
  { value: 'licensed', label: 'Licensed' },
  { value: 'open_source', label: 'Open Source' },
  { value: 'proprietary', label: 'Proprietary' },
  { value: 'not_available', label: 'Not Available' },
];

const GENERATES_REVENUE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'maybe', label: 'Maybe' },
];

export function EditAsset() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modal states
  const [showFileModal, setShowFileModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [fileTarget, setFileTarget] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  
  // Image modal state
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<EdenAsset>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_hasChanges, setHasChanges] = useState(false);

  // Fetch asset
  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => getAsset(id!),
    enabled: !!id,
  });

  // Fetch reference data
  const { data: assetTypes } = useQuery({
    queryKey: ['assetTypes'],
    queryFn: getAssetTypes,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: subcategories } = useQuery({
    queryKey: ['subcategories', formData.basic_information?.category],
    queryFn: () => getSubcategories(formData.basic_information?.category),
    enabled: !!formData.basic_information?.category,
  });

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
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
  });

  // AI extract mutation - simplified for MVP (always uses uploaded docs)
  const aiExtractMutation = useMutation({
    mutationFn: () =>
      aiExtract(id!, {
        sources: {
          use_uploaded_docs: true,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
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

  // Image management functions
  const addImage = () => {
    if (!newImageUrl) return;
    const currentImages = formData.overview?.images || [];
    const isFirst = currentImages.length === 0;
    const newImage: AssetImage = {
      url: newImageUrl,
      caption: newImageCaption || undefined,
      is_primary: isFirst, // First image is automatically primary
    };
    updateFormField('overview.images', [...currentImages, newImage]);
    setNewImageUrl('');
    setNewImageCaption('');
    setShowImageModal(false);
  };

  const removeImage = (index: number) => {
    const currentImages = formData.overview?.images || [];
    const removedImage = currentImages[index];
    const newImages = currentImages.filter((_, i) => i !== index);
    // If we removed the primary image, make the first remaining image primary
    if (removedImage?.is_primary && newImages.length > 0) {
      newImages[0] = { ...newImages[0], is_primary: true };
    }
    updateFormField('overview.images', newImages);
  };

  const setPrimaryImage = (index: number) => {
    const currentImages = formData.overview?.images || [];
    const newImages = currentImages.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    updateFormField('overview.images', newImages);
  };

  // Check asset type for conditional rendering
  const isPhysicalOrHybrid = formData.asset_type === 'physical' || formData.asset_type === 'hybrid';
  const isPlan = formData.asset_type === 'plan';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-8 h-8 text-[#1B4FFF]" />
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
            {lastSaved && (
              <span className="text-sm text-[#7A7A7A]">
                Last saved at {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFileModal(true)}
            className="border-[#1B4FFF] text-[#1B4FFF]"
          >
            Attach File URL
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Basic Information</CardTitle>
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
              <Label className="text-[#1A1A1A]">Category</Label>
              <Select
                value={formData.basic_information?.category || ''}
                onValueChange={(v) => updateFormField('basic_information.category', v)}
              >
                <SelectTrigger className="border-[#D8D8D8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Subcategory</Label>
              <Select
                value={formData.basic_information?.subcategory || ''}
                onValueChange={(v) => updateFormField('basic_information.subcategory', v)}
              >
                <SelectTrigger className="border-[#D8D8D8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subcategories?.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label className="text-[#1A1A1A]">Short Summary</Label>
            <Textarea
              value={formData.basic_information?.short_summary || ''}
              onChange={(e) => updateFormField('basic_information.short_summary', e.target.value)}
              rows={3}
              className="border-[#D8D8D8]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Supplier / Creator (conditional based on asset_type) */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">
            {isPlan ? 'Creator Information' : 'Supplier Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPhysicalOrHybrid && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Company Name *</Label>
                <Input
                  value={formData.basic_information?.company_name || ''}
                  onChange={(e) => updateFormField('basic_information.company_name', e.target.value)}
                  placeholder="Enter company name"
                  className="border-[#D8D8D8]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Company Email *</Label>
                <Input
                  type="email"
                  value={formData.basic_information?.company_email || ''}
                  onChange={(e) => updateFormField('basic_information.company_email', e.target.value)}
                  placeholder="company@example.com"
                  className="border-[#D8D8D8]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Company Website URL *</Label>
                <Input
                  type="url"
                  value={formData.basic_information?.company_website_url || ''}
                  onChange={(e) => updateFormField('basic_information.company_website_url', e.target.value)}
                  placeholder="https://company.com"
                  className="border-[#D8D8D8]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Product URL *</Label>
                <Input
                  type="url"
                  value={formData.basic_information?.original_source_url || ''}
                  onChange={(e) => updateFormField('basic_information.original_source_url', e.target.value)}
                  placeholder="https://company.com/product"
                  className="border-[#D8D8D8]"
                />
                <p className="text-sm text-[#7A7A7A]">Main URL used by AI and humans to learn more</p>
              </div>
            </div>
          )}
          {isPlan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Creator Name *</Label>
                <Input
                  value={formData.basic_information?.creator_name || ''}
                  onChange={(e) => updateFormField('basic_information.creator_name', e.target.value)}
                  placeholder="Enter creator name"
                  className="border-[#D8D8D8]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Creator Email *</Label>
                <Input
                  type="email"
                  value={formData.basic_information?.creator_email || ''}
                  onChange={(e) => updateFormField('basic_information.creator_email', e.target.value)}
                  placeholder="creator@example.com"
                  className="border-[#D8D8D8]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Organization</Label>
                <Input
                  value={formData.basic_information?.creator_organization || ''}
                  onChange={(e) => updateFormField('basic_information.creator_organization', e.target.value)}
                  placeholder="Organization name (optional)"
                  className="border-[#D8D8D8]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Original Source URL</Label>
                <Input
                  type="url"
                  value={formData.basic_information?.original_source_url || ''}
                  onChange={(e) => updateFormField('basic_information.original_source_url', e.target.value)}
                  placeholder="https://example.com/plan"
                  className="border-[#D8D8D8]"
                />
                <p className="text-sm text-[#7A7A7A]">Optional but encouraged</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contributor (simplified for MVP - read-only display) */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Contributor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Your Name</Label>
              <Input
                value={formData.contributor?.name || ''}
                onChange={(e) => updateFormField('contributor.name', e.target.value)}
                placeholder="Your name"
                className="border-[#D8D8D8]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Your Email</Label>
              <Input
                type="email"
                value={formData.contributor?.email || ''}
                onChange={(e) => updateFormField('contributor.email', e.target.value)}
                placeholder="you@example.com"
                className="border-[#D8D8D8]"
              />
            </div>
          </div>
          <p className="text-sm text-[#7A7A7A]">
            This identifies you as the person submitting this asset to the library.
          </p>
        </CardContent>
      </Card>

      {/* Images Section */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-[#1A1A1A]">Images *</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImageModal(true)}
            className="border-[#1B4FFF] text-[#1B4FFF]"
          >
            Add Image
          </Button>
        </CardHeader>
        <CardContent>
          {formData.overview?.images && formData.overview.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.overview.images.map((img, index) => (
                <div key={index} className="relative border rounded-lg p-2">
                  <img
                    src={img.url}
                    alt={img.caption || `Image ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  {img.is_primary && (
                    <Badge className="absolute top-1 left-1 bg-[#1B4FFF]">Primary</Badge>
                  )}
                  <div className="mt-2 space-y-1">
                    {img.caption && (
                      <p className="text-xs text-[#7A7A7A] truncate">{img.caption}</p>
                    )}
                    <div className="flex space-x-1">
                      {!img.is_primary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPrimaryImage(index)}
                          className="text-xs px-2 py-1"
                        >
                          Set Primary
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="text-xs px-2 py-1 text-red-600 border-red-200"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#7A7A7A]">No images added yet. At least one image is required.</p>
          )}
        </CardContent>
      </Card>

      {/* Economics Section */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Economics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Retail Price (USD) *</Label>
              <Input
                type="number"
                value={formData.economics?.retail_price || ''}
                onChange={(e) => updateFormField('economics.retail_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
                className="border-[#D8D8D8]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Availability Type *</Label>
              <Select
                value={formData.economics?.availability_type || ''}
                onValueChange={(v) => updateFormField('economics.availability_type', v)}
              >
                <SelectTrigger className="border-[#D8D8D8]">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Does this product produce revenue? *</Label>
              <Select
                value={formData.economics?.generates_revenue || ''}
                onValueChange={(v) => updateFormField('economics.generates_revenue', v)}
              >
                <SelectTrigger className="border-[#D8D8D8]">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {GENERATES_REVENUE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(formData.economics?.generates_revenue === 'yes' || formData.economics?.generates_revenue === 'maybe') && (
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]">Estimated Annual Net Profit (USD)</Label>
                <Input
                  type="number"
                  value={formData.economics?.estimated_annual_net_profit_usd || ''}
                  onChange={(e) => updateFormField('economics.estimated_annual_net_profit_usd', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0.00"
                  className="border-[#D8D8D8]"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Wholesale Price (USD)</Label>
              <Input
                type="number"
                value={formData.economics?.wholesale_price || ''}
                onChange={(e) => updateFormField('economics.wholesale_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00 (optional)"
                className="border-[#D8D8D8]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Minimum Wholesale Quantity</Label>
              <Input
                type="number"
                value={formData.economics?.minimum_wholesale_quantity || ''}
                onChange={(e) => updateFormField('economics.minimum_wholesale_quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0 (optional)"
                className="border-[#D8D8D8]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation & Links */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Documentation & Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Technical Spec Sheet URL</Label>
              <Input
                type="url"
                value={formData.documentation_uploads?.technical_spec_sheet_url || ''}
                onChange={(e) => updateFormField('documentation_uploads.technical_spec_sheet_url', e.target.value || undefined)}
                placeholder="https://example.com/spec-sheet.pdf"
                className="border-[#D8D8D8]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Product Datasheet URL</Label>
              <Input
                type="url"
                value={formData.documentation_uploads?.product_datasheet_url || ''}
                onChange={(e) => updateFormField('documentation_uploads.product_datasheet_url', e.target.value || undefined)}
                placeholder="https://example.com/datasheet.pdf"
                className="border-[#D8D8D8]"
              />
            </div>
          </div>
          <p className="text-sm text-[#7A7A7A]">
            At least one documentation URL is required (or use the Product URL in Supplier Information).
          </p>
          
          {/* Show existing uploaded docs */}
          {asset.documentation_uploads && Object.entries(asset.documentation_uploads).some(([, v]) => v && (Array.isArray(v) ? v.length > 0 : true)) && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">Uploaded Documents:</p>
              <div className="space-y-1">
                {Object.entries(asset.documentation_uploads).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) return null;
                  return (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-[#4A4A4A]">{key.replace(/_/g, ' ')}: </span>
                      <span className="text-[#1B4FFF]">
                        {Array.isArray(value) ? value.length + ' files' : '1 file'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Summary Section (Read-Only) */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-[#1A1A1A]">AI Summary</CardTitle>
          <div className="flex items-center space-x-2">
            {asset.ai_assistance?.prefill_status && (
              <Badge 
                className={
                  asset.ai_assistance.prefill_status === 'complete' ? 'bg-green-100 text-green-700' :
                  asset.ai_assistance.prefill_status === 'running' ? 'bg-blue-100 text-blue-700' :
                  asset.ai_assistance.prefill_status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }
              >
                {asset.ai_assistance.prefill_status}
              </Badge>
            )}
            <Button
              onClick={handleAIExtract}
              disabled={aiExtractMutation.isPending}
              className="bg-[#1B4FFF] hover:bg-[#0F2C8C] text-white"
            >
              {aiExtractMutation.isPending ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Run AI Extraction
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {asset.ai_assistance?.prefill_message && (
            <p className="text-sm text-[#7A7A7A] italic">{asset.ai_assistance.prefill_message}</p>
          )}
          
          <div className="space-y-4">
            <div>
              <Label className="text-[#1A1A1A] font-medium">Long Description</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg min-h-[100px]">
                {formData.basic_information?.long_description ? (
                  <p className="text-[#4A4A4A] whitespace-pre-wrap">{formData.basic_information.long_description}</p>
                ) : (
                  <p className="text-[#7A7A7A] italic">Not yet generated. Click "Run AI Extraction" to populate.</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-[#1A1A1A] font-medium">Key Features</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                {formData.overview?.key_features && formData.overview.key_features.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {formData.overview.key_features.map((feature, i) => (
                      <li key={i} className="text-[#4A4A4A]">{feature}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#7A7A7A] italic">Not yet generated. Click "Run AI Extraction" to populate.</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-[#1A1A1A] font-medium">Intended Use Cases</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                {formData.overview?.intended_use_cases && formData.overview.intended_use_cases.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {formData.overview.intended_use_cases.map((useCase, i) => (
                      <li key={i} className="text-[#4A4A4A]">{useCase}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#7A7A7A] italic">Not yet generated. Click "Run AI Extraction" to populate.</p>
                )}
              </div>
            </div>
          </div>

          {/* Show AI issues/warnings if any */}
          {asset.ai_assistance?.issues && asset.ai_assistance.issues.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-1">AI Extraction Notes:</p>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {asset.ai_assistance.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Add Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Image URL *</Label>
              <Input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Caption (optional)</Label>
              <Input
                value={newImageCaption}
                onChange={(e) => setNewImageCaption(e.target.value)}
                placeholder="Describe this image"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImageModal(false);
              setNewImageUrl('');
              setNewImageCaption('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={addImage}
              disabled={!newImageUrl}
              className="bg-[#1B4FFF] text-white"
            >
              Add Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
