-- Migration: Add new contract fields to file_metadata table
-- Date: 2025-10-01
-- Description: Add contract_name and contract_tag fields to support new extraction schema

-- Add contract_name column
ALTER TABLE file_metadata ADD COLUMN contract_name VARCHAR;

-- Add contract_tag column  
ALTER TABLE file_metadata ADD COLUMN contract_tag VARCHAR;

-- Add comments for documentation
COMMENT ON COLUMN file_metadata.contract_name IS 'Contract name/title extracted from document';
COMMENT ON COLUMN file_metadata.contract_tag IS 'Contract expiry tag (e.g., "Expiry < 30 days", "Expiry 30 to 90 days", etc.)';

-- Optional: Update existing records with contract_name if needed
-- UPDATE file_metadata SET contract_name = 'Contract' WHERE contract_name IS NULL;
