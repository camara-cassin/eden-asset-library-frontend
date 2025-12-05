import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createAsset } from '../api/assets';
import { getAssetTypes, getCategories, getSubcategories, getScalingPotentials } from '../api/reference';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { AssetType, ScalingPotential } from '../types/asset';

export function CreateAsset() {
  const navigate = useNavigate();

  // Basic Information state
  const [assetType, setAssetType] = useState<AssetType>('physical');
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [shortSummary, setShortSummary] = useState('');
  const [functionPurpose, setFunctionPurpose] = useState('');
  const [scalingPotential, setScalingPotential] = useState<ScalingPotential | ''>('');

  // Supplier/Creator state (conditional based on asset_type)
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyWebsiteUrl, setCompanyWebsiteUrl] = useState('');
  const [originalSourceUrl, setOriginalSourceUrl] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [creatorEmail, setCreatorEmail] = useState('');
  const [creatorOrganization, setCreatorOrganization] = useState('');

  // Contributor state (simplified for MVP)
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');

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
    queryKey: ['subcategories', category],
    queryFn: () => getSubcategories(category),
    enabled: !!category,
  });

  const { data: scalingPotentials } = useQuery({
    queryKey: ['scalingPotentials'],
    queryFn: getScalingPotentials,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: (data) => {
      navigate(`/assets/${data.id}/edit`);
    },
  });

  // Check if supplier fields are required (physical or hybrid)
  const isPhysicalOrHybrid = assetType === 'physical' || assetType === 'hybrid';
  const isPlan = assetType === 'plan';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const basicInfo: Record<string, string | undefined> = {
      asset_name: assetName,
      category,
      subcategory: subcategory || undefined,
      short_summary: shortSummary || undefined,
      function_purpose: functionPurpose || undefined,
      scaling_potential: scalingPotential || undefined,
    };

    // Add supplier fields for physical/hybrid
    if (isPhysicalOrHybrid) {
      basicInfo.company_name = companyName || undefined;
      basicInfo.company_email = companyEmail || undefined;
      basicInfo.company_website_url = companyWebsiteUrl || undefined;
      basicInfo.original_source_url = originalSourceUrl || undefined;
    }

    // Add creator fields for plan
    if (isPlan) {
      basicInfo.creator_name = creatorName || undefined;
      basicInfo.creator_email = creatorEmail || undefined;
      basicInfo.creator_organization = creatorOrganization || undefined;
      basicInfo.original_source_url = originalSourceUrl || undefined;
    }

    createMutation.mutate({
      asset_type: assetType,
      basic_information: basicInfo as Parameters<typeof createAsset>[0]['basic_information'],
      contributor: {
        name: contributorName || undefined,
        email: contributorEmail || undefined,
      },
    });
  };

  // Validation for submit button
  const isBasicInfoValid = assetName && category && subcategory && shortSummary;
  const isSupplierValid = !isPhysicalOrHybrid || (companyName && companyEmail && companyWebsiteUrl && originalSourceUrl);
  const isCreatorValid = !isPlan || (creatorName && creatorEmail);
  const canSubmit = isBasicInfoValid && isSupplierValid && isCreatorValid;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#1A1A1A]">Create New Asset</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-[#1A1A1A]">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assetType" className="text-[#1A1A1A]">Asset Type *</Label>
                <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
                  <SelectTrigger className="border-[#D8D8D8]">
                    <SelectValue placeholder="Select type" />
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
                <Label htmlFor="assetName" className="text-[#1A1A1A]">Asset Name *</Label>
                <Input
                  id="assetName"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="Enter asset name"
                  required
                  className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-[#1A1A1A]">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-[#D8D8D8]">
                    <SelectValue placeholder="Select category" />
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
                <Label htmlFor="subcategory" className="text-[#1A1A1A]">Subcategory *</Label>
                <Select value={subcategory} onValueChange={setSubcategory} disabled={!category}>
                  <SelectTrigger className="border-[#D8D8D8]">
                    <SelectValue placeholder="Select subcategory" />
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
                <Label htmlFor="scalingPotential" className="text-[#1A1A1A]">Scaling Potential</Label>
                <Select value={scalingPotential} onValueChange={(v) => setScalingPotential(v as ScalingPotential)}>
                  <SelectTrigger className="border-[#D8D8D8]">
                    <SelectValue placeholder="Select scaling potential" />
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
              <Label htmlFor="shortSummary" className="text-[#1A1A1A]">Short Summary *</Label>
              <Textarea
                id="shortSummary"
                value={shortSummary}
                onChange={(e) => setShortSummary(e.target.value)}
                placeholder="Brief description of the asset (single short paragraph)"
                rows={3}
                required
                className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="functionPurpose" className="text-[#1A1A1A]">Function or Purpose</Label>
              <Textarea
                id="functionPurpose"
                value={functionPurpose}
                onChange={(e) => setFunctionPurpose(e.target.value)}
                placeholder="What does this asset do? (optional)"
                rows={2}
                className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
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
                  <Label htmlFor="companyName" className="text-[#1A1A1A]">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    required
                    className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail" className="text-[#1A1A1A]">Company Email *</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="company@example.com"
                    required
                    className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyWebsiteUrl" className="text-[#1A1A1A]">Company Website URL *</Label>
                  <Input
                    id="companyWebsiteUrl"
                    type="url"
                    value={companyWebsiteUrl}
                    onChange={(e) => setCompanyWebsiteUrl(e.target.value)}
                    placeholder="https://company.com"
                    required
                    className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalSourceUrl" className="text-[#1A1A1A]">Product URL *</Label>
                  <Input
                    id="originalSourceUrl"
                    type="url"
                    value={originalSourceUrl}
                    onChange={(e) => setOriginalSourceUrl(e.target.value)}
                    placeholder="https://company.com/product"
                    required
                    className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                  />
                  <p className="text-sm text-[#7A7A7A]">Main URL used by AI and humans to learn more about this product</p>
                </div>
              </div>
            )}

            {isPlan && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creatorName" className="text-[#1A1A1A]">Creator Name *</Label>
                  <Input
                    id="creatorName"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="Enter creator name"
                    required
                    className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creatorEmail" className="text-[#1A1A1A]">Creator Email *</Label>
                  <Input
                    id="creatorEmail"
                    type="email"
                    value={creatorEmail}
                    onChange={(e) => setCreatorEmail(e.target.value)}
                    placeholder="creator@example.com"
                    required
                    className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creatorOrganization" className="text-[#1A1A1A]">Organization</Label>
                  <Input
                    id="creatorOrganization"
                    value={creatorOrganization}
                    onChange={(e) => setCreatorOrganization(e.target.value)}
                    placeholder="Organization name (optional)"
                    className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalSourceUrlPlan" className="text-[#1A1A1A]">Original Source URL</Label>
                  <Input
                    id="originalSourceUrlPlan"
                    type="url"
                    value={originalSourceUrl}
                    onChange={(e) => setOriginalSourceUrl(e.target.value)}
                    placeholder="https://example.com/plan"
                    className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                  />
                  <p className="text-sm text-[#7A7A7A]">Optional but encouraged</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contributor (simplified for MVP) */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-[#1A1A1A]">Contributor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contributorName" className="text-[#1A1A1A]">Your Name</Label>
                <Input
                  id="contributorName"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="Your name"
                  className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributorEmail" className="text-[#1A1A1A]">Your Email</Label>
                <Input
                  id="contributorEmail"
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                />
              </div>
            </div>
            <p className="text-sm text-[#7A7A7A]">
              This identifies you as the person submitting this asset to the library.
            </p>
          </CardContent>
        </Card>

        {/* Error display */}
        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {createMutation.error instanceof Error ? createMutation.error.message : 'An error occurred'}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
            className="border-[#1B4FFF] text-[#1B4FFF]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || !canSubmit}
            className="bg-[#1B4FFF] hover:bg-[#0F2C8C] text-white"
          >
            {createMutation.isPending ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              'Create Asset'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
