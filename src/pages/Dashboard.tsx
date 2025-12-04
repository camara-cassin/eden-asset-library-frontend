import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listAssets } from '../api/assets';
import { getCategories, getAssetTypes, getSystemStatuses, getScalingPotentials } from '../api/reference';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { AssetStatus, AssetType } from '../types/asset';

type FilterTab = 'all' | 'drafts' | 'submitted' | 'approved';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [scalingFilter, setScalingFilter] = useState<string>('');

  // Get status filter based on active tab
  const getTabStatus = (): AssetStatus | undefined => {
    switch (activeTab) {
      case 'drafts':
        return 'draft';
      case 'submitted':
        return 'under_review';
      case 'approved':
        return 'approved';
      default:
        return statusFilter ? (statusFilter as AssetStatus) : undefined;
    }
  };

  // Fetch assets
  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', activeTab, searchQuery, categoryFilter, assetTypeFilter, statusFilter, scalingFilter],
    queryFn: () =>
      listAssets({
        q: searchQuery || undefined,
        category: categoryFilter || undefined,
        asset_type: assetTypeFilter as AssetType || undefined,
        status: getTabStatus(),
        scaling_potential: scalingFilter as 'pilot' | 'local' | 'regional' | 'global' || undefined,
      }),
  });

  // Fetch reference data
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: assetTypes } = useQuery({
    queryKey: ['assetTypes'],
    queryFn: getAssetTypes,
  });

  const { data: statuses } = useQuery({
    queryKey: ['systemStatuses'],
    queryFn: getSystemStatuses,
  });

  const { data: scalingPotentials } = useQuery({
    queryKey: ['scalingPotentials'],
    queryFn: getScalingPotentials,
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All Assets' },
    { key: 'drafts', label: 'My Drafts' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'approved', label: 'Approved' },
  ];

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'deprecated':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">EDEN Asset Library</h1>
        <Link to="/assets/new">
          <Button className="bg-[#1B4FFF] hover:bg-[#0F2C8C] text-white">
            Create New Asset
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[#1B4FFF] text-white'
                : 'bg-white text-[#4A4A4A] hover:bg-[#E6EEFF]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
            />
            <Select value={categoryFilter || '__all__'} onValueChange={(v) => setCategoryFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="border-[#D8D8D8]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assetTypeFilter || '__all__'} onValueChange={(v) => setAssetTypeFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="border-[#D8D8D8]">
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                {assetTypes?.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeTab === 'all' && (
              <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger className="border-[#D8D8D8]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Statuses</SelectItem>
                  {statuses?.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={scalingFilter || '__all__'} onValueChange={(v) => setScalingFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="border-[#D8D8D8]">
                <SelectValue placeholder="Scaling Potential" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Scaling</SelectItem>
                {scalingPotentials?.map((sp) => (
                  <SelectItem key={sp} value={sp}>
                    {sp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-0">
          {assetsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8 text-[#1B4FFF]" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F6FA]">
                  <TableHead className="text-[#4A4A4A]">Asset Name</TableHead>
                  <TableHead className="text-[#4A4A4A]">Asset Type</TableHead>
                  <TableHead className="text-[#4A4A4A]">Category</TableHead>
                  <TableHead className="text-[#4A4A4A]">Status</TableHead>
                  <TableHead className="text-[#4A4A4A]">Submission Status</TableHead>
                  <TableHead className="text-[#4A4A4A]">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetsData?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-[#7A7A7A]">
                      No assets found
                    </TableCell>
                  </TableRow>
                ) : (
                  assetsData?.items?.map((asset) => (
                    <TableRow key={asset.id} className="hover:bg-[#F5F6FA]">
                      <TableCell>
                        <Link
                          to={`/assets/${asset.id}`}
                          className="text-[#1B4FFF] hover:underline font-medium"
                        >
                          {asset.basic_information?.asset_name || 'Untitled'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-[#1A1A1A] capitalize">{asset.asset_type}</TableCell>
                      <TableCell className="text-[#1A1A1A]">
                        {asset.basic_information?.category || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(asset.status)}>
                          {asset.status || 'draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[#4A4A4A]">
                          {asset.contributor?.submission_status || 'draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#4A4A4A]">
                        {formatDate(asset.system_meta?.updated_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination info */}
      {assetsData && (
        <div className="text-sm text-[#4A4A4A]">
          Showing {assetsData.items?.length || 0} of {assetsData.total} assets
        </div>
      )}
    </div>
  );
}
