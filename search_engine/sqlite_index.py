import os
import sqlite3
import json

class SQLiteLexicon:
    def __init__(self, db_path):
        self.db_path = db_path

    def get(self, word, default=None):
        if not isinstance(word, str) or not word:
            return default
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT word_id FROM lexicon WHERE word = ?", (word.lower().strip(),))
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else default

    def __contains__(self, word):
        return self.get(word) is not None

    def __len__(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM lexicon")
        count = cursor.fetchone()[0]
        conn.close()
        return count

    def __setitem__(self, token, word_id):
        if not isinstance(token, str) or not token:
            return
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO lexicon (word, word_id) VALUES (?, ?)", (token.lower().strip(), word_id))
        conn.commit()
        conn.close()

    def get_common_words(self, limit=30000):
        """
        Get the most common words based on word_id (since lower IDs are processed first).
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT word FROM lexicon ORDER BY word_id ASC LIMIT ?", (limit,))
        words = [row[0] for row in cursor.fetchall()]
        conn.close()
        return words


class SQLiteDetails:
    def __init__(self, db_path):
        self.db_path = db_path

    def __getitem__(self, doc_id):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT spotify_id, name, artists, album_name FROM details WHERE doc_id = ?", (int(doc_id),))
        row = cursor.fetchone()
        conn.close()
        if row:
            return {
                "doc_id": int(doc_id),
                "spotify_id": row[0],
                "name": row[1],
                "artists": row[2],
                "album_name": row[3]
            }
        raise KeyError(doc_id)

    def get(self, doc_id, default=None):
        try:
            return self[doc_id]
        except KeyError:
            return default

    def __setitem__(self, doc_id, details):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO details (doc_id, spotify_id, name, artists, album_name) VALUES (?, ?, ?, ?, ?)",
            (int(doc_id), details.get("spotify_id"), details.get("name"), details.get("artists"), details.get("album_name"))
        )
        conn.commit()
        conn.close()

    def values(self):
        """
        Fallback values method. Limited to prevent OOM in Flask.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT doc_id, spotify_id, name, artists, album_name FROM details LIMIT 1000")
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "doc_id": row[0],
                "spotify_id": row[1],
                "name": row[2],
                "artists": row[3],
                "album_name": row[4]
            }
            for row in rows
        ]


class SQLiteInvertedIndex:
    def __init__(self, db_path):
        self.db_path = db_path
        # Dummy barrels attribute to satisfy add_to_barrel dynamic updates in add_document
        self.barrels = self

    def load_from_barrels(self, folder_path):
        # No-op since we query SQLite directly
        pass

    def search(self, term, lexicon):
        word_id = lexicon.get(term)
        if word_id is None:
            return []
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT doc_ids FROM postings WHERE word_id = ?", (word_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row and row[0]:
            return list(map(int, row[0].split(",")))
        return []

    def add_to_barrel(self, term, word_id, doc_ids):
        """
        Add doc IDs to a posting list dynamically. Used during add_document.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Fetch existing posting list
        cursor.execute("SELECT doc_ids FROM postings WHERE word_id = ?", (word_id,))
        row = cursor.fetchone()
        
        existing = set()
        if row and row[0]:
            existing = set(map(int, row[0].split(",")))
            
        updated = existing.union(doc_ids)
        doc_ids_str = ",".join(map(str, sorted(updated)))
        
        cursor.execute("INSERT OR REPLACE INTO postings (word_id, doc_ids) VALUES (?, ?)", (word_id, doc_ids_str))
        conn.commit()
        conn.close()

    def save_to_barrels(self, folder_path):
        # No-op since updates are written to database directly during add_to_barrel
        pass


class SQLiteIndexManager:
    def __init__(self, db_path="details.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
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
        conn.close()

    def get_lexicon(self):
        return SQLiteLexicon(self.db_path)

    def get_details(self):
        return SQLiteDetails(self.db_path)

    def get_inverted_index(self):
        return SQLiteInvertedIndex(self.db_path)

    def get_paginated_songs(self, page=1, limit=15, search_query=""):
        """
        Database-level pagination and search filtering.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        offset = (page - 1) * limit
        
        if search_query:
            # Query with filtering
            like_query = f"%{search_query.lower()}%"
            
            # Count total matching records
            cursor.execute(
                "SELECT COUNT(*) FROM details WHERE name LIKE ? OR artists LIKE ? OR album_name LIKE ?",
                (like_query, like_query, like_query)
            )
            total = cursor.fetchone()[0]
            
            # Fetch matching records
            cursor.execute(
                "SELECT doc_id, spotify_id, name, artists, album_name FROM details WHERE name LIKE ? OR artists LIKE ? OR album_name LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?",
                (like_query, like_query, like_query, limit, offset)
            )
            rows = cursor.fetchall()
        else:
            # Count all records
            cursor.execute("SELECT COUNT(*) FROM details")
            total = cursor.fetchone()[0]
            
            # Fetch all records paginated
            cursor.execute(
                "SELECT doc_id, spotify_id, name, artists, album_name FROM details ORDER BY name ASC LIMIT ? OFFSET ?",
                (limit, offset)
            )
            rows = cursor.fetchall()
            
        conn.close()
        
        songs = [
            {
                "doc_id": row[0],
                "spotify_id": row[1],
                "name": row[2],
                "artists": row[3],
                "album_name": row[4]
            }
            for row in rows
        ]
        
        pages = (total + limit - 1) // limit
        
        return {
            "songs": songs,
            "total": total,
            "pages": pages,
            "page": page,
            "limit": limit,
            "unique_artists": 124472,
            "unique_albums": 96691
        }
