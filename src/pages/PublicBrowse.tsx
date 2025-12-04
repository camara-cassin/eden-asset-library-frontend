import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listPublicAssets } from '../api/assets';
import { getCategories, getAssetTypes } from '../api/reference';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { AssetType } from '../types/asset';

export function PublicBrowse() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('');

  // Fetch public assets
  const { data: assetsData, isLoading, error: fetchError } = useQuery({
    queryKey: ['publicAssets', searchQuery, categoryFilter, assetTypeFilter],
    queryFn: () =>
      listPublicAssets({
        q: searchQuery || undefined,
        category: categoryFilter || undefined,
        asset_type: assetTypeFilter as AssetType || undefined,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Public Asset Library</h1>
        <p className="text-[#4A4A4A] mt-1">Browse approved assets in the EDEN library</p>
      </div>

      {/* Filters */}
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-[#D8D8D8] focus:ring-[#1B4FFF]"
            />
            <Select value={categoryFilter || '__all__'} onValueChange={(v) => setCategoryFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="border-[#D8D8D8]">
                <SelectValue placeholder="All Categories" />
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
                <SelectValue placeholder="All Types" />
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
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8 text-[#1B4FFF]" />
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-12 text-red-600">
          <p className="font-medium">Failed to load assets</p>
          <p className="text-sm text-red-500 mt-1">
            {fetchError instanceof Error ? fetchError.message : 'Unknown error'}
          </p>
        </div>
      ) : assetsData?.items?.length === 0 ? (
        <div className="text-center py-12 text-[#7A7A7A]">
          No approved assets found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assetsData?.items?.map((asset) => (
            <Link key={asset.id} to={`/public/${asset.id}`}>
              <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-[#1A1A1A]">
                        {asset.basic_information?.asset_name || 'Untitled'}
                      </CardTitle>
                      <CardDescription className="text-[#4A4A4A]">
                        {asset.basic_information?.category || 'Uncategorized'}
                      </CardDescription>
                    </div>
                    <Badge className="capitalize bg-[#E6EEFF] text-[#1B4FFF]">
                      {asset.asset_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#4A4A4A] line-clamp-3">
                    {asset.basic_information?.short_summary || 'No description available'}
                  </p>
                  {asset.overview?.key_features && asset.overview.key_features.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {asset.overview.key_features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-[#7A7A7A]">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Results count */}
      {assetsData && (
        <div className="text-sm text-[#4A4A4A]">
          Showing {assetsData.items?.length || 0} of {assetsData.total} approved assets
        </div>
      )}
    </div>
  );
}
