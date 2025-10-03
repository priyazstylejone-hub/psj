import json
import os
import sys
import logging
import time
from datetime import datetime
import pandas as pd
import hashlib
from google.oauth2 import service_account
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
SHEET_ID = '169un6lQfsUfJCo6K394BAOjYawKX9V6p2Md4xQDmJ0A'
SHEET_RANGE = 'Sheet1!A1:P1000'  # Updated range for new columns
CREDENTIALS_FILE = 'credentials.json'
OUTPUT_JSON = 'products.json'
BACKUP_DIR = 'backups'

# Sheet structure configuration
REQUIRED_COLUMNS = {
    'id': 0,          # Column A: Unique product ID
    'name': 1,        # Column B: Product name
    'actualPrice': 2, # Column C: Original price in ₹
    'salePrice': 3,   # Column D: Sale price in ₹
    'description': 4, # Column E: Product description
    'inStock': 5,     # Column F: TRUE/FALSE
    'category': 6,    # Column G: Product category
    'mainImage': 7    # Column H: Main product image URL
}

OPTIONAL_COLUMNS = {
    'images': 8,      # Column I: Comma-separated additional image URLs
    'sku': 9,         # Column J: Stock keeping unit
    'tags': 10,       # Column K: Comma-separated tags
    'brand': 11,      # Column L: Brand name
    'colors': 12,     # Column M: JSON array of {name, hex, image} objects
    'sizes': 13,      # Column N: JSON array of {size, measurements} objects
    'material': 14,   # Column O: Material information
    'careInstructions': 15 # Column P: Care instructions
}

# Standard size measurements
SIZE_MEASUREMENTS = {
    'S': {
        'chest': '36-38',
        'waist': '28-30',
        'hips': '35-37',
        'length': '26-27'
    },
    'M': {
        'chest': '38-40',
        'waist': '30-32',
        'hips': '37-39',
        'length': '27-28'
    },
    'L': {
        'chest': '40-42',
        'waist': '32-34',
        'hips': '39-41',
        'length': '28-29'
    },
    'XL': {
        'chest': '42-44',
        'waist': '34-36',
        'hips': '41-43',
        'length': '29-30'
    },
    'XXL': {
        'chest': '44-46',
        'waist': '36-38',
        'hips': '43-45',
        'length': '30-31'
    }
}

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

def process_images(images_value):
    """Process image URLs from the sheet"""
    if not images_value:
        return []
    
    try:
        # Handle comma-separated URLs
        if isinstance(images_value, str):
            return [url.strip() for url in images_value.split(',') if url.strip()]
        return []
    except Exception:
        return []

def process_price(price_value):
    """Convert price string to float"""
    try:
        if isinstance(price_value, (int, float)):
            return float(price_value)
        elif isinstance(price_value, str):
            # Remove currency symbols, commas, and spaces
            clean_price = price_value.replace('₹', '').replace(',', '').replace(' ', '')
            return float(clean_price) if clean_price else 0.0
        return 0.0
    except (ValueError, TypeError):
        return 0.0

def fetch_and_update():
    """Fetch data from Google Sheets and update products.json"""
    try:
        # Validate credentials first
        if not validate_credentials():
            return False

        # Create backup of current file
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

        # Process header and data
        headers = rows[0]
        data = rows[1:]  # Skip header row
        
        # Process products
        products = []
        for idx, row in enumerate(data):
            try:
                # Skip empty rows
                if len(row) < 2 or not row[1].strip():  # Check name column
                    continue

                # Pad row if needed
                row = row + [''] * (len(headers) - len(row))
                
                # Process prices
                actual_price = process_price(row[REQUIRED_COLUMNS['actualPrice']])
                sale_price = process_price(row[REQUIRED_COLUMNS['salePrice']])
                
                # Validate prices
                if actual_price <= 0:
                    logging.warning(f"Invalid actual price for row {idx + 2}")
                    continue
                    
                # Ensure sale price doesn't exceed actual price
                if sale_price > actual_price:
                    logging.warning(f"Sale price (₹{sale_price}) higher than actual price (₹{actual_price}) for row {idx + 2}. Using actual price.")
                    sale_price = actual_price
                elif sale_price <= 0:
                    sale_price = actual_price

                # Create product object
                product = {
                    "id": int(row[REQUIRED_COLUMNS['id']]) if row[REQUIRED_COLUMNS['id']].strip() else idx + 1,
                    "name": row[REQUIRED_COLUMNS['name']].strip(),
                    "actualPrice": actual_price,
                    "salePrice": sale_price,
                    "onSale": actual_price > sale_price,
                    "description": row[REQUIRED_COLUMNS['description']].strip(),
                    "inStock": True if len(row) <= REQUIRED_COLUMNS['inStock'] or not row[REQUIRED_COLUMNS['inStock']].strip() 
                              else row[REQUIRED_COLUMNS['inStock']].upper() in ['TRUE', '1', 'YES'],
                    "images": process_images(row[OPTIONAL_COLUMNS['images']] if len(row) > OPTIONAL_COLUMNS['images'] else '')
                }

                # Add optional fields if present
                tags = []
                
                # Process SKU if present
                if len(row) > OPTIONAL_COLUMNS['sku'] and row[OPTIONAL_COLUMNS['sku']].strip():
                    sku = row[OPTIONAL_COLUMNS['sku']].strip()
                    if sku.upper() != 'TRUE':  # Don't add TRUE as SKU
                        product['sku'] = sku
                        
                # Process brand if present and add to tags
                if len(row) > OPTIONAL_COLUMNS['brand'] and row[OPTIONAL_COLUMNS['brand']].strip():
                    brand = row[OPTIONAL_COLUMNS['brand']].strip()
                    if ',' in brand:
                        # If brand contains commas, treat as tags
                        tags.extend([tag.strip() for tag in brand.split(',') if tag.strip()])
                    else:
                        product['brand'] = brand
                        tags.append(brand)
                
                # Process additional tags
                if len(row) > OPTIONAL_COLUMNS['tags'] and row[OPTIONAL_COLUMNS['tags']].strip():
                    tags.extend([tag.strip() for tag in row[OPTIONAL_COLUMNS['tags']].split(',') if tag.strip()])
                
                # Process colors if present
                if len(row) > OPTIONAL_COLUMNS['colors'] and row[OPTIONAL_COLUMNS['colors']].strip():
                    try:
                        colors_data = row[OPTIONAL_COLUMNS['colors']].strip()
                        # Try parsing as JSON first
                        try:
                            colors = json.loads(colors_data)
                            if isinstance(colors, list):
                                product['colors'] = colors
                            else:
                                # If not a list, try parsing as comma-separated "name:hex" pairs
                                colors = []
                                for color_pair in colors_data.split(','):
                                    if ':' in color_pair:
                                        name, hex_code = color_pair.split(':')
                                        colors.append({
                                            'name': name.strip(),
                                            'hex': hex_code.strip().lstrip('#')
                                        })
                                if colors:
                                    product['colors'] = colors
                        except json.JSONDecodeError:
                            # Handle as comma-separated "name:hex" pairs
                            colors = []
                            for color_pair in colors_data.split(','):
                                if ':' in color_pair:
                                    name, hex_code = color_pair.split(':')
                                    colors.append({
                                        'name': name.strip(),
                                        'hex': hex_code.strip().lstrip('#')
                                    })
                            if colors:
                                product['colors'] = colors
                    except Exception as e:
                        logging.warning(f"Error processing colors for row {idx + 2}: {str(e)}")
                
                # Process sizes if present
                if len(row) > OPTIONAL_COLUMNS['sizes'] and row[OPTIONAL_COLUMNS['sizes']].strip():
                    try:
                        sizes_data = row[OPTIONAL_COLUMNS['sizes']].strip()
                        sizes = []
                        
                        # Try parsing as JSON first
                        try:
                            custom_sizes = json.loads(sizes_data)
                            if isinstance(custom_sizes, list):
                                # Use custom measurements if provided in correct format
                                sizes = custom_sizes
                            else:
                                # Fall back to standard measurements
                                for size in sizes_data.split(','):
                                    size = size.strip().upper()
                                    if size in SIZE_MEASUREMENTS:
                                        sizes.append({
                                            'size': size,
                                            'measurements': SIZE_MEASUREMENTS[size]
                                        })
                        except json.JSONDecodeError:
                            # Handle as comma-separated size names
                            for size in sizes_data.split(','):
                                size = size.strip().upper()
                                if size in SIZE_MEASUREMENTS:
                                    sizes.append({
                                        'size': size,
                                        'measurements': SIZE_MEASUREMENTS[size]
                                    })
                        
                        if sizes:
                            product['sizes'] = sizes
                    except Exception as e:
                        logging.warning(f"Error processing sizes for row {idx + 2}: {str(e)}")

                # If sizes weren't provided, populate default standard sizes
                if 'sizes' not in product or not product.get('sizes'):
                    product['sizes'] = [{
                        'size': k,
                        'measurements': v
                    } for k, v in SIZE_MEASUREMENTS.items()]
                
                # Add unique tags to product
                if tags:
                    product['tags'] = list(set(tags))

                products.append(product)
                
            except Exception as e:
                logging.warning(f"Error processing row {idx + 2}: {str(e)}")
                continue

        # Write to products.json
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)

        logging.info(f"Successfully synced {len(products)} products")
        
        # Log category summary
        categories = {}
        for p in products:
            cat = p.get('category', 'Uncategorized')
            categories[cat] = categories.get(cat, 0) + 1
        logging.info("Category summary:")
        for cat, count in categories.items():
            logging.info(f"  - {cat}: {count} products")
            
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
