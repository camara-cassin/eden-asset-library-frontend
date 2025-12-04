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
