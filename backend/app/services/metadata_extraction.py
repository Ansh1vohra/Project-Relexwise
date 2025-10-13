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
        self.model = genai.GenerativeModel('gemini-2.5-flash') 
        self.extraction_prompt = self._build_extraction_prompt()
    
    def _build_extraction_prompt(self) -> str:
        """
        Build the prompt for metadata extraction
        """
        return """
You are an expert Contract Manager and Legal Analyst. You carefully read IT service contracts and extract only the precise, objective details requested. Do not add assumptions. If information is missing or ambiguous, return "NA".

From the following contract text, extract the following details in structured format.
Each field must return a precise value or "NA" if not available.
Do not include explanations, only structured output.

**CORE CONTRACT FIELDS:**

1. **Contract Name/Title** - Extract the formal title or name of the contract as mentioned in the document header or title section.

2. **VendorName** - Legal name of the counterparty/vendor organization.

3. **StartDate** - Effective date or commencement date (format: YYYY-MM-DD).

4. **EndDate** - Expiry date or contract end date (format: YYYY-MM-DD). If end date is not provided and contract duration is available, auto-calculate: End Date = Start Date + Contract Duration.

5. **Contract Duration** - Contract Term/Active Term. If not explicitly stated, auto-calculate using Start Date and End Date. Format as years with one decimal point (e.g., "2.5 years").

6. **ContractValue (Local)** - Total contract value (numeric only) in the given currency.

7. **Currency** - Currency of the contract value (USD, INR, EUR, etc.).

8. **Contract Value (USD)** - Convert the Contract Value to US Dollars using standard exchange rates.

9. **ContractStatus** - Classify as one of: "Active", "Draft", "Expired"
   - Rule: If StartDate ≤ today ≤ EndDate → Active
   - If EndDate < today → Expired  
   - If unsigned/no signatures/marked draft → Draft

10. **ContractType** - Classify as one of: "MSA", "SOW", "Amendment", "Agreement", "Order Form", "Change Request", "Other"

11. **ScopeOfServices** - Classify as one of: "Managed Services", "Time & Material", "Hardware", "Software", "Maintenance", "Other"

12. **Contract Tag** - Classify contract expiry status as one of:
   - "Expiry < 30 days" (if contract expires within 30 days from today)
   - "Expiry 30 to 90 days" (if contract expires between 30-90 days from today)
   - "Expiry 90 days to 1 year" (if contract expires between 90 days to 1 year from today)
   - "Expiry > 1 year" (if contract expires more than 1 year from today)
   - "Expired" (if contract has already expired)
   - "No expiry date" (if no end date is specified)

**COMMERCIAL TERMS EXTRACTION:**

Based on the ScopeOfServices classification, extract relevant commercial terms:

**A. Managed Services:**
- TerminationForConvenience: Notice period for termination without cause (e.g., "90 days")
- LiabilityCap: Monetary or time-based liability cap (e.g., "12 months of fees")
- PaymentTerms: Invoice settlement days (e.g., "Net 45")

**B. Time & Material:**
- COLA: Annual price adjustment tied to CPI/Inflation (e.g., "5% or CPI annually")
- FXExposure: Currency risk allocation (e.g., "Prices fixed in USD; FX borne by Customer")
- VolumeDiscount: Volume discounts based on spend (e.g., "5% at 10M+")

**C. Hardware:**
- WarrantyPeriod: Hardware warranty length (e.g., "12 months")
- DeliveryRiskAllocation: Risk allocation during shipping (e.g., "Risk passes on delivery")
- AcceptanceCriteria: Hardware acceptance timeline (e.g., "30 days testing")

**D. Software:**
- AutoRenewal: Renewal mechanics (e.g., "Auto-renews annually; 60 days notice")
- COLA: Annual price uplift percentage (e.g., "7% annual uplift")
- SupportWarranty: Included support duration (e.g., "6 months included support")

**E. Maintenance & Support:**
- EscalationPercentage: Annual fee increases (e.g., "5% per year")
- AutoRenewal: Renewal mechanics (e.g., "Auto-renews yearly; 30 days notice")
- SLAPenalties: Service level penalties (e.g., "5% credit if uptime <99.9%")

**OUTPUT FORMAT:**
Return the response in the following JSON format with only the main fields for database storage:

{
    "contract_name": "extracted title/name or NA",
    "vendor_name": "extracted value or NA",
    "start_date": "YYYY-MM-DD or NA",
    "end_date": "YYYY-MM-DD or NA", 
    "contract_duration": "X.X years or NA",
    "contract_value_local": "numeric value or NA",
    "currency": "currency code or NA",
    "contract_value_usd": "USD equivalent or NA",
    "contract_status": "Active/Draft/Expired or NA",
    "contract_type": "MSA/SOW/Amendment/Agreement/Order Form/Change Request/Other",
    "scope_of_services": "Managed Services/Time & Material/Hardware/Software/Maintenance/Other",
    "contract_tag": "expiry classification as defined above"
}

Contract text to analyze:
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
        valid_scope_types = ["Managed Services", "Time & Material", "Hardware", "Software", "Maintenance", "Other"]
        valid_contract_status = ["Active", "Draft", "Expired"]
        valid_contract_tags = [
            "Expiry < 30 days", 
            "Expiry 30 to 90 days", 
            "Expiry 90 days to 1 year", 
            "Expiry > 1 year", 
            "Expired", 
            "No expiry date"
        ]
        
        # Ensure all required fields exist
        required_fields = [
            "contract_name", "start_date", "end_date", "vendor_name", "contract_duration",
            "contract_value_local", "currency", "contract_value_usd",
            "contract_status", "contract_type", "scope_of_services", "contract_tag"
        ]
        for field in required_fields:
            if field not in metadata or metadata[field] is None:
                metadata[field] = "NA"
        
        # Validate contract type
        if metadata.get("contract_type") not in valid_contract_types:
            metadata["contract_type"] = "Other"
        
        # Validate scope of services  
        if metadata.get("scope_of_services") not in valid_scope_types:
            metadata["scope_of_services"] = "Other"
            
        # Validate contract status
        if metadata.get("contract_status") not in valid_contract_status:
            metadata["contract_status"] = "NA"
            
        # Validate contract tag
        if metadata.get("contract_tag") not in valid_contract_tags:
            metadata["contract_tag"] = "No expiry date"
        
        # Clean up empty strings
        for key, value in metadata.items():
            if isinstance(value, str) and value.strip() == "":
                metadata[key] = "NA"
                
        # Keep legacy contract_value field for backward compatibility
        if "contract_value_local" in metadata and metadata["contract_value_local"] != "NA":
            metadata["contract_value"] = metadata["contract_value_local"]
        else:
            metadata["contract_value"] = "NA"
        
        return metadata
    
    def _get_default_metadata(self) -> Dict:
        """
        Return default metadata structure when extraction fails
        """
        return {
            "contract_name": "NA",
            "start_date": "NA",
            "end_date": "NA",
            "vendor_name": "NA",
            "contract_duration": "NA",
            "contract_value_local": "NA",
            "currency": "NA",
            "contract_value_usd": "NA",
            "contract_status": "NA",
            "contract_type": "Other",
            "scope_of_services": "Other",
            "contract_tag": "No expiry date",
            "contract_value": "NA"  # Legacy field for backward compatibility
        }

metadata_extraction_service = MetadataExtractionService()
