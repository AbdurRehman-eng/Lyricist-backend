import os
import csv
import json
import sqlite3
import sys

def convert():
    db_path = "details.db"
    
    # 1. Connect to SQLite
    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Enable performance settings for fast bulk inserts
    cursor.execute("PRAGMA synchronous = OFF")
    cursor.execute("PRAGMA journal_mode = MEMORY")
    
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
    conn.commit()

    # 2. Convert details.json
    details_json = "details.json"
    if os.path.exists(details_json):
        print(f"Converting {details_json} to details table...")
        try:
            with open(details_json, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            insert_data = []
            for item in data:
                insert_data.append((
                    int(item["doc_id"]),
                    item.get("spotify_id"),
                    item.get("name"),
                    item.get("artists"),
                    item.get("album_name")
                ))
            
            cursor.executemany(
                "INSERT OR REPLACE INTO details (doc_id, spotify_id, name, artists, album_name) VALUES (?, ?, ?, ?, ?)",
                insert_data
            )
            conn.commit()
            print(f"Successfully inserted {len(insert_data)} details rows.")
        except Exception as e:
            print(f"Error converting details.json: {e}")
            sys.exit(1)
    else:
        print("details.json not found, skipping details table populate (may be running updates).")

    # 3. Convert lexicon.csv
    lexicon_csv = "lexicon.csv"
    if os.path.exists(lexicon_csv):
        print(f"Converting {lexicon_csv} to lexicon table...")
        try:
            insert_data = []
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
                            insert_data = []
                            
            if insert_data:
                cursor.executemany("INSERT OR REPLACE INTO lexicon (word, word_id) VALUES (?, ?)", insert_data)
                conn.commit()
            print("Successfully populated lexicon table.")
        except Exception as e:
            print(f"Error converting lexicon.csv: {e}")
            sys.exit(1)
    else:
        print("lexicon.csv not found, skipping lexicon table populate.")

    # 4. Convert inverted_index / barrels
    # We can either convert from inverted_index.csv or from the barrels/ folder.
    # Converting from barrels/ is very clean and reliable.
    barrels_dir = "barrels"
    if os.path.exists(barrels_dir) and os.path.isdir(barrels_dir):
        print("Converting inverted index barrels to postings table...")
        try:
            barrel_files = [f for f in os.listdir(barrels_dir) if f.startswith("barrel_") and f.endswith(".csv")]
            print(f"Found {len(barrel_files)} barrel files.")
            
            # We need to map term -> word_id to store in postings.
            # So we load word_ids from lexicon in a lightweight query or dictionary if memory allows.
            # But wait! We can just fetch word_ids directly from the lexicon table we just populated!
            # Since querying SQLite for millions of words one-by-one is slow, we can just load the lexicon table
            # into a temp dict. In Python, a dict of 2.45 million strings to integers takes about 80MB-100MB RAM,
            # which is completely fine in the build step.
            print("Loading word_id mapping from lexicon database...")
            cursor.execute("SELECT word, word_id FROM lexicon")
            word_to_id = {row[0]: row[1] for row in cursor.fetchall()}
            print(f"Loaded {len(word_to_id)} words from lexicon table.")
            
            insert_data = []
            for file in barrel_files:
                file_path = os.path.join(barrels_dir, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    reader = csv.reader(f)
                    next(reader, None) # Skip header
                    for row in reader:
                        if len(row) == 2:
                            term, doc_ids_str = row
                            term_lower = term.lower().strip()
                            word_id = word_to_id.get(term_lower)
                            if word_id is not None:
                                insert_data.append((word_id, doc_ids_str))
                                if len(insert_data) >= 100000:
                                    cursor.executemany("INSERT OR REPLACE INTO postings (word_id, doc_ids) VALUES (?, ?)", insert_data)
                                    conn.commit()
                                    insert_data = []
                                    
            if insert_data:
                cursor.executemany("INSERT OR REPLACE INTO postings (word_id, doc_ids) VALUES (?, ?)", insert_data)
                conn.commit()
            print("Successfully populated postings table.")
        except Exception as e:
            print(f"Error converting barrels: {e}")
            sys.exit(1)
            
    elif os.path.exists("inverted_index.csv"):
        print("Converting consolidated inverted_index.csv to postings table...")
        try:
            print("Loading word_id mapping from lexicon database...")
            cursor.execute("SELECT word, word_id FROM lexicon")
            word_to_id = {row[0]: row[1] for row in cursor.fetchall()}
            
            insert_data = []
            with open("inverted_index.csv", "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                next(reader, None) # Skip header
                for row in reader:
                    if len(row) == 2:
                        term, doc_ids_str = row
                        term_lower = term.lower().strip()
                        word_id = word_to_id.get(term_lower)
                        if word_id is not None:
                            insert_data.append((word_id, doc_ids_str))
                            if len(insert_data) >= 100000:
                                cursor.executemany("INSERT OR REPLACE INTO postings (word_id, doc_ids) VALUES (?, ?)", insert_data)
                                conn.commit()
                                insert_data = []
                                
            if insert_data:
                cursor.executemany("INSERT OR REPLACE INTO postings (word_id, doc_ids) VALUES (?, ?)", insert_data)
                conn.commit()
            print("Successfully populated postings table.")
        except Exception as e:
            print(f"Error converting inverted_index.csv: {e}")
            sys.exit(1)
    else:
        print("No barrels/ or inverted_index.csv found to populate postings.")

    # Create indexes for optimal query speeds
    print("Creating indexes on database columns...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_lexicon_word ON lexicon(word)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_details_doc_id ON details(doc_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_postings_word_id ON postings(word_id)")
    conn.commit()
    
    # Run VACUUM to compress database size
    print("Optimizing database storage...")
    cursor.execute("VACUUM")
    conn.commit()
    conn.close()
    print("Database conversion complete!")

    # 5. Clean up source files to save disk space
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
