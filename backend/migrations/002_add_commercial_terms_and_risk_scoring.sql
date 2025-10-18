-- Migration: Add commercial terms and risk scoring fields to file_metadata table
-- Date: 2025-10-13
-- Purpose: Support commercial terms extraction and risk assessment

-- Add commercial terms fields
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS auto_renewal VARCHAR;
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS payment_terms VARCHAR;
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS liability_cap VARCHAR;
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS termination_for_convenience VARCHAR;
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS price_escalation VARCHAR;

-- Add risk scoring fields
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS auto_renewal_risk_score INTEGER;
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS payment_terms_risk_score INTEGER;
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS liability_cap_risk_score INTEGER;
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS termination_risk_score INTEGER;
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS price_escalation_risk_score INTEGER;
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS total_risk_score FLOAT;
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS risk_band VARCHAR;
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS risk_color VARCHAR;
