import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicAsset } from '../api/assets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function PublicAssetDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: asset, isLoading } = useQuery({
    queryKey: ['publicAsset', id],
    queryFn: () => getPublicAsset(id!),
    enabled: !!id,
  });

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

  // Find primary image
  const primaryImage = asset.overview?.images?.find(img => img.is_primary) || asset.overview?.images?.[0];
  const otherImages = asset.overview?.images?.filter(img => img !== primaryImage) || [];
  
  // Check asset type for conditional rendering
  const isPhysicalOrHybrid = asset.asset_type === 'physical' || asset.asset_type === 'hybrid';
  const isPlan = asset.asset_type === 'plan';

  return (
    <div className="space-y-6">
      {/* Primary Image */}
      {primaryImage && (
        <div className="w-full">
          <img
            src={primaryImage.url}
            alt={primaryImage.caption || asset.basic_information?.asset_name || 'Asset image'}
            className="w-full max-h-96 object-cover rounded-xl shadow-sm"
          />
          {primaryImage.caption && (
            <p className="text-sm text-[#7A7A7A] mt-2 text-center">{primaryImage.caption}</p>
          )}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          {asset.basic_information?.asset_name || 'Untitled Asset'}
        </h1>
        <div className="flex items-center space-x-2 mt-2">
          <Badge className="capitalize bg-[#E6EEFF] text-[#1B4FFF]">{asset.asset_type}</Badge>
          <Badge className="bg-green-100 text-green-700">Approved</Badge>
        </div>
      </div>

      {/* Image Gallery (if multiple images) */}
      {otherImages.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {otherImages.map((img, index) => (
            <img
              key={index}
              src={img.url}
              alt={img.caption || `Image ${index + 2}`}
              className="w-full h-24 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="bg-[#F5F6FA]">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card className="bg-white rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1A1A1A]">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#7A7A7A]">Category</p>
                  <p className="text-[#1A1A1A]">{asset.basic_information?.category || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#7A7A7A]">Subcategory</p>
                  <p className="text-[#1A1A1A]">{asset.basic_information?.subcategory || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#7A7A7A]">Scaling Potential</p>
                  <p className="text-[#1A1A1A] capitalize">{asset.basic_information?.scaling_potential || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-[#7A7A7A]">Short Summary</p>
                <p className="text-[#1A1A1A]">{asset.basic_information?.short_summary || '-'}</p>
              </div>
              {asset.basic_information?.long_description && (
                <div>
                  <p className="text-sm text-[#7A7A7A]">Description</p>
                  <p className="text-[#1A1A1A]">{asset.basic_information.long_description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier / Creator Section */}
          <Card className="bg-white rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1A1A1A]">
                {isPlan ? 'Creator' : 'Supplier'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPhysicalOrHybrid && (
                <div className="space-y-3">
                  {asset.basic_information?.company_name && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Company</p>
                      <p className="text-[#1A1A1A]">{asset.basic_information.company_name}</p>
                    </div>
                  )}
                  {asset.basic_information?.company_website_url && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Website</p>
                      <a
                        href={asset.basic_information.company_website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1B4FFF] hover:underline"
                      >
                        {asset.basic_information.company_website_url}
                      </a>
                    </div>
                  )}
                  {asset.basic_information?.original_source_url && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Product URL</p>
                      <a
                        href={asset.basic_information.original_source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1B4FFF] hover:underline"
                      >
                        {asset.basic_information.original_source_url}
                      </a>
                    </div>
                  )}
                </div>
              )}
              {isPlan && (
                <div className="space-y-3">
                  {asset.basic_information?.creator_name && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Creator</p>
                      <p className="text-[#1A1A1A]">{asset.basic_information.creator_name}</p>
                    </div>
                  )}
                  {asset.basic_information?.creator_organization && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Organization</p>
                      <p className="text-[#1A1A1A]">{asset.basic_information.creator_organization}</p>
                    </div>
                  )}
                  {asset.basic_information?.original_source_url && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Source URL</p>
                      <a
                        href={asset.basic_information.original_source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1B4FFF] hover:underline"
                      >
                        {asset.basic_information.original_source_url}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Economics Section */}
          <Card className="bg-white rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1A1A1A]">Pricing & Economics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {asset.economics?.retail_price !== undefined && (
                  <div>
                    <p className="text-sm text-[#7A7A7A]">Retail Price</p>
                    <p className="text-xl font-semibold text-[#1A1A1A]">
                      ${asset.economics.retail_price.toLocaleString()}
                    </p>
                  </div>
                )}
                {asset.economics?.availability_type && (
                  <div>
                    <p className="text-sm text-[#7A7A7A]">Availability</p>
                    <Badge className="capitalize bg-[#E6EEFF] text-[#1B4FFF]">
                      {asset.economics.availability_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                )}
                {asset.economics?.generates_revenue && (
                  <div>
                    <p className="text-sm text-[#7A7A7A]">Generates Revenue</p>
                    <p className="text-[#1A1A1A] capitalize">{asset.economics.generates_revenue}</p>
                  </div>
                )}
                {asset.economics?.estimated_annual_net_profit_usd !== undefined && (
                  <div>
                    <p className="text-sm text-[#7A7A7A]">Est. Annual Net Profit</p>
                    <p className="text-[#1A1A1A]">
                      ${asset.economics.estimated_annual_net_profit_usd.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {asset.overview?.key_features && asset.overview.key_features.length > 0 && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-[#1A1A1A]">Key Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {asset.overview.key_features.map((feature, index) => (
                    <li key={index} className="text-[#1A1A1A]">{feature}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {asset.overview?.intended_use_cases && asset.overview.intended_use_cases.length > 0 && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-[#1A1A1A]">Intended Use Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {asset.overview.intended_use_cases.map((useCase, index) => (
                    <li key={index} className="text-[#1A1A1A]">{useCase}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation">
          <Card className="bg-white rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1A1A1A]">Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.documentation_uploads && Object.entries(asset.documentation_uploads).some(([, v]) => v && (Array.isArray(v) ? v.length > 0 : true)) ? (
                <div className="space-y-4">
                  {Object.entries(asset.documentation_uploads).map(([key, value]) => {
                    if (!value || (Array.isArray(value) && value.length === 0)) return null;
                    const urls = Array.isArray(value) ? value : [value];
                    return (
                      <div key={key}>
                        <p className="text-sm font-medium text-[#1A1A1A] capitalize mb-2">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <ul className="space-y-1">
                          {urls.map((url, index) => (
                            <li key={index}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#1B4FFF] hover:underline text-sm"
                              >
                                {url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#7A7A7A]">No documentation available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          {(asset.asset_type === 'physical' || asset.asset_type === 'hybrid') && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-[#1A1A1A]">Physical Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                {asset.physical_configuration?.unit_variants && asset.physical_configuration.unit_variants.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit Name</TableHead>
                        <TableHead>Dimensions (L x W x H)</TableHead>
                        <TableHead>Weight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asset.physical_configuration.unit_variants.map((variant, index) => (
                        <TableRow key={index}>
                          <TableCell>{variant.unit_name || '-'}</TableCell>
                          <TableCell>
                            {variant.dimensions
                              ? `${variant.dimensions.length || '-'} x ${variant.dimensions.width || '-'} x ${variant.dimensions.height || '-'}`
                              : '-'}
                          </TableCell>
                          <TableCell>{variant.unit_weight || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-[#7A7A7A]">No physical configuration available.</p>
                )}
              </CardContent>
            </Card>
          )}

          {(asset.asset_type === 'plan' || asset.asset_type === 'hybrid') && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-[#1A1A1A]">Plan Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#7A7A7A]">Required Skill Level</p>
                    <p className="text-[#1A1A1A]">{asset.plan_configuration?.required_skill_level || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#7A7A7A]">Estimated Build Time</p>
                    <p className="text-[#1A1A1A]">
                      {asset.plan_configuration?.estimated_build_time_hours
                        ? `${asset.plan_configuration.estimated_build_time_hours} hours`
                        : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Impact Tab */}
        <TabsContent value="impact">
          <Card className="bg-white rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1A1A1A]">EDEN Impact Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.eden_impact_summary ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#7A7A7A]">Positive Impact Points</p>
                    <p className="text-2xl font-semibold text-[#1B4FFF]">
                      {asset.eden_impact_summary.eden_positive_impact_points || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#7A7A7A]">Recommended Rating</p>
                    <p className="text-2xl font-semibold text-[#1A1A1A]">
                      {asset.eden_impact_summary.eden_recommended_rating || '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[#7A7A7A]">No impact data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
