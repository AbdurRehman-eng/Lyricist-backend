import os
import sys
import shutil
import zipfile
import requests

def download_and_extract_index():
    url = os.environ.get("INDEX_ZIP_URL")
    if not url:
        print("INDEX_ZIP_URL environment variable not set.")
        print("Skipping remote index download; utilizing local repository index files.")
        sys.exit(0)

    zip_filename = "lyrica_index.zip"
    print(f"Downloading preprocessed index from: {url}")
    
    try:
        # Stream the download to avoid loading the entire file into memory
        response = requests.get(url, stream=True, verify=False) # verify=False for SSL flexibility
        response.raise_for_status()
        
        # Get total file size if available
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(zip_filename, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"Downloading: {percent:.1f}% ({downloaded / (1024*1024):.1f} MB / {total_size / (1024*1024):.1f} MB)", end="\r")
        print("\nDownload complete.")
        
        # 2. Clear old barrels folder to prevent mixing
        if os.path.exists("barrels"):
            print("Clearing old barrels folder...")
            shutil.rmtree("barrels")
            
        # 3. Extract the downloaded zip
        print("Extracting index files...")
        with zipfile.ZipFile(zip_filename, 'r') as zip_ref:
            zip_ref.extractall(".")
        print("Extraction complete.")
        
        # 4. Clean up the zip file to save space
        if os.path.exists(zip_filename):
            os.remove(zip_filename)
            print("Cleaned up temporary zip file.")
            
        print("Production index successfully deployed!")
        
    except Exception as e:
        print(f"Error during index download and deployment: {e}")
        # Exit with error to fail the Render build so bad/empty builds aren't deployed
        sys.exit(1)

if __name__ == "__main__":
    download_and_extract_index()
