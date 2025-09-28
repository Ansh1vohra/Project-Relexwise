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
You are an expert Contract Manager and Legal Analyst. You carefully read IT service contracts and extract only the precise, objective details requested. Do not add assumptions. If information is missing or ambiguous, return "NA".

From the following contract text, extract the following details in structured format.
Each field must return a precise value or "NA" if not available.
Do not include explanations, only structured output.

Fields to Extract:

VendorName - Legal name of the counterparty/vendor.

StartDate - Effective date or commencement date.

EndDate - Expiry date or contract end date. If end date is not provided and we have contract duration provided (next column), then autocalculate End Date using Contract Duration - End Date equals Start Date plus contract duration

Contract Duration - Contract Term, Active Term of the contract. If it's not provided, autocalculate using Start Date and End Date. End Date minus Start Date in Years up to one decimal point.

ContractValue (Local)→ Total contract value (with number only) in the given currency.

Currency → Currency of the contract value (USD, INR, EUR, etc.).

Contract Value (USD) - Convert the Contract Value to US Dollars using the Forex dates from Oanda.

ContractStatus → Classify as one of: "Active", "Draft", "Expired". Draft means that the contract doesn't have any signature or stakeholder names (actual people from both Vendor Side and Customer Side)

Rule: If StartDate ≤ today ≤ EndDate → Active. If EndDate < today → Expired. If unsigned / marked draft → Draft.

ContractType → Classify as one of: "MSA", "SOW", "Amendment", "Agreement", "Order Form", "Change Request", "Other".

ScopeOfServices → Classify as one of: "Managed Services", "Time & Material", "Hardware", "Software", "Maintenance", "Other".

Commercial Terms (Detailed Extraction Guide) - We need to extract the Commercial Terms across respective ScopeOfServices ("Managed Services", "Time & Material", "Hardware", "Software", "Maintenance").

Managed Services - 
1. TerminationForConvenience
What to Extract: Does the contract allow either party to terminate without cause? If yes → period of notice (e.g., "90 days' notice").
Example Clause: "Either party may terminate this Agreement for convenience upon 90 days' prior written notice."
Expected Output: "90 days"
If Absent: "NA"

2. LiabilityCap
What to Extract: The monetary or time-based cap on vendor's liability (e.g., "12 months of fees," "$2 million cap").
Example Clause: "Vendor's aggregate liability shall not exceed the fees paid in the preceding 12 months."
Expected Output: "12 months of fees"
If Absent: "NA"

PaymentTerms
What to Extract: Days allowed for invoice settlement (Net 30/45/60).
Example Clause: "Invoices are payable within 45 days of receipt."
Expected Output: "Net 45"
If Absent: "NA"

b. Time & Material
1. COLA (Cost of Living Adjustment)
What to Extract: Any reference to annual price adjustment tied to CPI/Inflation indices. Capture % or formula.
Example Clause: "Charges shall increase annually by the lesser of 5% or the CPI index."
Expected Output: "5% or CPI annually"
If Absent: "NA"
2. FXExposure (Currency/Exchange Clauses)
What to Extract: Whether contract prices are fixed in one currency or subject to FX fluctuation.
Example Clause: "All payments shall be made in USD; any FX variations to be borne by Customer."
Expected Output: "Prices fixed in USD; FX borne by Customer"
If Absent: "NA"

3. Volume Discount
What to Extract: Volume discount based on Project Size or total spend.
Example Clause: "5% volume discount on spend beyond $10M"
Expected Output: 5% at 10M+
If Absent: "NA"

c. Hardware
1. WarrantyPeriod
What to Extract: Warranty length for hardware (3, 12, 36 months).
Example Clause: "Vendor warrants hardware for 12 months from delivery."
Expected Output: "12 months"
If Absent: "NA"

2. DeliveryRiskAllocation
What to Extract: Who bears risk of loss/damage during shipping (Vendor vs Buyer).
Example Clause: "Risk of loss passes to Customer upon delivery at site."
Expected Output: "Risk passes on delivery at site"
If Absent: "NA"

3. AcceptanceCriteria
What to Extract: When hardware is deemed "accepted" (on delivery, after inspection, after testing).
Example Clause: "Acceptance shall occur after 30 days of successful performance testing."
Expected Output: "30 days testing before acceptance"
If Absent: "NA"

d. Software
1. AutoRenewal
What to Extract: Does the contract auto-renew? Capture period + notice required.
Example Clause: "This subscription shall auto-renew annually unless terminated 60 days before expiry."
Expected Output: "Auto-renews annually; 60 days' notice required"
If Absent: "NA"

2. COLA (Uplift Clauses)
What to Extract: Any annual price uplift %.
Example Clause: "License fees shall increase by 7% annually."
Expected Output: "7% annual uplift"
If Absent: "NA"

3. SupportWarranty
What to Extract: Duration of included support/warranty (e.g., bug fixes, updates).
Example Clause: "Vendor shall provide 6 months support at no additional charge."
Expected Output: "6 months included support"
If Absent: "NA"

e. Maintenance & Support
1. EscalationPercentage (Annual Increases)
What to Extract: % annual escalation on fees.
Example Clause: "Maintenance fees shall increase by 5% annually."
Expected Output: "5% per year"
If Absent: "NA"

2. AutoRenewal
What to Extract: Renewal mechanics for maintenance contract.
Example Clause: "Agreement auto-renews for 1-year terms unless terminated 30 days before expiry."
Expected Output: "Auto-renews yearly; 30 days' notice"
If Absent: "NA"

3. SLAPenalties (Service Credits)
What to Extract: Penalties for SLA breaches (e.g., % of monthly fee).
Example Clause: "If uptime falls below 99.9%, Customer entitled to 5% service credit."
Expected Output: "5% credit if uptime <99.9%"
If Absent: "NA"

Please return the response in the following JSON format with only the main fields we need to store in the database:
{
    "vendor_name": "extracted value or NA",
    "start_date": "extracted value or NA",
    "end_date": "extracted value or NA",
    "contract_duration": "extracted value or NA",
    "contract_value_local": "extracted value or NA",
    "currency": "extracted value or NA",
    "contract_value_usd": "extracted value or NA",
    "contract_status": "extracted value or NA",
    "contract_type": "extracted value or NA",
    "scope_of_services": "extracted value or NA"
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
        
        # Ensure all required fields exist
        required_fields = [
            "start_date", "end_date", "vendor_name", "contract_duration",
            "contract_value_local", "currency", "contract_value_usd",
            "contract_status", "contract_type", "scope_of_services"
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
            "contract_value": "NA"  # Legacy field for backward compatibility
        }

metadata_extraction_service = MetadataExtractionService()
