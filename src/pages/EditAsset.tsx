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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { EdenAsset } from '../types/asset';

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
    onSuccess: () => {
      setShowAIModal(false);
      setExtraDocUrls('');
      setAiMessage({ type: 'success', text: 'AI prefill completed successfully' });
      setTimeout(() => setAiMessage(null), 3000);
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

      {/* Contributor */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Contributor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Name</Label>
              <Input
                value={formData.contributor?.name || ''}
                onChange={(e) => updateFormField('contributor.name', e.target.value)}
                className="border-[#D8D8D8]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Email</Label>
              <Input
                value={formData.contributor?.email || ''}
                onChange={(e) => updateFormField('contributor.email', e.target.value)}
                className="border-[#D8D8D8]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Contributor ID</Label>
              <Input
                value={formData.contributor?.contributor_id || ''}
                onChange={(e) => updateFormField('contributor.contributor_id', e.target.value)}
                className="border-[#D8D8D8]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration - Physical */}
      {(formData.asset_type === 'physical' || formData.asset_type === 'hybrid') && (
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-[#1A1A1A]">Physical Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#7A7A7A]">
              Physical configuration fields will be implemented in the next phase.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configuration - Plan */}
      {(formData.asset_type === 'plan' || formData.asset_type === 'hybrid') && (
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-[#1A1A1A]">Plan Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#7A7A7A]">
              Plan configuration fields will be implemented in the next phase.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Documentation Uploads */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Documentation Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          {asset.documentation_uploads && Object.entries(asset.documentation_uploads).some(([, v]) => v && (Array.isArray(v) ? v.length > 0 : true)) ? (
            <div className="space-y-2">
              {Object.entries(asset.documentation_uploads).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                return (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-[#1A1A1A]">{key}: </span>
                    <span className="text-[#4A4A4A]">
                      {Array.isArray(value) ? value.join(', ') : value}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#7A7A7A]">No documents uploaded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Economics */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Economics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Retail Price</Label>
              <Input
                type="number"
                value={formData.economics?.retail_price || ''}
                onChange={(e) => updateFormField('economics.retail_price', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Wholesale Price</Label>
              <Input
                type="number"
                value={formData.economics?.wholesale_price || ''}
                onChange={(e) => updateFormField('economics.wholesale_price', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Minimum Order Quantity</Label>
              <Input
                type="number"
                value={formData.economics?.minimum_order_quantity || ''}
                onChange={(e) => updateFormField('economics.minimum_order_quantity', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Production Lead Time (days)</Label>
              <Input
                type="number"
                value={formData.economics?.production_lead_time_days || ''}
                onChange={(e) => updateFormField('economics.production_lead_time_days', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Production Capacity/Month</Label>
              <Input
                type="number"
                value={formData.economics?.production_capacity_per_month || ''}
                onChange={(e) => updateFormField('economics.production_capacity_per_month', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Plan Access Type</Label>
              <Select
                value={formData.economics?.plan_access_type || ''}
                onValueChange={(v) => updateFormField('economics.plan_access_type', v)}
              >
                <SelectTrigger className="border-[#D8D8D8]">
                  <SelectValue placeholder="Select access type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Impact */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Environmental Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label className="text-[#1A1A1A]">Material Toxicity Level</Label>
              <Input
                value={formData.environmental_impact?.material_toxicity_level || ''}
                onChange={(e) => updateFormField('environmental_impact.material_toxicity_level', e.target.value)}
                className="border-[#D8D8D8]"
                placeholder="e.g., Low, Medium, High"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Recyclability (%)</Label>
              <Input
                type="number"
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
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">End of Life Pathways</Label>
              <Input
                value={formData.environmental_impact?.end_of_life_pathways?.join(', ') || ''}
                onChange={(e) => updateFormField('environmental_impact.end_of_life_pathways', e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
                className="border-[#D8D8D8]"
                placeholder="Recycling, Composting, etc."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Air Pollution Notes</Label>
              <Textarea
                value={formData.environmental_impact?.air_pollution_notes || ''}
                onChange={(e) => updateFormField('environmental_impact.air_pollution_notes', e.target.value)}
                className="border-[#D8D8D8]"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Water Pollution Notes</Label>
              <Textarea
                value={formData.environmental_impact?.water_pollution_notes || ''}
                onChange={(e) => updateFormField('environmental_impact.water_pollution_notes', e.target.value)}
                className="border-[#D8D8D8]"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Soil Pollution Notes</Label>
              <Textarea
                value={formData.environmental_impact?.soil_pollution_notes || ''}
                onChange={(e) => updateFormField('environmental_impact.soil_pollution_notes', e.target.value)}
                className="border-[#D8D8D8]"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Regenerative Outputs Notes</Label>
              <Textarea
                value={formData.environmental_impact?.regenerative_outputs_notes || ''}
                onChange={(e) => updateFormField('environmental_impact.regenerative_outputs_notes', e.target.value)}
                className="border-[#D8D8D8]"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Human Impact */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Human Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Safety Rating</Label>
              <Input
                value={formData.human_impact?.safety_rating || ''}
                onChange={(e) => updateFormField('human_impact.safety_rating', e.target.value)}
                className="border-[#D8D8D8]"
                placeholder="e.g., A, B, C"
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
              <Label className="text-[#1A1A1A]">Ergonomics Score</Label>
              <Input
                type="number"
                value={formData.human_impact?.ergonomics_score || ''}
                onChange={(e) => updateFormField('human_impact.ergonomics_score', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Emissions During Use Notes</Label>
              <Textarea
                value={formData.human_impact?.emissions_during_use_notes || ''}
                onChange={(e) => updateFormField('human_impact.emissions_during_use_notes', e.target.value)}
                className="border-[#D8D8D8]"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Off-Gassing Notes</Label>
              <Textarea
                value={formData.human_impact?.off_gassing_notes || ''}
                onChange={(e) => updateFormField('human_impact.off_gassing_notes', e.target.value)}
                className="border-[#D8D8D8]"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Health Benefits Notes</Label>
              <Textarea
                value={formData.human_impact?.health_benefits_notes || ''}
                onChange={(e) => updateFormField('human_impact.health_benefits_notes', e.target.value)}
                className="border-[#D8D8D8]"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Risk Factors Notes</Label>
              <Textarea
                value={formData.human_impact?.risk_factors_notes || ''}
                onChange={(e) => updateFormField('human_impact.risk_factors_notes', e.target.value)}
                className="border-[#D8D8D8]"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Labour Demand Notes</Label>
              <Textarea
                value={formData.human_impact?.labour_demand_notes || ''}
                onChange={(e) => updateFormField('human_impact.labour_demand_notes', e.target.value)}
                className="border-[#D8D8D8]"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Social Benefit Notes</Label>
              <Textarea
                value={formData.human_impact?.social_benefit_notes || ''}
                onChange={(e) => updateFormField('human_impact.social_benefit_notes', e.target.value)}
                className="border-[#D8D8D8]"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Functional Inputs & Outputs */}
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
                  updateFormField('functional_io.inputs', [...inputs, { input_type: '', quantity: undefined, time_profile: '', quality_spec: '' }]);
                }}
                className="border-[#1B4FFF] text-[#1B4FFF]"
              >
                Add Row
              </Button>
            </div>
            {formData.functional_io?.inputs && formData.functional_io.inputs.length > 0 ? (
              <div className="space-y-2">
                {formData.functional_io.inputs.map((input, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-end">
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
                        placeholder="Type"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-[#7A7A7A]">Quantity</Label>
                      <Input
                        type="number"
                        value={input.quantity || ''}
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
                      <Label className="text-xs text-[#7A7A7A]">Time Profile</Label>
                      <Input
                        value={input.time_profile || ''}
                        onChange={(e) => {
                          const inputs = [...(formData.functional_io?.inputs || [])];
                          inputs[index] = { ...inputs[index], time_profile: e.target.value };
                          updateFormField('functional_io.inputs', inputs);
                        }}
                        className="border-[#D8D8D8]"
                        placeholder="Profile"
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
                        placeholder="Spec"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const inputs = formData.functional_io?.inputs?.filter((_, i) => i !== index) || [];
                        updateFormField('functional_io.inputs', inputs);
                      }}
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#7A7A7A] text-sm">No inputs defined. Click "Add Row" to add one.</p>
            )}
          </div>

          {/* Outputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[#1A1A1A]">Outputs</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const outputs = formData.functional_io?.outputs || [];
                  updateFormField('functional_io.outputs', [...outputs, { output_type: '', quantity: undefined, variability_profile: '', quality_spec: '' }]);
                }}
                className="border-[#1B4FFF] text-[#1B4FFF]"
              >
                Add Row
              </Button>
            </div>
            {formData.functional_io?.outputs && formData.functional_io.outputs.length > 0 ? (
              <div className="space-y-2">
                {formData.functional_io.outputs.map((output, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-end">
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
                        placeholder="Type"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-[#7A7A7A]">Quantity</Label>
                      <Input
                        type="number"
                        value={output.quantity || ''}
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
                      <Label className="text-xs text-[#7A7A7A]">Variability Profile</Label>
                      <Input
                        value={output.variability_profile || ''}
                        onChange={(e) => {
                          const outputs = [...(formData.functional_io?.outputs || [])];
                          outputs[index] = { ...outputs[index], variability_profile: e.target.value };
                          updateFormField('functional_io.outputs', outputs);
                        }}
                        className="border-[#D8D8D8]"
                        placeholder="Profile"
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
                        placeholder="Spec"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const outputs = formData.functional_io?.outputs?.filter((_, i) => i !== index) || [];
                        updateFormField('functional_io.outputs', outputs);
                      }}
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#7A7A7A] text-sm">No outputs defined. Click "Add Row" to add one.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deployment */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1A1A1A]">Deployment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Climate Zones</Label>
              <Input
                value={formData.deployment?.climate_zones?.join(', ') || ''}
                onChange={(e) => updateFormField('deployment.climate_zones', e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
                className="border-[#D8D8D8]"
                placeholder="Tropical, Temperate, etc."
              />
              <p className="text-xs text-[#7A7A7A]">Separate multiple zones with commas</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Soil Requirements</Label>
              <Input
                value={formData.deployment?.soil_requirements?.join(', ') || ''}
                onChange={(e) => updateFormField('deployment.soil_requirements', e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
                className="border-[#D8D8D8]"
                placeholder="Sandy, Clay, Loam, etc."
              />
              <p className="text-xs text-[#7A7A7A]">Separate multiple requirements with commas</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Min Operating Temp (°C)</Label>
              <Input
                type="number"
                value={formData.deployment?.min_operating_temperature ?? ''}
                onChange={(e) => updateFormField('deployment.min_operating_temperature', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="-40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Max Operating Temp (°C)</Label>
              <Input
                type="number"
                value={formData.deployment?.max_operating_temperature ?? ''}
                onChange={(e) => updateFormField('deployment.max_operating_temperature', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Min Humidity (%)</Label>
              <Input
                type="number"
                value={formData.deployment?.min_relative_humidity ?? ''}
                onChange={(e) => updateFormField('deployment.min_relative_humidity', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Max Humidity (%)</Label>
              <Input
                type="number"
                value={formData.deployment?.max_relative_humidity ?? ''}
                onChange={(e) => updateFormField('deployment.max_relative_humidity', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="100"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Max Wind Speed (m/s)</Label>
              <Input
                type="number"
                value={formData.deployment?.max_wind_speed_rating ?? ''}
                onChange={(e) => updateFormField('deployment.max_wind_speed_rating', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Max Rainfall (mm/hr)</Label>
              <Input
                type="number"
                value={formData.deployment?.max_rainfall_intensity ?? ''}
                onChange={(e) => updateFormField('deployment.max_rainfall_intensity', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Min Altitude (m)</Label>
              <Input
                type="number"
                value={formData.deployment?.min_altitude ?? ''}
                onChange={(e) => updateFormField('deployment.min_altitude', e.target.value ? Number(e.target.value) : undefined)}
                className="border-[#D8D8D8]"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Max Altitude (m)</Label>
              <Input
                type="number"
                value={formData.deployment?.max_altitude ?? ''}
                onChange={(e) => updateFormField('deployment.max_altitude', e.target.value ? Number(e.target.value) : undefined)}
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
              className="border-[#D8D8D8]"
              rows={3}
            />
          </div>
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
    </div>
  );
}
