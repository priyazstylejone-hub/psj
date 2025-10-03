import json
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

def test_credentials():
    """Test Google Sheets credentials and access"""
    CREDENTIALS_FILE = 'credentials.json'
    SHEET_ID = '169un6lQfsUfJCo6K394BAOjYawKX9V6p2Md4xQDmJ0A'
    
    try:
        print("1. Testing if credentials file exists...")
        with open(CREDENTIALS_FILE, 'r') as f:
            creds_content = json.load(f)
            
        required_fields = ['client_email', 'private_key', 'project_id']
        for field in required_fields:
            if field not in creds_content:
                print(f"❌ ERROR: Missing required field '{field}' in credentials.json")
                return False
        print("✅ Credentials file exists and has required fields")
        
        print("\n2. Testing Google Sheets API authentication...")
        creds = service_account.Credentials.from_service_account_file(
            CREDENTIALS_FILE,
            scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
        )
        service = build('sheets', 'v4', credentials=creds)
        print("✅ Successfully authenticated with Google Sheets API")
        
        print("\n3. Testing access to spreadsheet...")
        sheet = service.spreadsheets()
        result = sheet.get(spreadsheetId=SHEET_ID).execute()
        print(f"✅ Successfully accessed spreadsheet: {result.get('properties', {}).get('title')}")
        
        print("\n4. Testing reading spreadsheet data...")
        result = sheet.values().get(spreadsheetId=SHEET_ID, range='Sheet1').execute()
        rows = result.get('values', [])
        if not rows:
            print("❌ WARNING: Spreadsheet is empty")
        else:
            print(f"✅ Successfully read {len(rows)} rows from spreadsheet")
            print(f"   First row contains {len(rows[0])} columns: {', '.join(rows[0])}")
        
        return True
        
    except FileNotFoundError:
        print("❌ ERROR: credentials.json file not found!")
        return False
    except json.JSONDecodeError:
        print("❌ ERROR: credentials.json is not valid JSON!")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔑 Google Sheets Credentials Test")
    print("================================")
    if test_credentials():
        print("\n✨ All tests passed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")
        sys.exit(1)