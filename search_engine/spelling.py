"""
Spelling Correction & Fuzzy Matching Module

Provides high-performance spelling correction using a character-bigram inverted index.
Avoids slow linear scans over the entire lexicon.
"""

from collections import defaultdict
import difflib

class BigramFuzzyMatcher:
    """
    Blazing fast fuzzy spelling correction using character bigrams to narrow down 
    candidates before calculating sequence similarity.
    """
    def __init__(self, words):
        """
        Initialize the matcher with a list of lexicon words.
        
        :param words: List of words (strings) from the lexicon.
        """
        # Maintain a set of words for O(1) exact match lookup
        self.word_set = set(words)
        # Store index mapping to candidate words
        self.words_list = list(self.word_set)
        
        # Map character bigrams to lists of indices in self.words_list
        self.bigram_index = defaultdict(list)
        for idx, word in enumerate(self.words_list):
            for bg in self._get_bigrams(word):
                self.bigram_index[bg].append(idx)

    def _get_bigrams(self, word):
        """
        Generate unique character bigrams for a given word.
        """
        return {word[i:i+2] for i in range(len(word)-1)}

    def add_word(self, word):
        """
        Dynamically add a new word to the matcher's index in real-time.
        Useful when adding new documents without restarting the server.
        
        :param word: The new word term to add.
        """
        if not isinstance(word, str) or not word:
            return
        
        if word not in self.word_set:
            self.word_set.add(word)
            self.words_list.append(word)
            new_idx = len(self.words_list) - 1
            
            # Index new bigrams
            for bg in self._get_bigrams(word):
                self.bigram_index[bg].append(new_idx)

    def fuzzy_match(self, term, threshold=0.7):
        """
        Fuzzy match a term to the closest term in the lexicon.
        
        - If the term is already present in the lexicon (exact match), it is returned immediately.
        - Otherwise, candidates with high bigram overlap are retrieved and scored.
        
        :param term: The query term to fuzzy match.
        :param threshold: The similarity threshold (between 0.0 and 1.0) for matching.
        :return: The closest matching lexicon term, or the original term if no good match is found.
        """
        if not isinstance(term, str) or not term:
            return term
        
        # 1. Exact match bypass (O(1) lookup)
        if term in self.word_set:
            return term
        
        # 2. Generate bigrams for query term
        term_bigrams = self._get_bigrams(term)
        if not term_bigrams:
            return term
            
        # 3. Retrieve candidates and count bigram overlaps
        candidate_counts = defaultdict(int)
        for bg in term_bigrams:
            for idx in self.bigram_index.get(bg, []):
                candidate_counts[idx] += 1
                
        if not candidate_counts:
            return term
            
        # 4. Filter candidates to only those with substantial bigram overlap
        max_overlap = max(candidate_counts.values())
        min_overlap_threshold = max(2, int(max_overlap * 0.5))
        
        candidates = [
            self.words_list[idx] 
            for idx, count in candidate_counts.items() 
            if count >= min_overlap_threshold
        ]
        
        if not candidates:
            return term
            
        # 5. Calculate precise sequence similarity on the narrowed-down candidate pool
        best_matches = difflib.get_close_matches(term, candidates, n=1, cutoff=threshold)
        return best_matches[0] if best_matches else term
