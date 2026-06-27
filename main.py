"""
Main Indexing Script

Preprocesses the songs dataset, builds the lexicon, builds forward & inverted indices,
generates partitioned barrel files, and stores metadata details.
"""

import pandas as pd
from search_engine import (
    create_lexicon,
    create_forward_index,
    create_details_json,
    InvertedIndex,
    save_lexicon
)

# Searchable fields for indexing and mapping
SEARCHABLE_FIELDS = ["lyrics", "album_name", "artists", "name"]

def preprocess_data():
    """
    Main pipeline to load, index, and partition song datasets.
    """
    print("Loading dataset songs.csv...")
    file_path = "songs.csv"
    try:
        data = pd.read_csv(file_path).to_dict(orient="records")
    except Exception as e:
        print(f"Error loading songs.csv: {e}")
        return

    print("Generating lexicon and forward index...")
    lexicon = create_lexicon(data, SEARCHABLE_FIELDS)
    forward_index, updated_data = create_forward_index(data, SEARCHABLE_FIELDS)

    print("Saving lexicon to lexicon.csv...")
    save_lexicon(lexicon, "lexicon.csv")

    print("Saving forward index to forward_index.csv...")
    forward_index_df = pd.DataFrame(list(forward_index.items()), columns=["Document ID", "Terms"])
    forward_index_df.to_csv("forward_index.csv", index=False)

    print("Saving details to details.json...")
    create_details_json(updated_data, "details.json")

    print("Building and saving inverted index barrels...")
    inverted_index = InvertedIndex()
    inverted_index.build(forward_index, lexicon)
    inverted_index.save_to_barrels("barrels")  # Save barrels to folder

    print("Saving consolidated inverted index CSV...")
    inverted_index.save_to_csv("inverted_index.csv")

    print("\nIndexing Pipeline Complete!")
    print("- Lexicon saved to lexicon.csv")
    print("- Forward index saved to forward_index.csv")
    print("- Metadata details saved to details.json")
    print("- Partitioned barrels stored in './barrels/'")
    print("- Consolidated inverted index saved to inverted_index.csv")

if __name__ == "__main__":
    preprocess_data()
