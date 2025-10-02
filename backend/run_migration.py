#!/usr/bin/env python3
"""
Database Migration Script
Adds contract_name and contract_tag columns to file_metadata table
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import async_engine
from sqlalchemy import text

async def run_migration():
    """Run the database migration"""
    print("Starting database migration...")
    
    try:
        async with async_engine.begin() as conn:
            # Check if columns already exist
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'file_metadata' 
                AND column_name IN ('contract_name', 'contract_tag')
            """))
            
            existing_columns = [row[0] for row in result.fetchall()]
            
            # Add contract_name column if it doesn't exist
            if 'contract_name' not in existing_columns:
                print("Adding contract_name column...")
                await conn.execute(text("""
                    ALTER TABLE file_metadata 
                    ADD COLUMN contract_name VARCHAR
                """))
                print("✓ Added contract_name column")
            else:
                print("✓ contract_name column already exists")
            
            # Add contract_tag column if it doesn't exist
            if 'contract_tag' not in existing_columns:
                print("Adding contract_tag column...")
                await conn.execute(text("""
                    ALTER TABLE file_metadata 
                    ADD COLUMN contract_tag VARCHAR
                """))
                print("✓ Added contract_tag column")
            else:
                print("✓ contract_tag column already exists")
        
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(run_migration())
