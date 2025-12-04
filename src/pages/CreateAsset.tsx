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

  // Form state
  const [assetType, setAssetType] = useState<AssetType>('physical');
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [shortSummary, setShortSummary] = useState('');
  const [scalingPotential, setScalingPotential] = useState<ScalingPotential | ''>('');
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [contributorId, setContributorId] = useState('');
  const [contributorNotes, setContributorNotes] = useState('');
  const [assetTypeDescription, setAssetTypeDescription] = useState('');
  const [intendedUseCases, setIntendedUseCases] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      asset_type: assetType,
      basic_information: {
        asset_name: assetName,
        category,
        subcategory: subcategory || undefined,
        short_summary: shortSummary || undefined,
        scaling_potential: scalingPotential || undefined,
      },
      contributor: {
        name: contributorName || undefined,
        email: contributorEmail || undefined,
        contributor_id: contributorId || undefined,
        notes: contributorNotes || undefined,
      },
      overview: {
        asset_type_description: assetTypeDescription || undefined,
        intended_use_cases: intendedUseCases ? intendedUseCases.split('\n').filter(Boolean) : undefined,
      },
    });
  };

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
                <Label htmlFor="subcategory" className="text-[#1A1A1A]">Subcategory</Label>
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
              <Label htmlFor="shortSummary" className="text-[#1A1A1A]">Short Summary</Label>
              <Textarea
                id="shortSummary"
                value={shortSummary}
                onChange={(e) => setShortSummary(e.target.value)}
                placeholder="Brief description of the asset"
                rows={3}
                className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
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
                <Label htmlFor="contributorName" className="text-[#1A1A1A]">Name</Label>
                <Input
                  id="contributorName"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="Contributor name"
                  className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributorEmail" className="text-[#1A1A1A]">Email</Label>
                <Input
                  id="contributorEmail"
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  placeholder="contributor@example.com"
                  className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributorId" className="text-[#1A1A1A]">Contributor ID</Label>
                <Input
                  id="contributorId"
                  value={contributorId}
                  onChange={(e) => setContributorId(e.target.value)}
                  placeholder="user_123"
                  className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contributorNotes" className="text-[#1A1A1A]">Notes</Label>
              <Textarea
                id="contributorNotes"
                value={contributorNotes}
                onChange={(e) => setContributorNotes(e.target.value)}
                placeholder="Additional notes"
                rows={2}
                className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Overview */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-[#1A1A1A]">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assetTypeDescription" className="text-[#1A1A1A]">Asset Type Description</Label>
              <Textarea
                id="assetTypeDescription"
                value={assetTypeDescription}
                onChange={(e) => setAssetTypeDescription(e.target.value)}
                placeholder="Describe the type of asset"
                rows={3}
                className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intendedUseCases" className="text-[#1A1A1A]">Intended Use Cases</Label>
              <Textarea
                id="intendedUseCases"
                value={intendedUseCases}
                onChange={(e) => setIntendedUseCases(e.target.value)}
                placeholder="Enter each use case on a new line"
                rows={4}
                className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
              />
              <p className="text-sm text-[#7A7A7A]">Enter each use case on a separate line</p>
            </div>
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
            disabled={createMutation.isPending || !assetName || !category}
            className="bg-[#1B4FFF] hover:bg-[#0F2C8C] text-white"
          >
            {createMutation.isPending ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Saving...
              </>
            ) : (
              'Save Draft'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
