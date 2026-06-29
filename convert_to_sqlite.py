import os
import csv
import json
import sqlite3
import sys

def stream_json_array(filepath):
    """
    Memory-efficient streaming parser for large JSON arrays of objects.
    Yields parsed Python dictionaries one by one, using minimal RAM.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        # Move past any leading whitespace and the opening bracket '['
        char = f.read(1)
        while char and char != '[':
            char = f.read(1)
        
        buffer = []
        depth = 0
        in_string = False
        escape = False
        
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            for c in chunk:
                buffer.append(c)
                if escape:
                    escape = False
                    continue
                if c == '\\':
                    escape = True
                    continue
                if c == '"':
                    in_string = not in_string
                    continue
                if not in_string:
                    if c == '{':
                        if depth == 0:
                            # Start of a new object
                            buffer = ['{']
                        depth += 1
                    elif c == '}':
                        depth -= 1
                        if depth == 0:
                            # End of a complete object
                            obj_str = "".join(buffer)
                            yield json.loads(obj_str)
                            buffer = []

def convert():
    db_path = "details.db"
    
    # 1. Connect to SQLite
    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Enable performance settings for fast bulk inserts
    cursor.execute("PRAGMA synchronous = OFF")
    cursor.execute("PRAGMA journal_mode = MEMORY")
    cursor.execute("PRAGMA temp_store = MEMORY")
    cursor.execute("PRAGMA cache_size = -500000") # 500MB cache size
    
    # Create tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lexicon (
            word TEXT PRIMARY KEY,
            word_id INTEGER
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS details (
            doc_id INTEGER PRIMARY KEY,
            spotify_id TEXT,
            name TEXT,
            artists TEXT,
            album_name TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS postings (
            word_id INTEGER PRIMARY KEY,
            doc_ids TEXT
        )
    """)
    # Temp postings table to join in SQLite
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS temp_postings (
            word TEXT,
            doc_ids TEXT
        )
    """)
    conn.commit()

    # 2. Convert details.json in a streaming fashion
    details_json = "details.json"
    if os.path.exists(details_json):
        print(f"Converting {details_json} to details table (streaming)...")
        try:
            insert_data = []
            count = 0
            for item in stream_json_array(details_json):
                insert_data.append((
                    int(item["doc_id"]),
                    item.get("spotify_id"),
                    item.get("name"),
                    item.get("artists"),
                    item.get("album_name")
                ))
                if len(insert_data) >= 50000:
                    cursor.executemany(
                        "INSERT OR REPLACE INTO details (doc_id, spotify_id, name, artists, album_name) VALUES (?, ?, ?, ?, ?)",
                        insert_data
                    )
                    conn.commit()
                    count += len(insert_data)
                    print(f"  Inserted {count} details rows...", flush=True)
                    insert_data = []
            
            if insert_data:
                cursor.executemany(
                    "INSERT OR REPLACE INTO details (doc_id, spotify_id, name, artists, album_name) VALUES (?, ?, ?, ?, ?)",
                    insert_data
                )
                conn.commit()
                count += len(insert_data)
            print(f"Successfully populated details table with {count} rows.")
        except Exception as e:
            print(f"Error converting details.json: {e}")
            sys.exit(1)
    else:
        print("details.json not found, skipping details table populate.")

    # 3. Convert lexicon.csv in a streaming fashion
    lexicon_csv = "lexicon.csv"
    if os.path.exists(lexicon_csv):
        print(f"Converting {lexicon_csv} to lexicon table (streaming)...")
        try:
            insert_data = []
            count = 0
            csv.field_size_limit(100000000)
            with open(lexicon_csv, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                next(reader, None) # Skip header
                for row in reader:
                    if len(row) == 2:
                        word, word_id = row
                        insert_data.append((word.lower().strip(), int(word_id)))
                        if len(insert_data) >= 100000:
                            cursor.executemany("INSERT OR REPLACE INTO lexicon (word, word_id) VALUES (?, ?)", insert_data)
                            conn.commit()
                            count += len(insert_data)
                            print(f"  Inserted {count} lexicon words...", flush=True)
                            insert_data = []
                            
            if insert_data:
                cursor.executemany("INSERT OR REPLACE INTO lexicon (word, word_id) VALUES (?, ?)", insert_data)
                conn.commit()
                count += len(insert_data)
            print(f"Successfully populated lexicon table with {count} rows.")
        except Exception as e:
            print(f"Error converting lexicon.csv: {e}")
            sys.exit(1)
    else:
        print("lexicon.csv not found, skipping lexicon table populate.")

    # 4. Create index on lexicon for join speed
    print("Creating index on lexicon word column...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_lexicon_word ON lexicon(word)")
    conn.commit()

    # 5. Convert inverted index to temp_postings
    barrels_dir = "barrels"
    has_postings = False
    if os.path.exists(barrels_dir) and os.path.isdir(barrels_dir):
        print("Converting inverted index barrels to temp_postings (streaming)...")
        try:
            barrel_files = [f for f in os.listdir(barrels_dir) if f.startswith("barrel_") and f.endswith(".csv")]
            print(f"Found {len(barrel_files)} barrel files.")
            
            insert_data = []
            count = 0
            for file in barrel_files:
                file_path = os.path.join(barrels_dir, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    reader = csv.reader(f)
                    next(reader, None) # Skip header
                    for row in reader:
                        if len(row) == 2:
                            term, doc_ids_str = row
                            insert_data.append((term.lower().strip(), doc_ids_str))
                            if len(insert_data) >= 100000:
                                cursor.executemany("INSERT INTO temp_postings (word, doc_ids) VALUES (?, ?)", insert_data)
                                conn.commit()
                                count += len(insert_data)
                                print(f"  Inserted {count} temp postings...", flush=True)
                                insert_data = []
                                
            if insert_data:
                cursor.executemany("INSERT INTO temp_postings (word, doc_ids) VALUES (?, ?)", insert_data)
                conn.commit()
                count += len(insert_data)
            print(f"Successfully loaded {count} raw postings into temp_postings.")
            has_postings = True
        except Exception as e:
            print(f"Error converting barrels: {e}")
            sys.exit(1)
            
    elif os.path.exists("inverted_index.csv"):
        print("Converting consolidated inverted_index.csv to temp_postings...")
        try:
            insert_data = []
            count = 0
            with open("inverted_index.csv", "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                next(reader, None) # Skip header
                for row in reader:
                    if len(row) == 2:
                        term, doc_ids_str = row
                        insert_data.append((term.lower().strip(), doc_ids_str))
                        if len(insert_data) >= 100000:
                            cursor.executemany("INSERT INTO temp_postings (word, doc_ids) VALUES (?, ?)", insert_data)
                            conn.commit()
                            count += len(insert_data)
                            print(f"  Inserted {count} temp postings...", flush=True)
                            insert_data = []
                            
            if insert_data:
                cursor.executemany("INSERT INTO temp_postings (word, doc_ids) VALUES (?, ?)", insert_data)
                conn.commit()
                count += len(insert_data)
            print(f"Successfully loaded {count} raw postings into temp_postings.")
            has_postings = True
        except Exception as e:
            print(f"Error converting inverted_index.csv: {e}")
            sys.exit(1)

    if has_postings:
        # Create temp_postings index for fast join
        print("Creating index on temp_postings word column...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tp_word ON temp_postings(word)")
        conn.commit()
        
        # Join temp_postings with lexicon to populate postings table using zero Python memory!
        print("Populating production postings table via database-level JOIN...")
        cursor.execute("""
            INSERT OR REPLACE INTO postings (word_id, doc_ids)
            SELECT l.word_id, tp.doc_ids
            FROM temp_postings tp
            JOIN lexicon l ON l.word = tp.word
        """)
        conn.commit()
        print("Successfully populated postings table.")
        
        # Drop temp table
        print("Dropping temporary postings table...")
        cursor.execute("DROP TABLE IF EXISTS temp_postings")
        conn.commit()

    # Create indexes for optimal query speeds
    print("Creating production database indexes...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_details_doc_id ON details(doc_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_postings_word_id ON postings(word_id)")
    conn.commit()
    
    # Run VACUUM to compress database size
    print("Optimizing database storage (VACUUM)...")
    cursor.execute("VACUUM")
    conn.commit()
    conn.close()
    print("Database conversion complete!")

    # 6. Clean up source files to save disk space
    print("Cleaning up source files to free up disk space...")
    import shutil
    for path in ["details.json", "lexicon.csv", "forward_index.csv", "inverted_index.csv"]:
        if os.path.exists(path):
            try:
                os.remove(path)
                print(f"Deleted source file {path}")
            except Exception as e:
                print(f"Could not delete {path}: {e}")
                
    if os.path.exists(barrels_dir) and os.path.isdir(barrels_dir):
        try:
            shutil.rmtree(barrels_dir)
            print(f"Deleted source directory {barrels_dir}")
        except Exception as e:
            print(f"Could not delete {barrels_dir}: {e}")

if __name__ == "__main__":
    convert()
