#!/usr/bin/env python3
"""
Test script to validate filename sanitization for Cloudinary public_id
"""
import re

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for use as Cloudinary public_id
    """
    # Remove extension
    name_without_ext = filename.rsplit('.', 1)[0]
    
    # Replace spaces with underscores
    sanitized = name_without_ext.replace(' ', '_')
    
    # Remove special characters, keep only alphanumeric, underscores, and hyphens
    sanitized = re.sub(r'[^a-zA-Z0-9_-]', '', sanitized)
    
    # Convert to lowercase
    sanitized = sanitized.lower()
    
    # Remove multiple consecutive underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    
    # Remove leading/trailing underscores
    sanitized = sanitized.strip('_')
    
    # Limit length to 100 characters
    if len(sanitized) > 100:
        sanitized = sanitized[:100]
    
    # Ensure it's not empty
    if not sanitized:
        sanitized = "document"
        
    return sanitized

# Test cases
test_files = [
    "SAP_General T&Cs for Cloud Services.pdf",
    "Contract with Spaces & Special!@#$%^&*()Characters.pdf",
    "Simple_Contract.pdf",
    "Contract-With-Hyphens.pdf",
    "UPPERCASE_CONTRACT.PDF",
    "contract_with___multiple___underscores.pdf",
    "___leading_and_trailing___.pdf",
    "a" * 150 + ".pdf",  # Very long filename
    ".pdf",  # Just extension
    "contract.with.multiple.dots.pdf"
]

print("Testing filename sanitization:")
print("-" * 60)

for filename in test_files:
    sanitized = sanitize_filename(filename)
    print(f"Original:  {filename}")
    print(f"Sanitized: {sanitized}")
    print(f"Length:    {len(sanitized)}")
    print("-" * 60)
