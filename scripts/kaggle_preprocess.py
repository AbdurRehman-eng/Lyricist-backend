#!/usr/bin/env python3
"""
Lyrica Search Engine Dataset Preprocessor for Kaggle Notebooks
Optimized for 2x T4 GPUs and CPU Multiprocessing.

This script:
1. Downloads the 960k spotify-songs-with-attributes-and-lyrics dataset.
2. Cleans text columns on GPU 0 and GPU 1 in parallel using cuDF.
3. Tokenizes and lemmatizes using a fast caching lemmatizer and multi-core CPU.
4. Generates the lexicon, forward index, inverted index barrels, and details.json.
5. Packages everything into a single 'lyrica_index.zip'.
"""

import os
import gc
import sys
import json
import csv
import zipfile
import time
import pandas as pd
from concurrent.futures import ProcessPoolExecutor, as_completed

# Try importing kagglehub
try:
    import kagglehub
except ImportError:
    print("Installing kagglehub...")
    os.system("pip install -q kagglehub[pandas-datasets]")
    import kagglehub

# Try importing tqdm for interactive progress bars
try:
    from tqdm import tqdm
except ImportError:
    # A lightweight, clean fallback generator wrapper to report progress & speed
    def tqdm(iterable, total=None, desc=""):
        if total is None:
            try:
                total = len(iterable)
            except Exception:
                pass
        
        print(f"Starting {desc}...")
        start_time = time.time()
        last_print = start_time
        count = 0
        for item in iterable:
            yield item
            count += 1
            now = time.time()
            # Log progress every 10% or at least every 5 seconds
            if total and (count % max(1, total // 10) == 0 or now - last_print > 5.0):
                pct = (count / total) * 100
                elapsed = now - start_time
                speed = count / elapsed if elapsed > 0 else 0
                print(f"{desc}: {count}/{total} ({pct:.1f}%) completed. Speed: {speed:.1f} rows/s")
                last_print = now

# Searchable fields to index
SEARCHABLE_FIELDS = ["lyrics", "album_name", "artists", "name"]

# Schema mapping definitions
COLUMN_MAPPING = {
    'id': ['track_id', 'id', 'id_track', 'spotify_id'],
    'name': ['track_name', 'name', 'song_name', 'title'],
    'artists': ['track_artist', 'artists', 'artist_name', 'artist'],
    'album_name': ['album_name', 'track_album_name', 'album'],
    'lyrics': ['lyrics', 'words', 'lyric', 'text']
}

# Standardize column names to be compatible with backend schema
def standardize_columns(df):
    rename_dict = {}
    for target, sources in COLUMN_MAPPING.items():
        for source in sources:
            if source in df.columns:
                rename_dict[source] = target
                break
                
    df = df.rename(columns=rename_dict)
    
    # Ensure required target columns exist in df
    required_cols = ['id', 'name', 'artists', 'album_name', 'lyrics']
    for col in required_cols:
        if col not in df.columns:
            print(f"Warning: Column for '{col}' not found. Initializing as empty.")
            df[col] = ""
            
    return df

# Helper to download and locate the correct dataset CSV file
def get_dataset_df():
    print("Downloading dataset from Kaggle...")
    path = kagglehub.dataset_download("bwandowando/spotify-songs-with-attributes-and-lyrics")
    print(f"Dataset downloaded to: {path}")
    
    # Locate all CSV files in the downloaded path
    csv_files = [f for f in os.listdir(path) if f.endswith(".csv")]
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {path}")
    
    # Analyze CSV headers and choose the file with the most matching target columns
    best_file = None
    max_matches = -1
    for f in csv_files:
        filepath = os.path.join(path, f)
        try:
            # Read only the header row to inspect columns
            temp_df = pd.read_csv(filepath, nrows=0)
            cols = temp_df.columns.tolist()
            matches = 0
            for target, sources in COLUMN_MAPPING.items():
                if any(src in cols for src in sources):
                    matches += 1
            print(f"Inspecting file: {f} -> Schema matches: {matches}/{len(COLUMN_MAPPING)}")
            if matches > max_matches:
                max_matches = matches
                best_file = filepath
        except Exception as e:
            print(f"Warning: Could not read header of {f}: {e}")
            
    if best_file is None:
        best_file = os.path.join(path, csv_files[0])
        
    print(f"Selected dataset file: {best_file}")
    print("Loading dataset (this may take a moment)...")
    df = pd.read_csv(best_file)
    print(f"Loaded dataset of shape: {df.shape}")
    return df

def get_num_gpus():
    try:
        import subprocess
        res = subprocess.run(["nvidia-smi", "-L"], capture_output=True, text=True)
        if res.returncode == 0:
            lines = [line for line in res.stdout.strip().split("\n") if line]
            return len(lines)
    except Exception:
        pass
    return 0

# Worker function for parallel text cleaning
def clean_chunk(chunk_df, chunk_idx, gpu_id):
    import os
    import gc
    
    has_gpu = False
    if gpu_id is not None:
        os.environ["CUDA_VISIBLE_DEVICES"] = str(gpu_id)
        try:
            import cudf
            has_gpu = True
        except ImportError:
            pass
            
    if has_gpu:
        try:
            print(f"[Process {chunk_idx}] Using GPU {gpu_id} via cuDF for string cleaning.")
            gdf = cudf.from_pandas(chunk_df)
            for field in SEARCHABLE_FIELDS:
                if field in gdf.columns:
                    gdf[field] = gdf[field].fillna("").astype(str).str.lower()
                    # GPU Regex search & replace for punctuation
                    gdf[field] = gdf[field].str.replace(r'[^\w\s]', '', regex=True)
            cleaned_pd = gdf.to_pandas()
            del gdf
            gc.collect()
            return cleaned_pd
        except Exception as e:
            print(f"[Process {chunk_idx}] GPU cleaning failed, falling back to CPU: {e}")
            has_gpu = False
            
    # CPU fallback / CPU processing
    print(f"[Process {chunk_idx}] Using CPU via Pandas for string cleaning.")
    cleaned_df = chunk_df.copy()
    for field in SEARCHABLE_FIELDS:
        if field in cleaned_df.columns:
            cleaned_df[field] = cleaned_df[field].fillna("").astype(str).str.lower()
            cleaned_df[field] = cleaned_df[field].str.replace(r'[^\w\s]', '', regex=True)
    return cleaned_df

# Global variables for CPU worker initialization
_lemmatizer = None
_stopwords_set = None

def init_cpu_worker():
    global _lemmatizer, _stopwords_set
    import nltk
    from nltk.stem import WordNetLemmatizer
    from nltk.corpus import stopwords
    
    # Ensure NLTK resources are loaded
    for resource in ['punkt', 'stopwords', 'wordnet']:
        try:
            nltk.data.find(f'tokenizers/{resource}' if resource == 'punkt' else f'corpora/{resource}')
        except LookupError:
            nltk.download(resource, quiet=True)
            
    _lemmatizer = WordNetLemmatizer()
    try:
        _stopwords_set = set(stopwords.words('english'))
    except Exception:
        _stopwords_set = set()

# Process row tokens with local caching to bypass Lemmatizer overhead
def tokenize_and_lemmatize_row(row_tuple):
    global _lemmatizer, _stopwords_set
    if _lemmatizer is None:
        init_cpu_worker()
        
    all_tokens = []
    cache = {}
    
    for text in row_tuple:
        if not text:
            continue
        # Split by whitespace (punctuation was already stripped by GPU)
        tokens = text.split()
        for token in tokens:
            if token not in _stopwords_set:
                if token not in cache:
                    cache[token] = _lemmatizer.lemmatize(token)
                all_tokens.append(cache[token])
                
    return list(set(all_tokens))

def main():
    t_start = time.time()
    
    # 1. Download and load dataset
    try:
        df = get_dataset_df()
        df = standardize_columns(df)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
        
    # 2. Parallel string cleaning using GPUs or multiple CPU cores
    num_gpus = get_num_gpus()
    chunks = []
    
    if num_gpus > 0:
        print(f"Detected {num_gpus} GPU(s). Standardizing and cleaning on GPUs...")
        num_workers = num_gpus
        chunk_size = len(df) // num_workers
        for i in range(num_workers):
            start = i * chunk_size
            end = len(df) if i == num_workers - 1 else (i + 1) * chunk_size
            chunks.append((df.iloc[start:end], i, i))
    else:
        num_workers = os.cpu_count() or 4
        print(f"No GPUs detected. Cleaning in parallel on {num_workers} CPU cores...")
        chunk_size = len(df) // num_workers
        for i in range(num_workers):
            start = i * chunk_size
            end = len(df) if i == num_workers - 1 else (i + 1) * chunk_size
            chunks.append((df.iloc[start:end], i, None))
            
    cleaned_chunks = []
    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        futures = {executor.submit(clean_chunk, chunk_df, idx, gpu_id): idx for chunk_df, idx, gpu_id in chunks}
        for future in as_completed(futures):
            idx = futures[future]
            try:
                result_df = future.result()
                cleaned_chunks.append((idx, result_df))
                print(f"Chunk {idx} cleaned.")
            except Exception as exc:
                print(f"Chunk {idx} failed: {exc}")
                sys.exit(1)
                
    cleaned_chunks.sort(key=lambda x: x[0])
    df_cleaned = pd.concat([chunk[1] for chunk in cleaned_chunks], ignore_index=True)
    print("String cleaning complete.")
    
    # 3. CPU Multiprocessing for fast tokenization & lemmatization
    num_cpus = os.cpu_count() or 4
    print(f"Starting Tokenization & Lemmatization with {num_cpus} CPU processes...")
    rows = list(zip(*[df_cleaned[field].tolist() for field in SEARCHABLE_FIELDS]))
    
    with ProcessPoolExecutor(max_workers=num_cpus, initializer=init_cpu_worker) as executor:
        chunk_size_cpu = max(1, len(rows) // (num_cpus * 10))
        results = executor.map(tokenize_and_lemmatize_row, rows, chunksize=chunk_size_cpu)
        tokens_list = list(tqdm(results, total=len(rows), desc="Tokenizing & Lemmatizing"))
        
    print("Tokenization & Lemmatization complete.")
    
    # 4. Lexicon and Index Construction
    print("Building lexicon...")
    lexicon = {}
    id_counter = 1
    for doc_tokens in tqdm(tokens_list, desc="Building lexicon"):
        for token in doc_tokens:
            if token not in lexicon:
                lexicon[token] = id_counter
                id_counter += 1
                
    print(f"Lexicon built with {len(lexicon)} unique terms.")
    
    print("Building inverted index in memory...")
    inverted_index = {}
    for idx, doc_tokens in tqdm(enumerate(tokens_list), total=len(tokens_list), desc="Building inverted index"):
        doc_id = idx + 1
        for token in doc_tokens:
            if token not in inverted_index:
                inverted_index[token] = []
            inverted_index[token].append(doc_id)
            
    # 5. Writing output files
    print("Writing lexicon.csv...")
    sorted_lexicon = sorted(lexicon.items(), key=lambda x: x[1])
    with open("lexicon.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Term", "Word IDs"])
        for term, word_id in sorted_lexicon:
            writer.writerow([term, word_id])
            
    print("Writing forward_index.csv...")
    with open("forward_index.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Document ID", "Terms"])
        for idx, doc_tokens in tqdm(enumerate(tokens_list), total=len(tokens_list), desc="Writing forward index"):
            doc_id = idx + 1
            writer.writerow([doc_id, str(doc_tokens)])
            
    print("Writing details.json...")
    ids = df["id"].fillna("").tolist()
    names = df["name"].fillna("Unknown").tolist()
    artists = df["artists"].fillna("Unknown").tolist()
    album_names = df["album_name"].fillna("Unknown").tolist()
    
    details = [
        {
            "spotify_id": ids[i],
            "name": names[i],
            "doc_id": i + 1,
            "artists": artists[i],
            "album_name": album_names[i]
        }
        for i in tqdm(range(len(ids)), desc="Building details list")
    ]
    with open("details.json", "w", encoding="utf-8") as f:
        json.dump(details, f, indent=4, ensure_ascii=False)
        
    print("Writing inverted_index.csv...")
    with open("inverted_index.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Term", "Document IDs"])
        for term, doc_ids in tqdm(sorted(inverted_index.items()), desc="Writing inverted index"):
            writer.writerow([term, ",".join(map(str, sorted(set(doc_ids))))])
            
    print("Partitioning and writing barrels...")
    os.makedirs("barrels", exist_ok=True)
    barrel_groups = {}
    for term, doc_ids in tqdm(inverted_index.items(), desc="Partitioning terms into barrels"):
        word_id = lexicon.get(term)
        if word_id is not None:
            barrel_id = word_id // 1000
            if barrel_id not in barrel_groups:
                barrel_groups[barrel_id] = []
            barrel_groups[barrel_id].append((term, doc_ids))
            
    for barrel_id, terms_list in tqdm(barrel_groups.items(), desc="Writing barrel files"):
        file_path = os.path.join("barrels", f"barrel_{barrel_id}.csv")
        with open(file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Term", "Document IDs"])
            for term, doc_ids in sorted(terms_list):
                writer.writerow([term, ",".join(map(str, sorted(set(doc_ids))))])
                
    # 6. Zipping all outputs
    print("Creating lyrica_index.zip...")
    zip_filename = "lyrica_index.zip"
    with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zipf:
        zipf.write("lexicon.csv")
        zipf.write("forward_index.csv")
        zipf.write("details.json")
        zipf.write("inverted_index.csv")
        for root, dirs, files in tqdm(os.walk("barrels"), desc="Zipping barrels"):
            for file in files:
                file_path = os.path.join(root, file)
                zipf.write(file_path, os.path.join("barrels", file))
                
    print(f"\nProcessing complete in {time.time() - t_start:.2f} seconds!")
    print(f"Output files packaged successfully in: {zip_filename}")
    
    # 7. Uploading to a temporary secure file host for direct high-speed download
    print("\nUploading lyrica_index.zip to file.io for direct high-speed download...")
    uploaded = False
    try:
        import subprocess
        res = subprocess.run(["curl", "-L", "-F", f"file=@{zip_filename}", "https://file.io"], capture_output=True, text=True)
        if res.returncode == 0 and "success" in res.stdout:
            data = json.loads(res.stdout)
            if data.get("success"):
                print(f"Direct Download URL (file.io): {data.get('link')}")
                uploaded = True
    except Exception as e:
        print(f"file.io upload failed: {e}")
        
    if not uploaded:
        print("\nUploading to transfer.sh as a fallback...")
        try:
            res = subprocess.run(["curl", "-L", "--upload-file", zip_filename, f"https://transfer.sh/{zip_filename}"], capture_output=True, text=True)
            if res.returncode == 0 and res.stdout.strip():
                print(f"Direct Download URL (transfer.sh): {res.stdout.strip()}")
            else:
                print("Could not upload to transfer.sh fallback.")
        except Exception as e:
            print(f"transfer.sh upload failed: {e}")


if __name__ == "__main__":
    main()
