import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAsset, approveAsset, rejectAsset } from '../api/assets';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function AssetDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const isAdmin = user?.role === 'admin';

  const { data: asset, isLoading, error: fetchError } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => getAsset(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => approveAsset(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectAsset(id!, { reason: rejectReason }),
    onSuccess: () => {
      setShowRejectModal(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
  });

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
            {asset.basic_information?.asset_name || 'Untitled Asset'}
          </h1>
          <div className="flex items-center space-x-2 mt-2">
            <Badge className="capitalize">{asset.asset_type}</Badge>
            <Badge className={getStatusBadgeColor(asset.system_meta?.status)}>
              {asset.system_meta?.status || 'draft'}
            </Badge>
            <Badge variant="outline" className="text-[#4A4A4A]">
              {asset.contributor?.submission_status || 'draft'}
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/assets/${id}/edit`)}
            className="border-[#1B4FFF] text-[#1B4FFF]"
          >
            Edit
          </Button>
                    {asset.system_meta?.status === 'under_review' && isAdmin && (
                      <>
                        <Button
                          onClick={() => approveMutation.mutate()}
                          disabled={approveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {approveMutation.isPending ? <Spinner className="w-4 h-4 mr-2" /> : null}
                          Approve
                        </Button>
                        <Button
                          onClick={() => setShowRejectModal(true)}
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </>
                    )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="bg-[#F5F6FA]">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="functional-io">Functional IO</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
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
                <div>
                  <p className="text-sm text-[#7A7A7A]">Version</p>
                  <p className="text-[#1A1A1A]">{asset.system_meta?.version || 'v1'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-[#7A7A7A]">Short Summary</p>
                <p className="text-[#1A1A1A]">{asset.basic_information?.short_summary || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1A1A1A]">Contributor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#7A7A7A]">Name</p>
                  <p className="text-[#1A1A1A]">{asset.contributor?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#7A7A7A]">Email</p>
                  <p className="text-[#1A1A1A]">{asset.contributor?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#7A7A7A]">Contributor ID</p>
                  <p className="text-[#1A1A1A]">{asset.contributor?.contributor_id || '-'}</p>
                </div>
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
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation">
          <Card className="bg-white rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1A1A1A]">Documentation Uploads</CardTitle>
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
                <p className="text-[#7A7A7A]">No documents uploaded yet.</p>
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
                  <p className="text-[#7A7A7A]">No unit variants configured.</p>
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
                  <div>
                    <p className="text-sm text-[#7A7A7A]">Required Tools</p>
                    <p className="text-[#1A1A1A]">
                      {asset.plan_configuration?.required_tools?.join(', ') || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#7A7A7A]">Required Skills</p>
                    <p className="text-[#1A1A1A]">
                      {asset.plan_configuration?.required_skills?.join(', ') || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Functional IO Tab */}
        <TabsContent value="functional-io">
          <Card className="bg-white rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1A1A1A]">Functional Inputs & Outputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-[#1A1A1A] mb-2">Inputs</h3>
                {asset.functional_io?.inputs && asset.functional_io.inputs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Input Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Time Profile</TableHead>
                        <TableHead>Quality Spec</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asset.functional_io.inputs.map((input, index) => (
                        <TableRow key={index}>
                          <TableCell>{input.input_type || input.name || '-'}</TableCell>
                          <TableCell>{input.quantity ?? '-'}</TableCell>
                          <TableCell>{input.time_profile || '-'}</TableCell>
                          <TableCell>{input.quality_spec || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-[#7A7A7A]">No inputs defined.</p>
                )}
              </div>

              <div>
                <h3 className="font-medium text-[#1A1A1A] mb-2">Outputs</h3>
                {asset.functional_io?.outputs && asset.functional_io.outputs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Output Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Variability Profile</TableHead>
                        <TableHead>Quality Spec</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asset.functional_io.outputs.map((output, index) => (
                        <TableRow key={index}>
                          <TableCell>{output.output_type || output.name || '-'}</TableCell>
                          <TableCell>{output.quantity ?? '-'}</TableCell>
                          <TableCell>{output.variability_profile || '-'}</TableCell>
                          <TableCell>{output.quality_spec || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-[#7A7A7A]">No outputs defined.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impact Tab */}
        <TabsContent value="impact" className="space-y-4">
          {/* EDEN Impact Summary */}
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
                  <div className="col-span-2">
                    <p className="text-sm text-[#7A7A7A]">Impact Notes</p>
                    <p className="text-[#1A1A1A]">{asset.eden_impact_summary.impact_notes || '-'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[#7A7A7A]">No impact data available.</p>
              )}
            </CardContent>
          </Card>

          {/* Economics */}
          {asset.economics && (asset.economics.retail_price || asset.economics.wholesale_price || asset.economics.plan_access_type) && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-[#1A1A1A]">Economics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {asset.economics.retail_price !== undefined && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Retail Price</p>
                      <p className="text-[#1A1A1A]">${asset.economics.retail_price}</p>
                    </div>
                  )}
                  {asset.economics.wholesale_price !== undefined && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Wholesale Price</p>
                      <p className="text-[#1A1A1A]">${asset.economics.wholesale_price}</p>
                    </div>
                  )}
                  {asset.economics.minimum_order_quantity !== undefined && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Minimum Order Quantity</p>
                      <p className="text-[#1A1A1A]">{asset.economics.minimum_order_quantity}</p>
                    </div>
                  )}
                  {asset.economics.production_lead_time_days !== undefined && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Production Lead Time</p>
                      <p className="text-[#1A1A1A]">{asset.economics.production_lead_time_days} days</p>
                    </div>
                  )}
                  {asset.economics.production_capacity_per_month !== undefined && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Production Capacity/Month</p>
                      <p className="text-[#1A1A1A]">{asset.economics.production_capacity_per_month}</p>
                    </div>
                  )}
                  {asset.economics.plan_access_type && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Plan Access Type</p>
                      <p className="text-[#1A1A1A] capitalize">{asset.economics.plan_access_type}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Environmental Impact */}
          {asset.environmental_impact && Object.values(asset.environmental_impact).some(v => v !== undefined && v !== null && v !== '') && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-[#1A1A1A]">Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {asset.environmental_impact.embodied_carbon_kg_co2e !== undefined && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Embodied Carbon</p>
                      <p className="text-[#1A1A1A]">{asset.environmental_impact.embodied_carbon_kg_co2e} kg CO2e</p>
                    </div>
                  )}
                  {asset.environmental_impact.operational_carbon_kg_co2e_per_year !== undefined && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Operational Carbon</p>
                      <p className="text-[#1A1A1A]">{asset.environmental_impact.operational_carbon_kg_co2e_per_year} kg CO2e/year</p>
                    </div>
                  )}
                  {asset.environmental_impact.material_toxicity_level && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Material Toxicity Level</p>
                      <p className="text-[#1A1A1A]">{asset.environmental_impact.material_toxicity_level}</p>
                    </div>
                  )}
                  {asset.environmental_impact.recyclability_percent !== undefined && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Recyclability</p>
                      <p className="text-[#1A1A1A]">{asset.environmental_impact.recyclability_percent}%</p>
                    </div>
                  )}
                  {asset.environmental_impact.biodegradation_timeline_years !== undefined && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Biodegradation Timeline</p>
                      <p className="text-[#1A1A1A]">{asset.environmental_impact.biodegradation_timeline_years} years</p>
                    </div>
                  )}
                  {asset.environmental_impact.end_of_life_pathways && asset.environmental_impact.end_of_life_pathways.length > 0 && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">End of Life Pathways</p>
                      <p className="text-[#1A1A1A]">{asset.environmental_impact.end_of_life_pathways.join(', ')}</p>
                    </div>
                  )}
                </div>
                {(asset.environmental_impact.air_pollution_notes || asset.environmental_impact.water_pollution_notes || asset.environmental_impact.soil_pollution_notes || asset.environmental_impact.regenerative_outputs_notes) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {asset.environmental_impact.air_pollution_notes && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Air Pollution Notes</p>
                        <p className="text-[#1A1A1A]">{asset.environmental_impact.air_pollution_notes}</p>
                      </div>
                    )}
                    {asset.environmental_impact.water_pollution_notes && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Water Pollution Notes</p>
                        <p className="text-[#1A1A1A]">{asset.environmental_impact.water_pollution_notes}</p>
                      </div>
                    )}
                    {asset.environmental_impact.soil_pollution_notes && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Soil Pollution Notes</p>
                        <p className="text-[#1A1A1A]">{asset.environmental_impact.soil_pollution_notes}</p>
                      </div>
                    )}
                    {asset.environmental_impact.regenerative_outputs_notes && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Regenerative Outputs Notes</p>
                        <p className="text-[#1A1A1A]">{asset.environmental_impact.regenerative_outputs_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Human Impact */}
          {asset.human_impact && Object.values(asset.human_impact).some(v => v !== undefined && v !== null && v !== '') && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-[#1A1A1A]">Human Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {asset.human_impact.safety_rating && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Safety Rating</p>
                      <p className="text-[#1A1A1A]">{asset.human_impact.safety_rating}</p>
                    </div>
                  )}
                  {asset.human_impact.noise_level_db !== undefined && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Noise Level</p>
                      <p className="text-[#1A1A1A]">{asset.human_impact.noise_level_db} dB</p>
                    </div>
                  )}
                  {asset.human_impact.ergonomics_score !== undefined && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Ergonomics Score</p>
                      <p className="text-[#1A1A1A]">{asset.human_impact.ergonomics_score}</p>
                    </div>
                  )}
                </div>
                {(asset.human_impact.emissions_during_use_notes || asset.human_impact.off_gassing_notes || asset.human_impact.health_benefits_notes || asset.human_impact.risk_factors_notes || asset.human_impact.labour_demand_notes || asset.human_impact.social_benefit_notes) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {asset.human_impact.emissions_during_use_notes && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Emissions During Use</p>
                        <p className="text-[#1A1A1A]">{asset.human_impact.emissions_during_use_notes}</p>
                      </div>
                    )}
                    {asset.human_impact.off_gassing_notes && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Off-Gassing Notes</p>
                        <p className="text-[#1A1A1A]">{asset.human_impact.off_gassing_notes}</p>
                      </div>
                    )}
                    {asset.human_impact.health_benefits_notes && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Health Benefits</p>
                        <p className="text-[#1A1A1A]">{asset.human_impact.health_benefits_notes}</p>
                      </div>
                    )}
                    {asset.human_impact.risk_factors_notes && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Risk Factors</p>
                        <p className="text-[#1A1A1A]">{asset.human_impact.risk_factors_notes}</p>
                      </div>
                    )}
                    {asset.human_impact.labour_demand_notes && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Labour Demand</p>
                        <p className="text-[#1A1A1A]">{asset.human_impact.labour_demand_notes}</p>
                      </div>
                    )}
                    {asset.human_impact.social_benefit_notes && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Social Benefits</p>
                        <p className="text-[#1A1A1A]">{asset.human_impact.social_benefit_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment">
          <Card className="bg-white rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#1A1A1A]">Deployment</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.deployment && Object.values(asset.deployment).some(v => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : v !== '')) ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {asset.deployment.climate_zones && asset.deployment.climate_zones.length > 0 && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Climate Zones</p>
                        <p className="text-[#1A1A1A]">{asset.deployment.climate_zones.join(', ')}</p>
                      </div>
                    )}
                    {asset.deployment.terrain_types && asset.deployment.terrain_types.length > 0 && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Terrain Types</p>
                        <p className="text-[#1A1A1A]">{asset.deployment.terrain_types.join(', ')}</p>
                      </div>
                    )}
                    {asset.deployment.soil_requirements && asset.deployment.soil_requirements.length > 0 && (
                      <div>
                        <p className="text-sm text-[#7A7A7A]">Soil Requirements</p>
                        <p className="text-[#1A1A1A]">{asset.deployment.soil_requirements.join(', ')}</p>
                      </div>
                    )}
                    {asset.deployment.infrastructure_requirements && asset.deployment.infrastructure_requirements.length > 0 && (
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-sm text-[#7A7A7A]">Infrastructure Requirements</p>
                        <p className="text-[#1A1A1A]">{asset.deployment.infrastructure_requirements.join(', ')}</p>
                      </div>
                    )}
                  </div>
                  {(asset.deployment.min_operating_temperature !== undefined || asset.deployment.max_operating_temperature !== undefined || asset.deployment.min_relative_humidity !== undefined || asset.deployment.max_relative_humidity !== undefined) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {asset.deployment.min_operating_temperature !== undefined && (
                        <div>
                          <p className="text-sm text-[#7A7A7A]">Min Operating Temp</p>
                          <p className="text-[#1A1A1A]">{asset.deployment.min_operating_temperature}°C</p>
                        </div>
                      )}
                      {asset.deployment.max_operating_temperature !== undefined && (
                        <div>
                          <p className="text-sm text-[#7A7A7A]">Max Operating Temp</p>
                          <p className="text-[#1A1A1A]">{asset.deployment.max_operating_temperature}°C</p>
                        </div>
                      )}
                      {asset.deployment.min_relative_humidity !== undefined && (
                        <div>
                          <p className="text-sm text-[#7A7A7A]">Min Humidity</p>
                          <p className="text-[#1A1A1A]">{asset.deployment.min_relative_humidity}%</p>
                        </div>
                      )}
                      {asset.deployment.max_relative_humidity !== undefined && (
                        <div>
                          <p className="text-sm text-[#7A7A7A]">Max Humidity</p>
                          <p className="text-[#1A1A1A]">{asset.deployment.max_relative_humidity}%</p>
                        </div>
                      )}
                    </div>
                  )}
                  {(asset.deployment.max_wind_speed_rating !== undefined || asset.deployment.max_rainfall_intensity !== undefined || asset.deployment.min_altitude !== undefined || asset.deployment.max_altitude !== undefined) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {asset.deployment.max_wind_speed_rating !== undefined && (
                        <div>
                          <p className="text-sm text-[#7A7A7A]">Max Wind Speed</p>
                          <p className="text-[#1A1A1A]">{asset.deployment.max_wind_speed_rating} m/s</p>
                        </div>
                      )}
                      {asset.deployment.max_rainfall_intensity !== undefined && (
                        <div>
                          <p className="text-sm text-[#7A7A7A]">Max Rainfall</p>
                          <p className="text-[#1A1A1A]">{asset.deployment.max_rainfall_intensity} mm/hr</p>
                        </div>
                      )}
                      {asset.deployment.min_altitude !== undefined && (
                        <div>
                          <p className="text-sm text-[#7A7A7A]">Min Altitude</p>
                          <p className="text-[#1A1A1A]">{asset.deployment.min_altitude} m</p>
                        </div>
                      )}
                      {asset.deployment.max_altitude !== undefined && (
                        <div>
                          <p className="text-sm text-[#7A7A7A]">Max Altitude</p>
                          <p className="text-[#1A1A1A]">{asset.deployment.max_altitude} m</p>
                        </div>
                      )}
                    </div>
                  )}
                  {asset.deployment.geographic_suitability_notes && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Geographic Suitability Notes</p>
                      <p className="text-[#1A1A1A]">{asset.deployment.geographic_suitability_notes}</p>
                    </div>
                  )}
                  {asset.deployment.deployment_notes && (
                    <div>
                      <p className="text-sm text-[#7A7A7A]">Deployment Notes</p>
                      <p className="text-[#1A1A1A]">{asset.deployment.deployment_notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[#7A7A7A]">No deployment data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Rejection</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => rejectMutation.mutate()}
              disabled={!rejectReason || rejectMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {rejectMutation.isPending ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
