import google.generativeai as genai
from app.config import settings
import logging
from typing import Dict, Any
import json
import re
import asyncio
from datetime import datetime
import requests
import os
from llama_cloud_services.beta.classifier.client import ClassifyClient
from llama_cloud.client import AsyncLlamaCloud
from llama_cloud.types import ClassifierRule
from app.config import settings

logger = logging.getLogger(__name__)

# Configure Google Generative AI
genai.configure(api_key=settings.google_api_key)

# Configure LlamaCloud for risk classification
LLAMA_CLOUD_API_KEY = settings.llama_cloud_api_key
LLAMA_PROJECT_ID = settings.llama_cloud_project_id
LLAMA_ORGANIZATION_ID = settings.llama_organizatoin_id

llama_client = AsyncLlamaCloud(token=LLAMA_CLOUD_API_KEY, timeout=120)
classifier = ClassifyClient(
    llama_client,
    project_id=LLAMA_PROJECT_ID,
    organization_id=LLAMA_ORGANIZATION_ID
)

class MetadataExtractionService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.extraction_prompt = self._build_extraction_prompt()
        self.risk_rules = self._build_risk_rules()
        self.risk_weights = {
            "auto_renewal_risk_score": 0.20,
            "payment_terms_risk_score": 0.25,
            "liability_cap_risk_score": 0.30,
            "termination_convenience_risk_score": 0.15,
            "price_escalation_risk_score": 0.10,
        }
    
    def _build_risk_rules(self) -> Dict[str, list]:
        """
        Build classification rules for LlamaClassify risk scoring
        """
        return {
            "auto_renewal": [
                ClassifierRule(
                    type="2",
                    description=(
                        "High risk: Contract renews automatically with no or very short (<30 days) notice period. "
                        "Phrases include 'renews automatically', 'auto-renews', 'roll-over', 'successive term without notice'."
                    ),
                ),
                ClassifierRule(
                    type="1",
                    description=(
                        "Medium risk: Auto-renewal allowed but with moderate notice (30–90 days) or termination conditions. "
                        "Common phrasing: 'renews automatically unless notice given 60 days prior'."
                    ),
                ),
                ClassifierRule(
                    type="0",
                    description=(
                        "Low risk: No automatic renewal; renewal occurs only upon written mutual agreement or manual extension. "
                        "Keywords: 'may be renewed by mutual agreement', 'no automatic renewal'."
                    ),
                ),
            ],
            "payment_terms": [
                ClassifierRule(type="2", description="High Risk: Upfront payment or <15 days."),
                ClassifierRule(type="1", description="Medium Risk: Net 30."),
                ClassifierRule(type="0", description="Low Risk: Net 45/60/90 or milestone-based."),
            ],
            "liability_cap": [
                ClassifierRule(type="2", description="High Risk: No cap or ≤6 months fees."),
                ClassifierRule(type="1", description="Medium Risk: Cap ≈ 12 months fees."),
                ClassifierRule(type="0", description="Low Risk: Cap generous or balanced."),
            ],
            "termination_for_convenience": [
                ClassifierRule(type="2", description="High Risk: No termination without cause."),
                ClassifierRule(type="1", description="Medium Risk: Termination allowed with ≥180 days notice."),
                ClassifierRule(type="0", description="Low Risk: Termination allowed with 30–90 days notice."),
            ],
            "price_escalation": [
                ClassifierRule(type="2", description="High Risk: Auto >5% or vendor discretion."),
                ClassifierRule(type="1", description="Medium Risk: CPI-linked or ≤5%."),
                ClassifierRule(type="0", description="Low Risk: No escalation or mutual agreement."),
            ],
        }
    
    def _normalize_date(self, date_string: str) -> str:
        """
        Normalize date string to DD-MM-YYYY format
        """
        if not date_string or date_string.strip().lower() in ['na', '', 'n/a']:
            return "NA"
        
        date_string = date_string.strip()
        
        date_patterns = [
            "%Y-%m-%d", "%d-%m-%Y", "%m-%d-%Y", "%d/%m/%Y",
            "%m/%d/%Y", "%Y/%m/%d", "%d.%m.%Y", "%Y.%m.%d",
            "%B %d, %Y", "%b %d, %Y", "%d %B %Y", "%d %b %Y",
        ]
        
        for pattern in date_patterns:
            try:
                parsed_date = datetime.strptime(date_string, pattern)
                return parsed_date.strftime("%d-%m-%Y")
            except ValueError:
                continue
        
        cleaned_date = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', date_string)
        
        for pattern in date_patterns:
            try:
                parsed_date = datetime.strptime(cleaned_date, pattern)
                return parsed_date.strftime("%d-%m-%Y")
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date format: {date_string}")
        return date_string
    
    def _convert_currency_to_usd(self, amount_str: str, currency: str) -> str:
        """
        Convert local currency amount to USD
        """
        if not amount_str or amount_str.strip().lower() in ['na', '', 'n/a']:
            return "NA"
        
        if not currency or currency.strip().lower() in ['na', '', 'n/a']:
            return "NA"
        
        cleaned_amount = re.sub(r'[^\d.,]', '', amount_str.strip())
        
        if ',' in cleaned_amount and '.' in cleaned_amount:
            cleaned_amount = cleaned_amount.replace(',', '')
        elif ',' in cleaned_amount:
            parts = cleaned_amount.split(',')
            if len(parts) == 2 and len(parts[1]) <= 3:
                cleaned_amount = cleaned_amount.replace(',', '')
            else:
                cleaned_amount = cleaned_amount.replace(',', '.')
        
        try:
            amount = float(cleaned_amount)
        except ValueError:
            logger.warning(f"Could not parse amount: {amount_str}")
            return "NA"
        
        if currency.upper() in ['USD', 'US$', '$']:
            return f"{amount:.2f}"
        
        exchange_rates = {
            'EUR': 1.08, 'GBP': 1.26, 'INR': 0.012, 'JPY': 0.0067,
            'CAD': 0.74, 'AUD': 0.66, 'CHF': 1.10, 'CNY': 0.14, 'SGD': 0.74,
        }
        
        rate = exchange_rates.get(currency.upper())
        if rate:
            usd_amount = amount * rate
            return f"{usd_amount:.2f}"
        
        try:
            response = requests.get(
                f"https://api.exchangerate-api.com/v4/latest/{currency.upper()}",
                timeout=5
            )
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
        
        vendor_name = metadata.get('vendor_name', 'NA').strip()
        if vendor_name in ['NA', '', 'n/a'] or len(vendor_name) < 3:
            return "Draft", "NA"
        
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
            return "Draft", "NA"
        
        if start_dt is None and end_dt is None:
            status = "Draft"
        elif start_dt is None:
            status = "Draft"
        elif end_dt is None:
            status = "Active"
        elif end_dt < current_date:
            status = "Expired"
        elif start_dt <= current_date <= end_dt:
            status = "Active"
        else:
            status = "Draft"
        
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
        Build the prompt for metadata extraction (without risk scoring)
        """
        return """
You are an expert Contract Manager and Legal Analyst. Extract only the precise, objective details requested. If information is missing or ambiguous, return "NA".

From the following contract text, extract the following details in structured format.
Each field must return a precise value or "NA" if not available.

Fields to Extract:

VendorName - Legal name of the counterparty/vendor.

StartDate - Effective date or commencement date. Format as "DD-MM-YYYY" (e.g., 31-12-2024).

EndDate - Expiry date or contract end date. Format as "DD-MM-YYYY" (e.g., 31-12-2025). If end date is not provided and we have contract duration, then autocalculate End Date using Contract Duration.

Contract Duration - Contract Term, Active Term of the contract. If not provided, autocalculate using Start Date and End Date as End Date minus Start Date in Years up to one decimal point.

ContractValue (Local) - Total contract value (with number only) in the given currency.

Currency - Currency of the contract value (USD, INR, EUR, etc.).

Contract Value (USD) - Convert the Contract Value to US Dollars using current exchange rates. Provide numeric value only (e.g., 50000.00).

ContractStatus - Classify as one of: "Active", "Draft", "Expired".

ContractType - Classify as one of: "MSA", "SOW", "Amendment", "Agreement", "Order Form", "Change Request", "Other".

ScopeOfServices - Classify as one of: "Managed Services", "Time & Material", "Hardware", "Software", "Maintenance", "Other".

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
    
    async def extract_metadata(self, contract_text: str, file_id: str, file_path: str = None) -> Dict:
        """
        Extract metadata from contract text using Google's Gemini model and risk scores using LlamaClassify
        """
        try:
            logger.info(f"Starting metadata extraction for file {file_id}")
            
            # Prepare the full prompt
            full_prompt = self.extraction_prompt + contract_text[:10000]
            
            # Generate response from Gemini (metadata only)
            response = await self._generate_with_retry(full_prompt)
            
            # Parse the JSON response
            metadata = self._parse_response(response.text)
            
            # Validate and clean the metadata
            cleaned_metadata = self._validate_and_clean_metadata(metadata)
            
            # Calculate risk scores using LlamaClassify
            if file_path and os.path.exists(file_path):
                risk_scores = await self._calculate_risk_scores_with_llamaclassify(file_path)
                cleaned_metadata.update(risk_scores)
            else:
                # Fallback if no file path provided
                logger.warning(f"No file path provided for risk scoring, using default NA values")
                cleaned_metadata.update(self._get_default_risk_scores())
            
            logger.info(f"Successfully extracted metadata for file {file_id}")
            return cleaned_metadata
            
        except Exception as e:
            logger.error(f"Error extracting metadata for file {file_id}: {str(e)}")
            raise Exception(f"Failed to extract metadata: {str(e)}")
    
    async def _calculate_risk_scores_with_llamaclassify(self, file_path: str) -> Dict[str, Any]:
        """
        Calculate risk scores for each commercial clause using LlamaClassify
        """
        try:
            logger.info(f"Starting LlamaClassify risk scoring for file: {file_path}")
            
            risk_scores = {
                "auto_renewal_risk_score": 0,
                "payment_terms_risk_score": 0,
                "liability_cap_risk_score": 0,
                "termination_convenience_risk_score": 0,
                "price_escalation_risk_score": 0,
                "overall_risk_score": 0.0,
            }
            
            clause_mapping = {
                "auto_renewal": "auto_renewal_risk_score",
                "payment_terms": "payment_terms_risk_score",
                "liability_cap": "liability_cap_risk_score",
                "termination_for_convenience": "termination_convenience_risk_score",
                "price_escalation": "price_escalation_risk_score",
            }
            
            # Classify each clause
            for clause_name, score_key in clause_mapping.items():
                try:
                    clause_rules = self.risk_rules.get(clause_name, [])
                    
                    logger.info(f"Classifying clause: {clause_name}")
                    result = await classifier.aclassify_file_path(
                        rules=clause_rules,
                        file_input_path=file_path
                    )
                    
                    if result and result.items:
                        classification = result.items[0].result
                        if classification and classification.type:
                            # Convert string type to integer (0, 1, or 2)
                            risk_score = int(classification.type)
                            risk_scores[score_key] = risk_score
                            logger.info(f"{clause_name}: Risk Score = {risk_score} (Reasoning: {classification.reasoning})")
                        else:
                            logger.warning(f"No classification result for {clause_name}")
                            risk_scores[score_key] = 1  # Default to medium risk
                    else:
                        logger.warning(f"Classification returned empty result for {clause_name}")
                        risk_scores[score_key] = 1  # Default to medium risk
                        
                except Exception as e:
                    logger.error(f"Error classifying {clause_name}: {str(e)}")
                    risk_scores[score_key] = 1  # Default to medium risk
            
            # Calculate overall risk score (weighted average)
            overall_score = (
                risk_scores["auto_renewal_risk_score"] * self.risk_weights["auto_renewal_risk_score"] +
                risk_scores["payment_terms_risk_score"] * self.risk_weights["payment_terms_risk_score"] +
                risk_scores["liability_cap_risk_score"] * self.risk_weights["liability_cap_risk_score"] +
                risk_scores["termination_convenience_risk_score"] * self.risk_weights["termination_convenience_risk_score"] +
                risk_scores["price_escalation_risk_score"] * self.risk_weights["price_escalation_risk_score"]
            )
            
            risk_scores["overall_risk_score"] = round(overall_score * 5, 2)
            
            logger.info(f"Risk scores calculated - Overall: {risk_scores['overall_risk_score']}")
            return risk_scores
            
        except Exception as e:
            logger.error(f"Error in LlamaClassify risk scoring: {str(e)}")
            return self._get_default_risk_scores()
    
    def _get_default_risk_scores(self) -> Dict[str, Any]:
        """
        Return default risk scores when classification fails
        """
        return {
            "auto_renewal_risk_score": 1,
            "payment_terms_risk_score": 1,
            "liability_cap_risk_score": 1,
            "termination_convenience_risk_score": 1,
            "price_escalation_risk_score": 1,
            "overall_risk_score": 1.0,
        }
    
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
                await asyncio.sleep(2 ** attempt)
    
    def _parse_response(self, response_text: str) -> Dict:
        """
        Parse the JSON response from the LLM
        """
        try:
            cleaned_text = response_text.strip()
            
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            
            cleaned_text = cleaned_text.strip()
            
            metadata = json.loads(cleaned_text)
            return metadata
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {response_text}")
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass
            
            return self._get_default_metadata()
    
    def _validate_and_clean_metadata(self, metadata: Dict) -> Dict:
        """
        Validate and clean the extracted metadata with date normalization and currency conversion
        """
        valid_contract_types = ["MSA", "SOW", "Amendment", "Agreement", "Order Form", "Change Request", "Other"]
        valid_scope_types = ["Managed Services", "Time & Material", "Hardware", "Software", "Maintenance", "Other"]
        valid_contract_status = ["Active", "Draft", "Expired"]
        valid_contract_tags = ["Expiry < 30 days", "Expiry 30 to 90 days", "Expiry > 90 days", "NA"]
        
        required_fields = [
            "contract_name", "start_date", "end_date", "vendor_name", "contract_duration",
            "contract_value_local", "currency", "contract_value_usd",
            "contract_status", "contract_type", "scope_of_services", "contract_tag",
            "auto_renewal", "payment_terms", "liability_cap", "termination_for_convenience", "price_escalation"
        ]
        for field in required_fields:
            if field not in metadata or metadata[field] is None:
                metadata[field] = "NA"
        
        # Normalize dates
        metadata["start_date"] = self._normalize_date(str(metadata.get("start_date", "NA")))
        metadata["end_date"] = self._normalize_date(str(metadata.get("end_date", "NA")))
        
        # Convert currency to USD
        local_value = metadata.get("contract_value_local", "NA")
        currency = metadata.get("currency", "NA")
        
        if metadata.get("contract_value_usd") in ["NA", "", None]:
            metadata["contract_value_usd"] = self._convert_currency_to_usd(local_value, currency)
        
        # Calculate proper contract status and tag
        calculated_status, calculated_tag = self._calculate_contract_status_and_tag(
            metadata["start_date"], 
            metadata["end_date"], 
            metadata
        )
        
        metadata["contract_status"] = calculated_status
        metadata["contract_tag"] = calculated_tag
        
        # Validate contract type and scope
        if metadata.get("contract_type") not in valid_contract_types:
            metadata["contract_type"] = "Other"
        
        if metadata.get("scope_of_services") not in valid_scope_types:
            metadata["scope_of_services"] = "Other"
        
        # Clean up empty strings
        for key, value in metadata.items():
            if value is None:
                metadata[key] = "NA"
            elif isinstance(value, str) and value.strip() == "":
                metadata[key] = "NA"
            elif not isinstance(value, str):
                metadata[key] = str(value)
        
        # Legacy compatibility
        if "contract_value_local" in metadata and metadata["contract_value_local"] != "NA":
            metadata["contract_value"] = metadata["contract_value_local"]
        else:
            metadata["contract_value"] = "NA"
        
        # Add contract_name fallback
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