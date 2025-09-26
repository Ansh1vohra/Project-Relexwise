import google.generativeai as genai
from app.config import settings
import logging
from typing import Dict, Optional, Any
import json
import re
import asyncio

logger = logging.getLogger(__name__)

# Configure Google Generative AI
genai.configure(api_key=settings.google_api_key)

class MetadataExtractionService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')  # Free experimental model
        self.extraction_prompt = self._build_extraction_prompt()
    
    def _build_extraction_prompt(self) -> str:
        """
        Build the prompt for metadata extraction
        """
        return """
You are an expert contract analyst. From the given contract text, extract the following specific commercial and clause-related details with high precision:

REQUIRED FIELDS:
1. Start Date: The contract start/effective date (format: YYYY-MM-DD if possible, otherwise as written)
2. End Date: The contract end/expiry/termination date (format: YYYY-MM-DD if possible, otherwise as written)  
3. Vendor Name: The company/vendor providing services or goods
4. Contract Value: The total monetary value, amount, or price mentioned in the contract

CONTRACT TYPE (select EXACTLY one):
- MSA (Master Service Agreement)
- SOW (Statement of Work)
- Amendment
- Agreement
- Order Form
- Change Request
- Other (if none of the above match)

SCOPE OF SERVICES (select EXACTLY one):
- Managed Services
- Time & Material
- Hardware
- Software
- Maintenance

INSTRUCTIONS:
- If any field cannot be found or determined, mark it as "NA"
- Be precise and extract exact values as they appear in the contract
- For dates, try to standardize to YYYY-MM-DD format when possible
- For contract value, include currency if mentioned
- Choose the most appropriate category from the provided options

Respond ONLY in JSON format with these exact keys:
{
  "start_date": "extracted start date or NA",
  "end_date": "extracted end date or NA", 
  "vendor_name": "extracted vendor name or NA",
  "contract_value": "extracted contract value or NA",
  "contract_type": "one of the specified contract types",
  "scope_of_services": "one of the specified scope types"
}

CONTRACT TEXT:
"""
    
    async def extract_metadata(self, contract_text: str, file_id: str) -> Dict:
        """
        Extract metadata from contract text using Google's Gemini model
        """
        try:
            logger.info(f"Starting metadata extraction for file {file_id}")
            
            # Prepare the full prompt
            full_prompt = self.extraction_prompt + contract_text[:10000]  # Limit text to avoid token limits
            
            # Generate response from Gemini
            response = await self._generate_with_retry(full_prompt)
            
            # Parse the JSON response
            metadata = self._parse_response(response.text)
            
            # Validate and clean the metadata
            cleaned_metadata = self._validate_and_clean_metadata(metadata)
            
            logger.info(f"Successfully extracted metadata for file {file_id}")
            return cleaned_metadata
            
        except Exception as e:
            logger.error(f"Error extracting metadata for file {file_id}: {str(e)}")
            raise Exception(f"Failed to extract metadata: {str(e)}")
    
    async def _generate_with_retry(self, prompt: str, max_retries: int = 3) -> Any:
        """
        Generate response with retry logic
        """
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                return response
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                logger.warning(f"Retry {attempt + 1}/{max_retries} for metadata generation: {str(e)}")
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
    
    def _parse_response(self, response_text: str) -> Dict:
        """
        Parse the JSON response from the LLM
        """
        try:
            # Clean the response text - remove any markdown formatting
            cleaned_text = response_text.strip()
            
            # Remove markdown code blocks if present
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            
            cleaned_text = cleaned_text.strip()
            
            # Parse JSON
            metadata = json.loads(cleaned_text)
            return metadata
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {response_text}")
            # Try to extract JSON using regex
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass
            
            # Return default structure if parsing fails
            return self._get_default_metadata()
    
    def _validate_and_clean_metadata(self, metadata: Dict) -> Dict:
        """
        Validate and clean the extracted metadata
        """
        # Define valid options
        valid_contract_types = ["MSA", "SOW", "Amendment", "Agreement", "Order Form", "Change Request", "Other"]
        valid_scope_types = ["Managed Services", "Time & Material", "Hardware", "Software", "Maintenance"]
        
        # Ensure all required fields exist
        required_fields = ["start_date", "end_date", "vendor_name", "contract_value", "contract_type", "scope_of_services"]
        for field in required_fields:
            if field not in metadata or metadata[field] is None:
                metadata[field] = "NA"
        
        # Validate contract type
        if metadata.get("contract_type") not in valid_contract_types:
            metadata["contract_type"] = "Other"
        
        # Validate scope of services  
        if metadata.get("scope_of_services") not in valid_scope_types:
            metadata["scope_of_services"] = "NA"
        
        # Clean up empty strings
        for key, value in metadata.items():
            if isinstance(value, str) and value.strip() == "":
                metadata[key] = "NA"
        
        return metadata
    
    def _get_default_metadata(self) -> Dict:
        """
        Return default metadata structure when extraction fails
        """
        return {
            "start_date": "NA",
            "end_date": "NA",
            "vendor_name": "NA", 
            "contract_value": "NA",
            "contract_type": "Other",
            "scope_of_services": "NA"
        }

metadata_extraction_service = MetadataExtractionService()
