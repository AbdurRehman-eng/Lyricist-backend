"""
Indexing Module

Manages the construction, saving, loading, and querying of forward
and inverted indexes.
"""

import csv
import json
from collections import defaultdict
import pandas as pd
from .barrels import Barrels
from .preprocessor import preprocess_text

class InvertedIndex:
    """
    Manages the inverted index mappings of terms to posting lists of document IDs,
    interfacing with partitioned barrels for disk and memory storage.
    """
    def __init__(self, barrel_size=1000):
        """
        Initialize the InvertedIndex.
        
        :param barrel_size: Partition size for barrels.
        """
        self.index = defaultdict(list)
        self.barrels = Barrels(barrel_size)

    def build(self, forward_index, lexicon):
        """
        Build the inverted index from a forward index and partition it into barrels.
        
        :param forward_index: Dict mapping document IDs to lists of terms.
        :param lexicon: Dict mapping terms to word IDs.
        """
        for doc_id, terms in forward_index.items():
            for term in set(terms):  # Ensure unique words per doc
                word_id = lexicon.get(term)
                if word_id is not None:
                    self.index[term].append(doc_id)
                    self.barrels.add_to_barrel(term, word_id, self.index[term])

    def save_to_barrels(self, folder_path):
        """
        Save inverted index barrels to CSV files.
        """
        self.barrels.save_barrels(folder_path)

    def load_from_barrels(self, folder_path):
        """
        Load barrels from CSV files.
        """
        self.barrels.load_barrels(folder_path)

    def search(self, term, lexicon):
        """
        Search for a term in the inverted index using partitioned barrels.
        
        :param term: Query term.
        :param lexicon: Lexicon dictionary.
        :return: List of document IDs containing the term.
        """
        word_id = lexicon.get(term)
        if word_id is None:
            return []
        return self.barrels.search(term, word_id)

    def save_to_csv(self, file_path):
        """
        Save the full in-memory inverted index to a single consolidated CSV file.
        """
        with open(file_path, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(["Term", "Document IDs"])
            # If the index is empty but we have barrels loaded, reconstruct the index dict
            if not self.index and self.barrels.barrels:
                for barrel in self.barrels.barrels.values():
                    for term, doc_ids in barrel.items():
                        self.index[term].extend(doc_ids)
            
            for term, doc_ids in sorted(self.index.items()):
                writer.writerow([term, ",".join(map(str, sorted(set(doc_ids))))])


def create_forward_index(data, searchable_fields):
    """
    Create a forward index for a dataset, assigning sequential integer doc IDs.
    
    :param data: List of record dicts.
    :param searchable_fields: Fields to preprocess and index.
    :return: Tuple of (forward_index_dict, updated_data_list)
    """
    forward_index = {}
    doc_id_counter = 1
    
    for row in data:
        doc_id = doc_id_counter
        all_tokens = []
        
        for field in searchable_fields:
            field_value = row.get(field, "")
            if not isinstance(field_value, str):
                field_value = str(field_value) if pd.notna(field_value) else ""
            all_tokens.extend(preprocess_text(field_value))
            
        forward_index[doc_id] = list(set(all_tokens))  # Keep unique tokens per doc
        row['doc_id'] = doc_id
        doc_id_counter += 1
        
    return forward_index, data


def create_details_json(data, output_file):
    """
    Generate metadata details file mapping doc IDs to display information.
    """
    details = []
    for row in data:
        details.append({
            "spotify_id": row.get("id"),
            "name": row.get("name", "Unknown") if pd.notna(row.get("name")) else "Unknown",
            "doc_id": int(row["doc_id"]),
            "artists": row.get("artists", "Unknown") if pd.notna(row.get("artists")) else "Unknown",
            "album_name": row.get("album_name", "Unknown") if pd.notna(row.get("album_name")) else "Unknown"
        })
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(details, f, indent=4, ensure_ascii=False)
