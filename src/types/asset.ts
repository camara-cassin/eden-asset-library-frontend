// EdenAsset types based on backend schema

export type AssetType = 'physical' | 'plan' | 'hybrid';
export type AssetStatus = 'draft' | 'under_review' | 'approved' | 'deprecated';
export type SubmissionStatus = 
  | 'draft'
  | 'pending_review'
  | 'pending_supplier_contact'
  | 'pending_creator_contact'
  | 'pending_license_confirmation'
  | 'pending_agreement'
  | 'complete'
  | 'approved'
  | 'changes_requested'
  | 'rejected';
export type ScalingPotential = 'pilot' | 'local' | 'regional' | 'global';
export type PrefillStatus = 'not_run' | 'running' | 'complete' | 'failed';

export interface SystemMeta {
  status?: AssetStatus;
  version?: string;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  raw_source_text?: string;
  provenance_notes?: string;
  internal_reviewer_notes?: string;
}

export interface SourceUsed {
  source_type?: 'uploaded_document' | 'web_search' | 'manual_entry' | 'other';
  source_ref?: string;
  notes?: string;
}

export interface AIAssistance {
  prefill_status?: PrefillStatus;
  prefill_message?: string;
  last_run_at?: string;
  sources_used?: SourceUsed[];
  fields_prefilled?: string[];
}

// Category selection for multi-category support
export interface CategorySelection {
  primary: string;
  subcategories?: string[];
}

// Hierarchical category structure from API
export interface CategoryDefinition {
  primary: string;
  subcategories: string[];
  color: string;
}

export interface CategoriesResponse {
  categories: CategoryDefinition[];
}

export interface BasicInformation {
  // New multi-category structure (1-4 primary categories with optional subcategories)
  categories?: CategorySelection[];
  // Legacy single category fields (kept for backwards compatibility)
  category?: string;
  subcategory?: string;
  asset_name?: string;
  short_summary?: string;
  function_purpose?: string;
  scaling_potential?: ScalingPotential;
  long_description?: string;
  associated_physical_asset_id?: string;
  associated_plan_asset_id?: string;
  company_name?: string;
  company_phone?: string;
  company_email?: string;
  company_website_url?: string;
  product_url_with_eden_attribution?: string;
  creator_name?: string;
  creator_organization?: string;
  creator_email?: string;
  original_source_url?: string;
  attribution_text?: string;
  attribution_link?: string;
  license_owner?: string;
  certifications?: string[];
  patent_links?: string[];
  year_introduced_or_updated?: string;
}

export interface Contributor {
  name?: string;
  email?: string;
  eden_username?: string;
  wallet_address?: string;
  contributor_id?: string;
  submission_date?: string;
  notes?: string;
  submission_status?: SubmissionStatus;
  automated_outreach_status?: 'not_sent' | 'sent' | 'responded' | 'details_completed';
  agreement_signed?: boolean;
  agreement_document_url?: string;
}

export interface AssetImage {
  url: string;
  caption?: string;
  is_primary?: boolean;
}

export type BimFormat = 'IFC' | 'RVT' | 'OBJ' | 'STL' | 'glTF' | 'USDZ' | 'Other';

export interface BimModel {
  url: string;
  format?: BimFormat;
  source_software?: string;
}

export interface DigitalAssets {
  bim_models?: BimModel[];
}

export interface Overview {
  photos?: string[];
  images?: AssetImage[];
  key_features?: string[];
  intended_use_cases?: string[];
  asset_type_description?: string;
}

export interface DocumentationUploads {
  technical_spec_sheet_url?: string;
  product_datasheet_url?: string;
  cad_file_urls?: string[];
  bim_file_urls?: string[];
  engineering_drawings_urls?: string[];
  build_manual_url?: string;
  step_by_step_instructions_url?: string;
  bom_url?: string;
  tools_required_doc_url?: string;
  skills_required_doc_url?: string;
  safety_data_sheets_urls?: string[];
  certifications_docs_urls?: string[];
  patent_docs_urls?: string[];
  marketing_pdfs_urls?: string[];
  instructional_video_urls?: string[];
  additional_docs_urls?: string[];
}

// Dimension value with unit
export interface DimensionValue {
  value?: number;
  unit?: string; // cm, m, inches, ft
}

// Weight value with unit
export interface WeightValue {
  value?: number;
  unit?: string; // kg, lb
}

// Area value with unit
export interface AreaValue {
  value?: number;
  unit?: string; // m², ft², acres, hectares
}

// Dimensions with L/W/H and auto-calculated volume
export interface Dimensions {
  length?: DimensionValue;
  width?: DimensionValue;
  height?: DimensionValue;
  volume?: number; // Auto-calculated: L x W x H
}

// Legacy dimensions (for backwards compatibility)
export interface LegacyDimensions {
  length?: number;
  width?: number;
  height?: number;
}

// Package size for shipping
export interface PackageSize {
  length?: DimensionValue;
  width?: DimensionValue;
  height?: DimensionValue;
}

// Stackability information
export interface Stackability {
  is_stackable?: boolean;
  max_stack_height_units?: number;
  max_load_per_unit?: WeightValue;
}

// Modular interface entry
export interface ModularInterface {
  interface_types?: string[]; // Electrical, Plumbing, Data, Mechanical, Fluid, Hydraulic, Pneumatic, Other
  specification?: string;
  notes?: string;
}

// Unit variant (new structure)
export interface UnitVariantNew {
  variant_name?: string;
  model_number?: string;
  notes?: string;
}

export interface OperatingRange {
  min_temperature?: number;
  max_temperature?: number;
  min_humidity?: number;
  max_humidity?: number;
  pressure_notes?: string;
}

// Legacy UnitVariant for backwards compatibility
export interface UnitVariant {
  unit_name?: string;
  unit_of_analysis?: string;
  dimensions?: LegacyDimensions;
  footprint_area?: number;
  volume?: number;
  unit_weight?: number;
  package_size?: string;
  package_weight?: number;
  stackability_notes?: string;
  modular_interfaces?: string[];
  operating_range?: OperatingRange;
  scalability_notes?: string;
}

// Environmental rating options
export type EnvironmentalRating = 
  | 'Indoor'
  | 'Outdoor'
  | 'Marine / Coastal'
  | 'High-Dust / Industrial'
  | 'High-Humidity'
  | 'Explosion-Proof / Hazardous Area'
  | 'Clean Room'
  | 'Unknown';

export interface PhysicalConfiguration {
  // Legacy field for backwards compatibility
  unit_variants?: UnitVariant[];
  
  // New detailed fields
  unit_variants_new?: UnitVariantNew[];
  dimensions?: Dimensions;
  footprint_area?: AreaValue;
  unit_weight?: WeightValue;
  package_size?: PackageSize;
  package_weight?: WeightValue;
  units_per_package?: number;
  stackability?: Stackability;
  modular_interfaces?: ModularInterface[];
  environmental_rating?: EnvironmentalRating;
}

export interface PlanConfiguration {
  build_complexity_score?: number;
  tool_complexity_score?: number;
  required_skill_level?: string;
  required_skills?: string[];
  required_tools?: string[];
  estimated_build_time_hours?: number;
  annual_maintenance_time_hours?: number;
  repair_time_hours?: number;
}

export type TimePeriod = 'instant' | 'per_minute' | 'per_hour' | 'per_day' | 'per_week' | 'per_month' | 'per_year' | 'one_time';

export interface FunctionalIOInput {
  input_type?: string;
  quantity?: number;
  unit?: string;
  time_period?: TimePeriod;
  time_profile?: string;
  quality_spec?: string;
  estimated_financial_value_usd?: number;
  name?: string;
  type?: string;
  description?: string;
}

export interface FunctionalIOOutput {
  output_type?: string;
  quantity?: number;
  unit?: string;
  time_period?: TimePeriod;
  variability_profile?: string;
  quality_spec?: string;
  estimated_financial_value_usd?: number;
  name?: string;
  type?: string;
  description?: string;
}

export interface FunctionalIO {
  inputs?: FunctionalIOInput[];
  outputs?: FunctionalIOOutput[];
}

export interface Economics {
  retail_price?: number;
  wholesale_price?: number;
  minimum_wholesale_quantity?: number;
  production_lead_time_days?: number;
  production_capacity_per_month?: number;
  availability_type?: 'for_sale' | 'licensed' | 'open_source' | 'proprietary' | 'not_available';
  currency?: string;
  price_notes?: string;
  estimated_lifespan_years?: number;
  maintenance_cost_annual?: number;
  roi_notes?: string;
}

export interface EnvironmentalImpact {
  embodied_carbon_kg_co2e?: number;
  operational_carbon_kg_co2e_per_year?: number;
  air_pollution_notes?: string;
  water_pollution_notes?: string;
  soil_pollution_notes?: string;
  material_toxicity?: 'non_toxic' | 'low_toxicity' | 'moderate_toxicity' | 'high_toxicity' | 'unknown';
  manufacturing_toxicity?: 'clean' | 'low_emissions' | 'moderate_emissions' | 'high_emissions' | 'unknown';
  recyclability_percent?: number;
  biodegradation_timeline_years?: number;
  end_of_life_pathways?: string[];
  regenerative_outputs_notes?: string;
}

export interface HumanImpact {
  safety_rating?: string;
  emissions_during_use_notes?: string;
  off_gassing_notes?: string;
  noise_level_db?: number;
  health_benefits_notes?: string;
  risk_factors_notes?: string;
  ergonomics_score?: number;
  labour_demand_notes?: string;
  social_benefit_notes?: string;
}

export interface Deployment {
  climate_zones?: string[];
  terrain_types?: string[];
  infrastructure_requirements?: string[];
  deployment_notes?: string;
  min_operating_temperature?: number;
  max_operating_temperature?: number;
  min_relative_humidity?: number;
  max_relative_humidity?: number;
  max_wind_speed_rating?: number;
  max_rainfall_intensity?: number;
  min_altitude?: number;
  max_altitude?: number;
  soil_requirements?: string[];
  geographic_suitability_notes?: string;
}

export interface EdenImpactSummary {
  eden_positive_impact_points?: number;
  eden_recommended_rating?: string;
  impact_categories?: string[];
  impact_notes?: string;
}

export interface EdenAsset {
  id?: string;
  asset_id?: string;
  asset_type: AssetType;
  system_meta?: SystemMeta;
  ai_assistance?: AIAssistance;
  basic_information?: BasicInformation;
  contributor?: Contributor;
  overview?: Overview;
  documentation_uploads?: DocumentationUploads;
  digital_assets?: DigitalAssets;
  physical_configuration?: PhysicalConfiguration;
  plan_configuration?: PlanConfiguration;
  functional_io?: FunctionalIO;
  economics?: Economics;
  environmental_impact?: EnvironmentalImpact;
  human_impact?: HumanImpact;
  deployment?: Deployment;
  eden_impact_summary?: EdenImpactSummary;
}

export interface AssetListItem {
  id: string;
  asset_id: string;
  asset_type: AssetType;
  status: AssetStatus;
  basic_information?: BasicInformation;
  overview?: Overview;
  digital_assets?: DigitalAssets;
  eden_impact_summary?: EdenImpactSummary;
  deployment?: Deployment;
  system_meta?: SystemMeta;
  contributor?: Contributor;
  // Metadata fields from database columns
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

export interface AssetCreatePayload {
  asset_type: AssetType;
  basic_information: {
    asset_name: string;
    // New multi-category structure (1-4 primary categories with optional subcategories)
    categories?: CategorySelection[];
    // Legacy single category field (kept for backwards compatibility)
    category?: string;
    short_summary?: string;
    subcategory?: string;
    scaling_potential?: ScalingPotential;
    company_name?: string;
    company_email?: string;
    company_phone?: string;
    company_website_url?: string;
  };
  contributor?: {
    name?: string;
    email?: string;
    contributor_id?: string;
    notes?: string;
  };
  overview?: {
    asset_type_description?: string;
    intended_use_cases?: string[];
  };
  economics?: {
    retail_price?: number;
    wholesale_price?: number;
    minimum_wholesale_quantity?: number;
    availability_type?: 'for_sale' | 'licensed' | 'open_source' | 'proprietary' | 'not_available';
  };
  external_documentation_url?: string;
}

export interface AssetUpdatePayload {
  basic_information?: Partial<BasicInformation>;
  contributor?: Partial<Contributor>;
  overview?: Partial<Overview>;
  physical_configuration?: Partial<PhysicalConfiguration>;
  plan_configuration?: Partial<PlanConfiguration>;
  functional_io?: Partial<FunctionalIO>;
  documentation_uploads?: Partial<DocumentationUploads>;
}

export interface FileAttachPayload {
  target: string;
  url: string;
}

export interface AIExtractPayload {
  sources?: {
    use_uploaded_docs?: boolean;
    extra_doc_urls?: string[];
    extra_web_urls?: string[];
  };
  website_url?: string;
  use_uploaded_docs?: boolean;
}

export interface AIFieldUpdate {
  path: string;
  value: unknown;
  confidence: number;
  source: string;
}

export interface AIExtractionResponse {
  field_updates: AIFieldUpdate[];
  fields_prefilled: string[];
  sources_used: string[];
  notes_for_reviewer: string[];
}

export interface FileUploadResponse {
  url: string;
  filename: string;
  doc_type: string;
  field: string;
}

export interface UploadFilesResponse {
  uploaded: FileUploadResponse[];
  errors: string[] | null;
  asset: EdenAsset;
}

export interface ApprovePayload {
  reviewer_id?: string;
  review_notes?: string;
}

export interface RejectPayload {
  reviewer_id?: string;
  reason: string;
}

export interface AssetListParams {
  q?: string;
  asset_type?: AssetType;
  category?: string;
  status?: AssetStatus;
  submission_status?: SubmissionStatus;
  scaling_potential?: ScalingPotential;
  page?: number;
  page_size?: number;
  sort_by?: 'created_at' | 'updated_at' | 'eden_positive_impact_points';
  sort_dir?: 'asc' | 'desc';
}
