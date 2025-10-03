import json
import os
import sys
import logging
import time
from datetime import datetime
import pandas as pd
import hashlib
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('google_sheet_sync.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

# CONFIGURATION
SHEET_ID = '169un6lQfsUfJCo6K394BAOjYawKX9V6p2Md4xQDmJ0A'  # <-- Replace with your Google Sheet ID
SHEET_RANGE = 'Sheet1'           # <-- Update if your sheet/tab name is different
CREDENTIALS_FILE = 'credentials.json'
OUTPUT_JSON = 'products.json'
BACKUP_DIR = 'backups'

def create_backup():
    """Create a backup of the current products.json file"""
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
    
    if os.path.exists(OUTPUT_JSON):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f"{BACKUP_DIR}/products_{timestamp}.json"
        try:
            with open(OUTPUT_JSON, 'r', encoding='utf-8') as src:
                with open(backup_file, 'w', encoding='utf-8') as dst:
                    dst.write(src.read())
            logging.info(f"Backup created: {backup_file}")
            return True
        except Exception as e:
            logging.error(f"Failed to create backup: {str(e)}")
            return False
    return True

def validate_credentials():
    """Check if credentials file exists and is valid"""
    if not os.path.exists(CREDENTIALS_FILE):
        logging.error(f"Credentials file '{CREDENTIALS_FILE}' not found!")
        return False
    
    try:
        creds = service_account.Credentials.from_service_account_file(
            CREDENTIALS_FILE,
            scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
        )
        return True
    except Exception as e:
        logging.error(f"Invalid credentials file: {str(e)}")
        return False

def calculate_file_hash(filename):
    """Calculate SHA-256 hash of a file"""
    if not os.path.exists(filename):
        return None
    
    sha256_hash = hashlib.sha256()
    with open(filename, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def has_file_changed(old_hash):
    """Check if products.json has changed"""
    new_hash = calculate_file_hash(OUTPUT_JSON)
    return old_hash != new_hash

def process_price(price_value):
    """Helper function to process price values"""
    try:
        if isinstance(price_value, (int, float)):
            return float(price_value)
        elif isinstance(price_value, str):
            # Remove currency symbols, commas, and spaces
            clean_price = price_value.replace('₹', '').replace(',', '').replace(' ', '')
            # Handle empty or invalid values
            if not clean_price or clean_price == '-':
                return 0.0
            # Try parsing the cleaned price
            return float(clean_price)
        return 0.0
    except (ValueError, TypeError):
        return 0.0

def process_images(images_value):
    """Helper function to process image values"""
    if not images_value:
        return []
    
    try:
        if isinstance(images_value, str):
            # Try parsing as JSON first
            try:
                images_data = json.loads(images_value)
                if isinstance(images_data, dict):
                    images = [images_data.get('primary')] if images_data.get('primary') else []
                    if images_data.get('gallery'):
                        images.extend(images_data['gallery'])
                    return [img for img in images if img]
                elif isinstance(images_data, list):
                    return [img for img in images_data if img]
            except json.JSONDecodeError:
                # If not JSON, treat as comma-separated string
                return [img.strip() for img in images_value.split(',') if img.strip()]
        elif isinstance(images_value, list):
            return [img for img in images_value if img]
    except Exception:
        pass
    return []

def fetch_and_update():
    """Fetch data from Google Sheets and update products.json"""
    initial_hash = calculate_file_hash(OUTPUT_JSON)
    try:
        # Validate credentials and setup
        if not validate_credentials():
            return False
        if not create_backup():
            return False

        # Authenticate and build service
        creds = service_account.Credentials.from_service_account_file(
            CREDENTIALS_FILE,
            scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
        )
        service = build('sheets', 'v4', credentials=creds)
        sheet = service.spreadsheets()

        # Fetch data from Google Sheets
        logging.info(f"Fetching data from sheet ID: {SHEET_ID}")
        result = sheet.values().get(spreadsheetId=SHEET_ID, range=SHEET_RANGE).execute()
        rows = result.get('values', [])

        if not rows:
            logging.error('No data found in the sheet.')
            return False

        # Skip header metadata rows (first 3 rows are headers)
        data_start_row = 3  # 0-based index
        headers = rows[0]  # Keep original headers for column mapping
        data = rows[data_start_row:]  # Skip header metadata
        
        # Create mapping of important columns
        col_map = {}
        for i, header in enumerate(headers):
            header = str(header).strip()
            if header in ['id', 'name', 'description', 'category']:
                col_map[header] = i
            elif header == 'pricing':
                col_map['price_col'] = i
        
        # Get subheader information
        subheaders = rows[1]  # Second row contains price type
        if 'price_col' in col_map:
            price_idx = col_map['price_col']
            if len(subheaders) > price_idx:
                if subheaders[price_idx] == 'originalPrice':
                    col_map['price_type'] = 'original'
                elif subheaders[price_idx] == 'salePrice':
                    col_map['price_type'] = 'sale'
        
        logging.info(f"Found important columns: {col_map}")
        
        # Process data rows
        processed_data = []
        for row_idx, row in enumerate(data):
            try:
                # Skip empty rows
                if not row or not any(str(cell).strip() for cell in row):
                    continue
                
                # Extract data using column mapping
                product_data = {}
                for field, col_idx in col_map.items():
                    if field == 'price_col':
                        # Handle price specially
                        try:
                            price_str = row[col_idx] if len(row) > col_idx else '0'
                            price_str = str(price_str).replace('₹', '').replace(',', '').strip()
                            product_data['price'] = float(price_str) if price_str else 0.0
                        except (ValueError, TypeError):
                            product_data['price'] = 0.0
                    elif field != 'price_type':  # Skip price_type from mapping
                        # Get value, defaulting to empty string if column doesn't exist
                        value = row[col_idx] if len(row) > col_idx else ''
                        product_data[field] = str(value).strip()
                
                # Add to processed data if valid
                if product_data.get('name') and product_data.get('price', 0) > 0:
                    processed_data.append(product_data)
                else:
                    logging.warning(f"Skipping row {row_idx + data_start_row + 1}: Missing name or invalid price")
                    
            except Exception as e:
                logging.warning(f"Error processing row {row_idx + data_start_row + 1}: {str(e)}")
                continue
        
        # Convert to DataFrame
        df = pd.DataFrame(processed_data)
        
        logging.info(f"DataFrame shape: {df.shape}")
        logging.info(f"Available columns: {list(df.columns)}")

        # Process products
        products = []
        categories = {}  # For statistics
        
        for idx, row in df.iterrows():
            try:
                # Skip empty rows
                if pd.isna(row.get('name')) or str(row.get('name')).strip() == '':
                    continue
                
                name = str(row.get('name', '')).strip()
                price = process_price(row.get('pricing') or row.get('price', 0))
                
                # Skip products without required fields
                if not name or price <= 0:
                    logging.warning(f"Skipping row {idx + 1}: Missing name or invalid price")
                    continue
                
                # Build product object
                product = {
                    "id": int(row.get('id', idx + 1)),
                    "name": name,
                    "description": str(row.get('description', '')).strip(),
                    "category": str(row.get('category', 'Uncategorized')).strip(),
                    "price": price,
                    "images": process_images(row.get('images')),
                    "inStock": bool(row.get('inventory', True))
                }
                
                # Update category statistics
                cat = product['category']
                categories[cat] = categories.get(cat, 0) + 1
                
                products.append(product)
                
            except Exception as e:
                logging.warning(f"Error processing row {idx + 1}: {str(e)}")
                continue

        # Write products to file
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)

        # Log results
        if has_file_changed(initial_hash):
            logging.info(f"Successfully updated {OUTPUT_JSON} with {len(products)} products")
            logging.info("Category summary:")
            for cat, count in categories.items():
                logging.info(f"  - {cat}: {count} products")
        else:
            logging.info("No changes detected in the data")
            
        return True
        
        # Clean up the DataFrame
        df = df.loc[:,~df.columns.duplicated()]
        
        # Convert DataFrame to list of products
        products = []
        for idx, row in df.iterrows():
            try:
                product = default_product.copy()
                
                # Set basic fields
                product["id"] = int(row.get('id', idx + 1))
                product["name"] = str(row.get('name', ''))
                product["description"] = str(row.get('description', ''))
                product["category"] = str(row.get('category', {}).get('primary', 'Uncategorized') if isinstance(row.get('category'), dict) else row.get('category', 'Uncategorized'))
                
                # Handle pricing
                try:
                    if isinstance(row.get('pricing'), str) and row.get('pricing').strip():
                        pricing_data = json.loads(row.get('pricing'))
                        if isinstance(pricing_data, dict):
                            sale_price = pricing_data.get('salePrice', 0)
                            original_price = pricing_data.get('originalPrice', 0)
                            product["price"] = float(sale_price if sale_price else original_price) / 100
                    elif isinstance(row.get('price'), (int, float, str)):
                        product["price"] = float(str(row.get('price')).replace(',', ''))
                except (ValueError, json.JSONDecodeError) as e:
                    logging.warning(f"Error parsing price for product {product['id']}: {str(e)}")
                    product["price"] = 0.0
                
                # Handle images
                if isinstance(row.get('images'), str):
                    try:
                        images_data = json.loads(row.get('images'))
                        if isinstance(images_data, dict):
                            product["images"] = [images_data.get('primary')] if images_data.get('primary') else []
                            if images_data.get('gallery'):
                                product["images"].extend(images_data['gallery'])
                        elif isinstance(images_data, list):
                            product["images"] = images_data
                    except json.JSONDecodeError:
                        product["images"] = [row.get('images')] if row.get('images') else []
                elif isinstance(row.get('image'), str):
                    product["images"] = [row.get('image')]
                
                # Only append products with required fields
                if product["name"] and product["price"] is not None:
                    products.append(product)
                else:
                    logging.warning(f"Skipping product {product['id']}: Missing required fields")
                    
            except Exception as e:
                logging.error(f"Error processing row {idx + 1}: {str(e)}")
                continue

        # Write to products.json
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)

        # Check if file actually changed
        if has_file_changed(initial_hash):
            logging.info(f"Successfully updated {OUTPUT_JSON} from Google Sheets!")
            
            # Log detailed stats
            logging.info(f"Total products updated: {len(products)}")
            logging.info(f"Fields per product: {', '.join(headers)}")
            
            # Log categories summary
            categories = {}
            for p in products:
                cat = p.get('category', 'Uncategorized')
                categories[cat] = categories.get(cat, 0) + 1
            logging.info("Category summary:")
            for cat, count in categories.items():
                logging.info(f"  - {cat}: {count} products")
        else:
            logging.info("No changes detected in the data")
        
        return True

    except HttpError as e:
        logging.error(f"Google Sheets API error: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return False

def main():
    """Main function to run the sync"""
    logging.info("Starting Google Sheets sync process...")
    
    if fetch_and_update():
        logging.info("Sync completed successfully!")
        return 0
    else:
        logging.error("Sync failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
