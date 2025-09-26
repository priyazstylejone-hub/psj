import json
import os
import pandas as pd
from google.oauth2 import service_account
from googleapiclient.discovery import build

# CONFIGURATION
SHEET_ID = '169un6lQfsUfJCo6K394BAOjYawKX9V6p2Md4xQDmJ0A'  # <-- Replace with your Google Sheet ID
SHEET_RANGE = 'Sheet1'           # <-- Update if your sheet/tab name is different
CREDENTIALS_FILE = 'credentials.json'
OUTPUT_JSON = 'products.json'

# Authenticate and build service
creds = service_account.Credentials.from_service_account_file(
    CREDENTIALS_FILE,
    scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
)
service = build('sheets', 'v4', credentials=creds)
sheet = service.spreadsheets()

# Fetch data from Google Sheets
result = sheet.values().get(spreadsheetId=SHEET_ID, range=SHEET_RANGE).execute()
rows = result.get('values', [])

if not rows:
    print('No data found in the sheet.')
    exit(1)

# Convert to DataFrame
headers = rows[0]
data = rows[1:]
df = pd.DataFrame(data, columns=headers)

# Remove bulkPricing and taxRate columns if present
for col in ['pricing.bulkPricing', 'pricing.taxRate']:
    if col in df.columns:
        df = df.drop(columns=[col])

# Convert DataFrame to list of dicts
products = df.to_dict(orient='records')

# Write to products.json
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"Updated {OUTPUT_JSON} from Google Sheets!")
