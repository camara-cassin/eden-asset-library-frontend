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

export interface BasicInformation {
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

export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
}

export interface OperatingRange {
  min_temperature?: number;
  max_temperature?: number;
  min_humidity?: number;
  max_humidity?: number;
  pressure_notes?: string;
}

export interface UnitVariant {
  unit_name?: string;
  unit_of_analysis?: string;
  dimensions?: Dimensions;
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

export interface PhysicalConfiguration {
  unit_variants?: UnitVariant[];
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

export interface FunctionalIOItem {
  name?: string;
  type?: string;
  unit?: string;
  description?: string;
}

export interface FunctionalIO {
  inputs?: FunctionalIOItem[];
  outputs?: FunctionalIOItem[];
}

export type AvailabilityType = 'for_sale' | 'licensed' | 'open_source' | 'proprietary' | 'not_available';
export type GeneratesRevenue = 'yes' | 'no' | 'maybe';

export interface Economics {
  retail_price?: number;
  wholesale_price?: number;
  minimum_wholesale_quantity?: number;
  currency?: string;
  price_notes?: string;
  estimated_lifespan_years?: number;
  maintenance_cost_annual?: number;
  roi_notes?: string;
  availability_type?: AvailabilityType;
  generates_revenue?: GeneratesRevenue;
  estimated_annual_net_profit_usd?: number;
}

export interface Deployment {
  climate_zones?: string[];
  terrain_types?: string[];
  infrastructure_requirements?: string[];
  deployment_notes?: string;
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
  physical_configuration?: PhysicalConfiguration;
  plan_configuration?: PlanConfiguration;
  functional_io?: FunctionalIO;
  economics?: Economics;
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
  eden_impact_summary?: EdenImpactSummary;
  deployment?: Deployment;
  system_meta?: SystemMeta;
  contributor?: Contributor;
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
    category: string;
    short_summary?: string;
    subcategory?: string;
    scaling_potential?: ScalingPotential;
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
  sources: {
    use_uploaded_docs?: boolean;
    extra_doc_urls?: string[];
    extra_web_urls?: string[];
  };
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
