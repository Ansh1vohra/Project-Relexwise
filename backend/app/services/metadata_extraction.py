import google.generativeai as genai
from app.config import settings
import logging
from typing import Dict, Optional, Any
import json
import re
import asyncio
from datetime import datetime, timedelta
import requests

logger = logging.getLogger(__name__)

# Configure Google Generative AI
genai.configure(api_key=settings.google_api_key)

class MetadataExtractionService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.5-flash') 
        self.extraction_prompt = self._build_extraction_prompt()
    
    def _normalize_date(self, date_string: str) -> str:
        """
        Normalize date string to DD-MM-YYYY format
        """
        if not date_string or date_string.strip().lower() in ['na', '', 'n/a']:
            return "NA"
        
        date_string = date_string.strip()
        
        # Common date patterns to try
        date_patterns = [
            "%Y-%m-%d",      # 2024-12-31
            "%d-%m-%Y",      # 31-12-2024
            "%m-%d-%Y",      # 12-31-2024
            "%d/%m/%Y",      # 31/12/2024
            "%m/%d/%Y",      # 12/31/2024
            "%Y/%m/%d",      # 2024/12/31
            "%d.%m.%Y",      # 31.12.2024
            "%Y.%m.%d",      # 2024.12.31
            "%B %d, %Y",     # December 31, 2024
            "%b %d, %Y",     # Dec 31, 2024
            "%d %B %Y",      # 31 December 2024
            "%d %b %Y",      # 31 Dec 2024
        ]
        
        for pattern in date_patterns:
            try:
                parsed_date = datetime.strptime(date_string, pattern)
                return parsed_date.strftime("%d-%m-%Y")
            except ValueError:
                continue
        
        # Try to extract date with regex for more flexible parsing
        # Look for patterns like "31st December 2024", "Dec 31, 2024", etc.
        import re
        
        # Remove ordinal suffixes (1st, 2nd, 3rd, 4th, etc.)
        cleaned_date = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', date_string)
        
        for pattern in date_patterns:
            try:
                parsed_date = datetime.strptime(cleaned_date, pattern)
                return parsed_date.strftime("%d-%m-%Y")
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date format: {date_string}")
        return date_string  # Return original if parsing fails
    
    def _convert_currency_to_usd(self, amount_str: str, currency: str) -> str:
        """
        Convert local currency amount to USD
        """
        if not amount_str or amount_str.strip().lower() in ['na', '', 'n/a']:
            return "NA"
        
        if not currency or currency.strip().lower() in ['na', '', 'n/a']:
            return "NA"
        
        # Clean the amount string
        cleaned_amount = re.sub(r'[^\d.,]', '', amount_str.strip())
        
        # Handle different number formats
        if ',' in cleaned_amount and '.' in cleaned_amount:
            # Assume comma is thousands separator and dot is decimal
            cleaned_amount = cleaned_amount.replace(',', '')
        elif ',' in cleaned_amount:
            # Could be either thousands separator or decimal separator
            # If more than 3 digits after comma, it's likely decimal
            parts = cleaned_amount.split(',')
            if len(parts) == 2 and len(parts[1]) <= 3:
                # Likely thousands separator
                cleaned_amount = cleaned_amount.replace(',', '')
            else:
                # Likely decimal separator
                cleaned_amount = cleaned_amount.replace(',', '.')
        
        try:
            amount = float(cleaned_amount)
        except ValueError:
            logger.warning(f"Could not parse amount: {amount_str}")
            return "NA"
        
        # If already in USD, return as is
        if currency.upper() in ['USD', 'US$', '$']:
            return f"{amount:.2f}"
        
        # Simple exchange rates (in production, use a real API like Fixer.io or CurrencyAPI)
        # These are approximate rates as of 2024
        exchange_rates = {
            'EUR': 1.08,    # 1 EUR = 1.08 USD
            'GBP': 1.26,    # 1 GBP = 1.26 USD
            'INR': 0.012,   # 1 INR = 0.012 USD
            'JPY': 0.0067,  # 1 JPY = 0.0067 USD
            'CAD': 0.74,    # 1 CAD = 0.74 USD
            'AUD': 0.66,    # 1 AUD = 0.66 USD
            'CHF': 1.10,    # 1 CHF = 1.10 USD
            'CNY': 0.14,    # 1 CNY = 0.14 USD
            'SGD': 0.74,    # 1 SGD = 0.74 USD
        }
        
        # Try to get exchange rate
        rate = exchange_rates.get(currency.upper())
        if rate:
            usd_amount = amount * rate
            return f"{usd_amount:.2f}"
        
        # If currency not found, try to get from a free API (optional)
        try:
            # Using a simple exchange rate API (you might want to use a more reliable one)
            response = requests.get(f"https://api.exchangerate-api.com/v4/latest/{currency.upper()}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                usd_rate = data.get('rates', {}).get('USD')
                if usd_rate:
                    usd_amount = amount * usd_rate
                    return f"{usd_amount:.2f}"
        except Exception as e:
            logger.warning(f"Could not fetch exchange rate for {currency}: {str(e)}")
        
        logger.warning(f"No exchange rate found for currency: {currency}")
        return "NA"
    
    def _calculate_contract_status_and_tag(self, start_date: str, end_date: str, metadata: Dict) -> tuple:
        """
        Calculate contract status and tag based on dates and content
        """
        current_date = datetime.now()
        
        # Check if it's a draft based on missing signatures/stakeholders
        vendor_name = metadata.get('vendor_name', 'NA').strip()
        if vendor_name in ['NA', '', 'n/a'] or len(vendor_name) < 3:
            return "Draft", "NA"
        
        # Try to parse dates
        try:
            if start_date and start_date not in ['NA', '', 'n/a']:
                start_dt = datetime.strptime(start_date, "%d-%m-%Y")
            else:
                start_dt = None
                
            if end_date and end_date not in ['NA', '', 'n/a']:
                end_dt = datetime.strptime(end_date, "%d-%m-%Y")
            else:
                end_dt = None
        except ValueError:
            # If date parsing fails, default to Draft
            return "Draft", "NA"
        
        # Determine status based on dates
        if start_dt is None and end_dt is None:
            status = "Draft"
        elif start_dt is None:
            status = "Draft"
        elif end_dt is None:
            status = "Active"  # No end date means ongoing
        elif end_dt < current_date:
            status = "Expired"
        elif start_dt <= current_date <= end_dt:
            status = "Active"
        else:
            status = "Draft"  # Future contract
        
        # Calculate contract tag
        tag = "NA"
        if status == "Active" and end_dt:
            days_to_expiry = (end_dt - current_date).days
            if days_to_expiry < 30:
                tag = "Expiry < 30 days"
            elif 30 <= days_to_expiry <= 90:
                tag = "Expiry 30 to 90 days"
            elif days_to_expiry > 90:
                tag = "Expiry > 90 days"
        
        return status, tag
    
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

StartDate - Effective date or commencement date. Format as "DD-MM-YYYY" (e.g., 31-12-2024).

EndDate - Expiry date or contract end date. Format as "DD-MM-YYYY" (e.g., 31-12-2025). If end date is not provided and we have contract duration provided (next column), then autocalculate End Date using Contract Duration - End Date equals Start Date plus contract duration

Contract Duration - Contract Term, Active Term of the contract. If it's not provided, autocalculate using Start Date and End Date. End Date minus Start Date in Years up to one decimal point.

ContractValue (Local)→ Total contract value (with number only) in the given currency.

Currency → Currency of the contract value (USD, INR, EUR, etc.).

Contract Value (USD) - Convert the Contract Value to US Dollars using current exchange rates. If contract is already in USD, return the same value. Provide numeric value only (e.g., 50000.00).

ContractStatus → Classify as one of: "Active", "Draft", "Expired". 

Draft means that the contract doesn't have any signature or stakeholder names (actual people from both Vendor Side and Customer Side), OR if it appears to be a template/unsigned document.

Business Logic (system will verify this):
- If StartDate ≤ today ≤ EndDate → Active
- If EndDate < today → Expired  
- If unsigned / marked draft / no clear parties → Draft

ContractType → Classify as one of: "MSA", "SOW", "Amendment", "Agreement", "Order Form", "Change Request", "Other".

ScopeOfServices → Classify as one of: "Managed Services", "Time & Material", "Hardware", "Software", "Maintenance", "Other".

Commercial Terms - Extract the following 5 key commercial clauses:

1. autoRenewal - Look for explicit renewal clauses. Example output: "Auto-renews annually; 60 days' notice". If absent: "NA".

2. paymentTerms - Look for due period keywords: "Net 30", "Net 60", "within 45 days of invoice". Example output: "Net 45". If absent: "NA".

3. liabilityCap - Look for "limitation of liability" clauses. Example output: "12 months of fees", "Capped at $1M". If absent: "NA".

4. terminationForConvenience - Look for termination without cause language. Example output: "90 days' notice". If absent: "NA".

5. priceEscalation - Look for "annual increase", "uplift", "CPI-based escalation". Example output: "5% annual uplift", "CPI + 2%". If absent: "NA".

Risk Scoring - Calculate risk scores (0-2 scale) for each commercial term:

Risk Scale: 0 = Low Risk, 1 = Medium Risk, 2 = High Risk

1. auto_renewal_risk_score:
   - 0: No auto-renewal OR clear 90+ days termination notice
   - 1: Auto-renewal with 30-89 days notice
   - 2: Auto-renewal with <30 days notice OR unclear termination terms

2. payment_terms_risk_score:
   - 0: Net 30 days or better
   - 1: Net 31-60 days
   - 2: Net 60+ days OR unclear payment terms

3. liability_cap_risk_score:
   - 0: Liability capped at contract value or less
   - 1: Liability capped above contract value but reasonable
   - 2: No liability cap OR unlimited liability

4. termination_convenience_risk_score:
   - 0: Can terminate for convenience with reasonable notice
   - 1: Can terminate but with penalties or long notice
   - 2: Cannot terminate for convenience OR severe penalties

5. price_escalation_risk_score:
   - 0: No price escalation OR capped at inflation rate
   - 1: Price escalation 3-5% annually
   - 2: Price escalation >5% annually OR uncapped escalation

Calculate overall_risk_score as weighted average:
- auto_renewal_risk_score: 20% weight (0.20)
- payment_terms_risk_score: 25% weight (0.25)
- liability_cap_risk_score: 30% weight (0.30)
- termination_convenience_risk_score: 15% weight (0.15)
- price_escalation_risk_score: 10% weight (0.10)

Formula: overall_risk_score = (auto_renewal_risk_score * 0.20) + (payment_terms_risk_score * 0.25) + (liability_cap_risk_score * 0.30) + (termination_convenience_risk_score * 0.15) + (price_escalation_risk_score * 0.10)

Round overall_risk_score to 2 decimal places.

Please return the response in the following JSON format:
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
    "scope_of_services": "extracted value or NA",
    "auto_renewal": "extracted value or NA",
    "payment_terms": "extracted value or NA",
    "liability_cap": "extracted value or NA",
    "termination_for_convenience": "extracted value or NA",
    "price_escalation": "extracted value or NA",
    "auto_renewal_risk_score": 0,
    "payment_terms_risk_score": 0,
    "liability_cap_risk_score": 0,
    "termination_convenience_risk_score": 0,
    "price_escalation_risk_score": 0,
    "overall_risk_score": 0.00
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
        Validate and clean the extracted metadata with date normalization and currency conversion
        """
        # Define valid options
        valid_contract_types = ["MSA", "SOW", "Amendment", "Agreement", "Order Form", "Change Request", "Other"]
        valid_scope_types = ["Managed Services", "Time & Material", "Hardware", "Software", "Maintenance", "Other"]
        valid_contract_status = ["Active", "Draft", "Expired"]
        valid_contract_tags = [
            "Expiry < 30 days", 
            "Expiry 30 to 90 days", 
            "Expiry > 90 days", 
            "NA"
        ]
        
        # Ensure all required fields exist
        required_fields = [
            "contract_name", "start_date", "end_date", "vendor_name", "contract_duration",
            "contract_value_local", "currency", "contract_value_usd",
            "contract_status", "contract_type", "scope_of_services", "contract_tag",
            "auto_renewal", "payment_terms", "liability_cap", "termination_for_convenience", "price_escalation"
        ]
        for field in required_fields:
            if field not in metadata or metadata[field] is None:
                metadata[field] = "NA"
        
        # 1. Normalize dates to DD-MM-YYYY format
        metadata["start_date"] = self._normalize_date(str(metadata.get("start_date", "NA")))
        metadata["end_date"] = self._normalize_date(str(metadata.get("end_date", "NA")))
        
        # 2. Convert currency to USD if needed
        local_value = metadata.get("contract_value_local", "NA")
        currency = metadata.get("currency", "NA")
        
        # If LLM didn't provide USD conversion or provided "NA", calculate it ourselves
        if metadata.get("contract_value_usd") in ["NA", "", None]:
            metadata["contract_value_usd"] = self._convert_currency_to_usd(local_value, currency)
        
        # 3. Calculate proper contract status and tag based on dates and business logic
        calculated_status, calculated_tag = self._calculate_contract_status_and_tag(
            metadata["start_date"], 
            metadata["end_date"], 
            metadata
        )
        
        # Override LLM status with calculated status for consistency
        metadata["contract_status"] = calculated_status
        metadata["contract_tag"] = calculated_tag
        
        # 4. Validate contract type
        if metadata.get("contract_type") not in valid_contract_types:
            metadata["contract_type"] = "Other"
        
        # 5. Validate scope of services  
        if metadata.get("scope_of_services") not in valid_scope_types:
            metadata["scope_of_services"] = "Other"
        
        # 6. Clean up empty strings and convert all non-string values to strings
        for key, value in metadata.items():
            if value is None:
                metadata[key] = "NA"
            elif isinstance(value, str) and value.strip() == "":
                metadata[key] = "NA"
            elif not isinstance(value, str):
                # Convert all non-string values (int, float, etc.) to strings
                metadata[key] = str(value)
        
        # 7. Keep legacy contract_value field for backward compatibility
        if "contract_value_local" in metadata and metadata["contract_value_local"] != "NA":
            metadata["contract_value"] = metadata["contract_value_local"]
        else:
            metadata["contract_value"] = "NA"
        
        # 8. Add contract_name if not provided (use filename or vendor name as fallback)
        if metadata.get("contract_name", "NA") == "NA":
            vendor_name = metadata.get("vendor_name", "NA")
            if vendor_name != "NA":
                metadata["contract_name"] = f"Contract with {vendor_name}"
            else:
                metadata["contract_name"] = "NA"
        
        logger.info(f"Processed metadata - Status: {metadata['contract_status']}, Tag: {metadata['contract_tag']}, "
                   f"Start: {metadata['start_date']}, End: {metadata['end_date']}, "
                   f"Local Value: {metadata['contract_value_local']}, USD Value: {metadata['contract_value_usd']}")
        
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
            "contract_value": "NA",  
            "auto_renewal": "NA",
            "payment_terms": "NA",
            "liability_cap": "NA",
            "termination_for_convenience": "NA",
            "price_escalation": "NA"
        }
    
metadata_extraction_service = MetadataExtractionService()
