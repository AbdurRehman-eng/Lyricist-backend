"""
Lexicon Management Module

Handles the creation, loading, and saving of the lexicon, which maps
unique word terms to their respective Word IDs.
"""

import pandas as pd
from .preprocessor import preprocess_text

def create_lexicon(data, searchable_fields):
    """
    Create a lexicon with unique IDs for each word.
    
    :param data: List of dictionaries containing dataset rows.
    :param searchable_fields: List of fields to include in the lexicon.
    :return: Lexicon dictionary with terms as keys and unique word IDs (integers) as values.
    """
    lexicon = {}
    id_counter = 1
    
    for row in data:
        for field in searchable_fields:
            field_value = row.get(field, "")
            # Ensure it is treated as a string
            if not isinstance(field_value, str):
                field_value = str(field_value) if pd.notna(field_value) else ""
            
            tokens = preprocess_text(field_value)
            for token in set(tokens):  # Avoid duplicate tokens in the same document row
                if token not in lexicon:
                    lexicon[token] = id_counter
                    id_counter += 1
                    
    return lexicon

def load_lexicon(file_path):
    """
    Load lexicon from a CSV file.
    
    :param file_path: Path to the lexicon CSV file.
    :return: Dictionary mapping terms (str) to word IDs (int).
    """
    try:
        df = pd.read_csv(file_path)
        # Drop rows with NaN terms or Word IDs
        df = df.dropna(subset=["Term", "Word IDs"])
        # Map Term to Word IDs as integers
        return df.set_index("Term")["Word IDs"].astype(int).to_dict()
    except FileNotFoundError:
        return {}

def save_lexicon(lexicon, file_path):
    """
    Save lexicon to a CSV file.
    
    :param lexicon: Lexicon dictionary mapping terms to word IDs.
    :param file_path: Path where lexicon CSV file will be saved.
    """
    # Sort by Word IDs for cleaner file order
    sorted_items = sorted(lexicon.items(), key=lambda x: x[1])
    lexicon_df = pd.DataFrame(sorted_items, columns=["Term", "Word IDs"])
    lexicon_df.to_csv(file_path, index=False)
