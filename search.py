"""
Search Script Wrapper

Maintains backward-compatibility by importing and exposing the core
search structures from the new search_engine package.
"""

import json
from search_engine import (
    load_lexicon,
    InvertedIndex,
    HybridSearchEngine
)

# Load Lexicon mapping
lexicon = load_lexicon("lexicon.csv")

# Load Metadata details mapping
try:
    with open("details.json", "r", encoding="utf-8") as f:
        details = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    details = []
doc_id_to_details = {item["doc_id"]: item for item in details}

# Initialize inverted index and load from barrels
inverted_index = InvertedIndex()
try:
    inverted_index.load_from_barrels("barrels")
except Exception as e:
    print(f"Warning: Could not load index barrels: {e}")

# Instantiate hybrid search engine
hybrid_engine = HybridSearchEngine(inverted_index, lexicon, doc_id_to_details)
