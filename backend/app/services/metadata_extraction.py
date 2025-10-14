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

Commercial Terms - Extract the following 5 key commercial clauses:

1. autoRenewal - Look for explicit renewal clauses. Example output: "Auto-renews annually; 60 days' notice". If absent: "NA".

2. paymentTerms - Look for due period keywords: "Net 30", "Net 60", "within 45 days of invoice". Example output: "Net 45". If absent: "NA".

3. liabilityCap - Look for "limitation of liability" clauses. Example output: "12 months of fees", "Capped at $1M". If absent: "NA".

4. terminationForConvenience - Look for termination without cause language. Example output: "90 days' notice". If absent: "NA".

5. priceEscalation - Look for "annual increase", "uplift", "CPI-based escalation". Example output: "5% annual uplift", "CPI + 2%". If absent: "NA".

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
    "price_escalation": "extracted value or NA"
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
            
            # Calculate risk scores
            risk_scores = self._calculate_risk_scores(cleaned_metadata)
            cleaned_metadata.update(risk_scores)
            
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
            "contract_status", "contract_type", "scope_of_services", "contract_tag",
            "auto_renewal", "payment_terms", "liability_cap", "termination_for_convenience", "price_escalation"
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
        
        # Clean up empty strings and convert all non-string values to strings
        for key, value in metadata.items():
            if value is None:
                metadata[key] = "NA"
            elif isinstance(value, str) and value.strip() == "":
                metadata[key] = "NA"
            elif not isinstance(value, str):
                # Convert all non-string values (int, float, etc.) to strings
                metadata[key] = str(value)
                
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
            "contract_value": "NA",  # Legacy field for backward compatibility
            "auto_renewal": "NA",
            "payment_terms": "NA",
            "liability_cap": "NA",
            "termination_for_convenience": "NA",
            "price_escalation": "NA"
        }
    
    def _calculate_risk_scores(self, metadata: Dict) -> Dict:
        """
        Calculate risk scores for commercial terms based on extracted data
        """
        # Extract commercial terms
        auto_renewal = metadata.get("auto_renewal", "NA").lower()
        payment_terms = metadata.get("payment_terms", "NA").lower()
        liability_cap = metadata.get("liability_cap", "NA").lower()
        termination_convenience = metadata.get("termination_for_convenience", "NA").lower()
        price_escalation = metadata.get("price_escalation", "NA").lower()
        
        # Auto-Renewal Risk Scoring
        auto_renewal_risk = self._score_auto_renewal(auto_renewal)
        
        # Payment Terms Risk Scoring
        payment_terms_risk = self._score_payment_terms(payment_terms)
        
        # Liability Cap Risk Scoring
        liability_cap_risk = self._score_liability_cap(liability_cap)
        
        # Termination for Convenience Risk Scoring
        termination_risk = self._score_termination_convenience(termination_convenience)
        
        # Price Escalation Risk Scoring
        price_escalation_risk = self._score_price_escalation(price_escalation)
        
        # Calculate weighted average
        # Liability Cap = 30%, T4C = 20%, Auto-Renewal = 20%, Price Escalation = 15%, Payment Terms = 15%
        total_weighted_score = (
            liability_cap_risk * 0.30 +
            termination_risk * 0.20 +
            auto_renewal_risk * 0.20 +
            price_escalation_risk * 0.15 +
            payment_terms_risk * 0.15
        )
        
        # Determine risk banding
        if total_weighted_score <= 4:
            risk_band = "High Risk"
            risk_color = "Red"
        elif total_weighted_score <= 7:
            risk_band = "Medium Risk"
            risk_color = "Amber"
        else:
            risk_band = "Low Risk"
            risk_color = "Green"
        
        return {
            # Preserve original commercial terms values
            "auto_renewal": metadata.get("auto_renewal", "NA"),
            "payment_terms": metadata.get("payment_terms", "NA"),
            "liability_cap": metadata.get("liability_cap", "NA"),
            "termination_for_convenience": metadata.get("termination_for_convenience", "NA"),
            "price_escalation": metadata.get("price_escalation", "NA"),
            # Add risk scores
            "auto_renewal_risk_score": auto_renewal_risk,
            "payment_terms_risk_score": payment_terms_risk,
            "liability_cap_risk_score": liability_cap_risk,
            "termination_risk_score": termination_risk,
            "price_escalation_risk_score": price_escalation_risk,
            "total_risk_score": round(total_weighted_score, 2),
            "risk_band": risk_band,
            "risk_color": risk_color
        }
    
    def _score_auto_renewal(self, auto_renewal: str) -> int:
        """Score auto-renewal clause (0=High Risk, 1=Medium Risk, 2=Low Risk)"""
        if auto_renewal == "na" or "no auto" in auto_renewal or "manual" in auto_renewal:
            return 2  # Manual renewal only (favorable)
        elif "30" in auto_renewal and "90" not in auto_renewal:
            return 1  # 30-90 days notice
        elif any(term in auto_renewal for term in ["auto", "renew", "automatic"]):
            if any(days in auto_renewal for days in ["30", "60", "90"]):
                return 1  # Medium risk - some notice period
            else:
                return 0  # High risk - auto renewal with no/short notice
        return 1  # Default medium risk
    
    def _score_payment_terms(self, payment_terms: str) -> int:
        """Score payment terms (0=High Risk, 1=Medium Risk, 2=Low Risk)"""
        if payment_terms == "na":
            return 1  # Default medium risk
        elif any(term in payment_terms for term in ["upfront", "advance", "prepaid"]):
            return 0  # High risk - upfront payment
        elif "net 15" in payment_terms or "15 days" in payment_terms:
            return 0  # High risk - short payment terms
        elif "net 30" in payment_terms or "30 days" in payment_terms:
            return 1  # Medium risk - standard terms
        elif any(term in payment_terms for term in ["net 45", "net 60", "net 90", "45 days", "60 days", "90 days", "milestone"]):
            return 2  # Low risk - client-friendly terms
        return 1  # Default medium risk
    
    def _score_liability_cap(self, liability_cap: str) -> int:
        """Score liability cap (0=High Risk, 1=Medium Risk, 2=Low Risk)"""
        if liability_cap == "na" or "no cap" in liability_cap or "unlimited" in liability_cap:
            return 0  # High risk - no protection
        elif any(term in liability_cap for term in ["3 months", "6 months"]):
            return 0  # High risk - very low cap
        elif "12 months" in liability_cap:
            return 1  # Medium risk - standard cap
        elif any(term in liability_cap for term in ["contract value", "total fees", "unlimited for", "mutual"]):
            return 2  # Low risk - generous cap
        return 1  # Default medium risk
    
    def _score_termination_convenience(self, termination: str) -> int:
        """Score termination for convenience (0=High Risk, 1=Medium Risk, 2=Low Risk)"""
        if termination == "na" or "no termination" in termination or "not allowed" in termination:
            return 0  # High risk - locked in
        elif any(term in termination for term in ["180 days", "6 months", "12 months"]):
            return 1  # Medium risk - long notice
        elif any(term in termination for term in ["30 days", "60 days", "90 days"]):
            return 2  # Low risk - reasonable notice
        return 1  # Default medium risk
    
    def _score_price_escalation(self, escalation: str) -> int:
        """Score price escalation (0=High Risk, 1=Medium Risk, 2=Low Risk)"""
        if escalation == "na" or "no escalation" in escalation or "fixed" in escalation:
            return 2  # Low risk - no escalation
        elif "mutual" in escalation or "by agreement" in escalation:
            return 2  # Low risk - mutual agreement required
        elif "cpi" in escalation or any(pct in escalation for pct in ["3%", "4%", "5%"]):
            return 1  # Medium risk - reasonable escalation
        elif any(pct in escalation for pct in ["6%", "7%", "8%", "9%", "10%"]) or "discretion" in escalation:
            return 0  # High risk - high escalation or vendor discretion
        return 1  # Default medium risk

metadata_extraction_service = MetadataExtractionService()
