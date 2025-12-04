import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schemaPath = join(__dirname, '..', 'schemas', 'eden_asset.schema.json');
const fixturePath = join(__dirname, 'fixtures', 'example_valid_asset.json');

const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
const exampleAsset = JSON.parse(readFileSync(fixturePath, 'utf-8'));

const validate = ajv.compile(schema);

describe('Schema Compliance Tests', () => {
  describe('Valid Asset Validation', () => {
    it('should validate the example valid asset', () => {
      const valid = validate(exampleAsset);
      if (!valid) {
        console.error('Validation errors:', validate.errors);
      }
      expect(valid).toBe(true);
    });

    it('should validate a minimal physical asset', () => {
      const minimalAsset = {
        asset_type: 'physical',
        basic_information: {
          asset_name: 'Test Asset',
          category: 'Energy'
        }
      };
      const valid = validate(minimalAsset);
      expect(valid).toBe(true);
    });

    it('should validate a plan asset', () => {
      const planAsset = {
        asset_type: 'plan',
        basic_information: {
          asset_name: 'Solar Installation Plan',
          category: 'Energy',
          short_summary: 'Step-by-step guide for solar panel installation'
        },
        contributor: {
          name: 'Plan Author',
          email: 'author@example.com',
          submission_status: 'draft'
        }
      };
      const valid = validate(planAsset);
      expect(valid).toBe(true);
    });

    it('should validate a hybrid asset', () => {
      const hybridAsset = {
        asset_type: 'hybrid',
        basic_information: {
          asset_name: 'Solar Kit with Instructions',
          category: 'Energy',
          short_summary: 'Complete solar kit with installation guide'
        }
      };
      const valid = validate(hybridAsset);
      expect(valid).toBe(true);
    });
  });

  describe('Invalid Asset Validation - Missing Required Fields', () => {
    it('should fail validation when asset_type is missing', () => {
      const invalidAsset = {
        basic_information: {
          asset_name: 'Test Asset',
          category: 'Energy'
        }
      };
      const valid = validate(invalidAsset);
      expect(valid).toBe(false);
      expect(validate.errors).toBeDefined();
      expect(validate.errors!.some(e => e.keyword === 'required' && e.params.missingProperty === 'asset_type')).toBe(true);
    });
  });

  describe('Invalid Asset Validation - Wrong Types', () => {
    it('should fail validation when asset_type has wrong enum value', () => {
      const invalidAsset = {
        asset_type: 'invalid_type',
        basic_information: {
          asset_name: 'Test Asset',
          category: 'Energy'
        }
      };
      const valid = validate(invalidAsset);
      expect(valid).toBe(false);
      expect(validate.errors).toBeDefined();
      expect(validate.errors!.some(e => e.keyword === 'enum')).toBe(true);
    });

    it('should fail validation when economics.retail_price is a string instead of number', () => {
      const invalidAsset = {
        asset_type: 'physical',
        basic_information: {
          asset_name: 'Test Asset',
          category: 'Energy'
        },
        economics: {
          retail_price: 'five hundred'
        }
      };
      const valid = validate(invalidAsset);
      expect(valid).toBe(false);
      expect(validate.errors).toBeDefined();
      expect(validate.errors!.some(e => e.keyword === 'type' && e.instancePath.includes('retail_price'))).toBe(true);
    });

    it('should fail validation when system_meta.status has wrong enum value', () => {
      const invalidAsset = {
        asset_type: 'physical',
        system_meta: {
          status: 'invalid_status'
        }
      };
      const valid = validate(invalidAsset);
      expect(valid).toBe(false);
      expect(validate.errors).toBeDefined();
      expect(validate.errors!.some(e => e.keyword === 'enum')).toBe(true);
    });

    it('should fail validation when deployment.climate_zones is not an array', () => {
      const invalidAsset = {
        asset_type: 'physical',
        deployment: {
          climate_zones: 'temperate'
        }
      };
      const valid = validate(invalidAsset);
      expect(valid).toBe(false);
      expect(validate.errors).toBeDefined();
      expect(validate.errors!.some(e => e.keyword === 'type' && e.instancePath.includes('climate_zones'))).toBe(true);
    });
  });

  describe('Schema Structure Validation', () => {
    it('should have required asset_type field in schema', () => {
      expect(schema.required).toContain('asset_type');
    });

    it('should have correct asset_type enum values', () => {
      expect(schema.properties.asset_type.enum).toEqual(['physical', 'plan', 'hybrid']);
    });

    it('should have system_meta.status with correct enum values', () => {
      expect(schema.properties.system_meta.properties.status.enum).toEqual([
        'draft', 'under_review', 'approved', 'deprecated'
      ]);
    });

    it('should have basic_information section', () => {
      expect(schema.properties.basic_information).toBeDefined();
      expect(schema.properties.basic_information.type).toBe('object');
    });

    it('should have contributor section', () => {
      expect(schema.properties.contributor).toBeDefined();
      expect(schema.properties.contributor.type).toBe('object');
    });

    it('should have economics section', () => {
      expect(schema.properties.economics).toBeDefined();
      expect(schema.properties.economics.type).toBe('object');
    });

    it('should have deployment section', () => {
      expect(schema.properties.deployment).toBeDefined();
      expect(schema.properties.deployment.type).toBe('object');
    });
  });
});
