#!/usr/bin/env python3
"""
Database Migration Script
Adds commercial terms and risk scoring columns to file_metadata table
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import async_engine
from sqlalchemy import text

async def run_commercial_migration():
    """Run the commercial terms and risk scoring migration"""
    print("Starting commercial terms and risk scoring migration...")
    
    try:
        async with async_engine.begin() as conn:
            # Define all new columns to add
            columns_to_add = [
                # Commercial terms
                ('auto_renewal', 'VARCHAR'),
                ('payment_terms', 'VARCHAR'),
                ('liability_cap', 'VARCHAR'),
                ('termination_for_convenience', 'VARCHAR'),
                ('price_escalation', 'VARCHAR'),
                # Risk scoring
                ('auto_renewal_risk_score', 'INTEGER'),
                ('payment_terms_risk_score', 'INTEGER'),
                ('liability_cap_risk_score', 'INTEGER'),
                ('termination_risk_score', 'INTEGER'),
                ('price_escalation_risk_score', 'INTEGER'),
                ('total_risk_score', 'FLOAT'),
                ('risk_band', 'VARCHAR'),
                ('risk_color', 'VARCHAR')
            ]
            
            # Check which columns already exist
            column_names = [col[0] for col in columns_to_add]
            placeholders = ', '.join([f"'{name}'" for name in column_names])
            
            result = await conn.execute(text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'file_metadata' 
                AND column_name IN ({placeholders})
            """))
            
            existing_columns = [row[0] for row in result.fetchall()]
            
            # Add missing columns
            for column_name, column_type in columns_to_add:
                if column_name not in existing_columns:
                    print(f"Adding {column_name} column...")
                    await conn.execute(text(f"""
                        ALTER TABLE file_metadata 
                        ADD COLUMN {column_name} {column_type}
                    """))
                    print(f"✓ Added {column_name} column")
                else:
                    print(f"✓ {column_name} column already exists")
        
        print("Commercial terms and risk scoring migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(run_commercial_migration())
