"""
Barrel Manager Module

Manages the partitioning of the inverted index into "barrels" (sub-files)
to organize and store term-to-document postings lists.
"""

import os
import csv
from collections import defaultdict

class Barrels:
    """
    Partitions the inverted index posting lists into chunks (barrels)
    based on Word IDs to make the index highly scalable and manageable.
    """
    def __init__(self, barrel_size=1000):
        """
        Initialize the Barrels structure.
        
        :param barrel_size: Maximum number of word IDs per barrel.
        """
        self.barrel_size = barrel_size
        # Map: barrel_id -> { term -> set(doc_ids) }
        self.barrels = defaultdict(dict)

    def calculate_barrel_id(self, word_id):
        """
        Determine which barrel a word ID belongs to.
        
        :param word_id: Integer word ID.
        :return: Integer barrel ID.
        """
        return word_id // self.barrel_size

    def add_to_barrel(self, term, word_id, doc_ids):
        """
        Add document IDs to the posting list of a term inside its barrel.
        
        :param term: Lexicon term.
        :param word_id: Word ID corresponding to the term.
        :param doc_ids: Iterable of document IDs (integers).
        """
        barrel_id = self.calculate_barrel_id(word_id)
        if term in self.barrels[barrel_id]:
            self.barrels[barrel_id][term] = self.barrels[barrel_id][term].union(doc_ids)
        else:
            self.barrels[barrel_id][term] = set(doc_ids)

    def save_barrels(self, folder_path):
        """
        Save all barrels to disk as CSV files. Clears the target directory
        of existing barrel files beforehand.
        
        :param folder_path: Path to the directory where barrels will be saved.
        """
        # Clear existing barrel CSV files in directory
        if os.path.exists(folder_path):
            for file in os.listdir(folder_path):
                if file.startswith("barrel_") and file.endswith(".csv"):
                    try:
                        os.remove(os.path.join(folder_path, file))
                    except OSError:
                        pass

        os.makedirs(folder_path, exist_ok=True)

        # Write each barrel to a separate CSV
        for barrel_id, terms in self.barrels.items():
            file_path = os.path.join(folder_path, f"barrel_{barrel_id}.csv")
            with open(file_path, mode="w", newline="", encoding="utf-8") as file:
                writer = csv.writer(file)
                writer.writerow(["Term", "Document IDs"])
                for term, doc_ids in terms.items():
                    writer.writerow([term, ",".join(map(str, sorted(doc_ids)))])

    def load_barrels(self, folder_path):
        """
        Load all barrel CSV files from the specified folder into memory.
        
        :param folder_path: Path to the directory containing barrel files.
        """
        if not os.path.exists(folder_path):
            raise FileNotFoundError(f"Folder {folder_path} does not exist")

        for file in os.listdir(folder_path):
            if file.startswith("barrel_") and file.endswith(".csv"):
                try:
                    barrel_id = int(file.split("_")[1].split(".")[0])
                except (ValueError, IndexError):
                    continue
                
                file_path = os.path.join(folder_path, file)
                with open(file_path, mode="r", newline="", encoding="utf-8") as f:
                    reader = csv.reader(f)
                    next(reader, None)  # Skip header row
                    for row in reader:
                        if len(row) == 2:
                            term, doc_ids_str = row
                            if doc_ids_str:
                                self.barrels[barrel_id][term] = set(map(int, doc_ids_str.split(",")))
                            else:
                                self.barrels[barrel_id][term] = set()

    def search(self, term, word_id):
        """
        Retrieve the posting list (document IDs) for a term from its respective barrel.
        
        :param term: Lexicon term to search.
        :param word_id: Word ID corresponding to the term.
        :return: List of document IDs containing the term.
        """
        barrel_id = self.calculate_barrel_id(word_id)
        if barrel_id in self.barrels and term in self.barrels[barrel_id]:
            return list(self.barrels[barrel_id][term])
        return []
