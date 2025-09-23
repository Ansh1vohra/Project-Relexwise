UPLOAD_DIR = "./uploaded_pdfs"
PROMPT ="""
You are analyzing multiple PDF documents that may contain contract information.  
Read all documents carefully and extract contract details in a list of json format.  

For each file, provide the results in the following format:
{
    file_name: <file_name.pdf>  (use the file name from meta data)
    contract_information:  
    contract_id/contract_ref: <value or "Not found">
    vendor_name: <value or "Not found">  
    type_of_contract: <value or "Not found">  
    start_date: <value (format should be Month, Day, Year) or "Not found">  
    end_date: <value (format should be Month, Day, Year) or "Not found">  
}

If no contracts are found in a file, output exactly:  
"No contracts found in <file_name.pdf>"

Guidelines:  
- Use only the information explicitly present in the document.  
- If a detail is missing, write "Not found".  
- Keep results grouped by file_name.  
- Do not merge information from different files.  
- Ensure clarity and completeness.  
"""