"""
Hybrid Search Engine Module

Combines Boolean search, phrase search, and ranked term-frequency search 
with optimized spelling correction.
"""

import re
from collections import defaultdict
from .preprocessor import preprocess_text

class HybridSearchEngine:
    """
    Search engine coordinating boolean query operations, phrase queries,
    spelling suggestions, and TF-based relevance ranking.
    """
    def __init__(self, inverted_index, lexicon, doc_id_to_details=None):
        """
        Initialize the search engine.
        
        :param inverted_index: Loaded InvertedIndex instance.
        :param lexicon: Lexicon dictionary mapping terms to word IDs.
        :param doc_id_to_details: Dict mapping document IDs to details.
        """
        self.inverted_index = inverted_index
        self.lexicon = lexicon
        self.doc_id_to_details = doc_id_to_details if doc_id_to_details is not None else {}
        
        # Import matcher here to avoid circular dependencies
        from .spelling import BigramFuzzyMatcher
        self.spelling_matcher = BigramFuzzyMatcher(list(lexicon.keys()))

    def update_doc_details(self, doc_id, details):
        """
        Update the doc details map in-memory when new documents are added.
        """
        self.doc_id_to_details[doc_id] = details

    def parse_query(self, query):
        """
        Parse query into phrases (quoted text) and individual search terms.
        
        :param query: Raw search query string.
        :return: Tuple of (phrases_list, terms_list).
        """
        # Find all terms inside double quotes
        phrases = re.findall(r'"(.*?)"', query)
        # Remove phrases from query and split remainder by whitespace
        terms = re.sub(r'"(.*?)"', "", query).split()
        return phrases, terms

    def phrase_search(self, phrase):
        """
        Perform a phrase search (intersection of preprocessed terms in phrase).
        
        :param phrase: Quoted phrase string.
        :return: Set of document IDs.
        """
        words = preprocess_text(phrase)
        if not words:
            return set()
        
        if len(words) < 2:
            return set(self.inverted_index.search(words[0], self.lexicon))

        # Perform intersection of posting lists for all words in phrase
        result_docs = set(self.inverted_index.search(words[0], self.lexicon))
        for word in words[1:]:
            next_docs = set(self.inverted_index.search(word, self.lexicon))
            result_docs &= next_docs
            
        return result_docs

    def boolean_search(self, terms):
        """
        Perform Boolean search using AND, OR, and NOT operators.
        
        :param terms: List of terms including Boolean operators.
        :return: Set of document IDs.
        """
        result_set = set()
        current_operator = "AND"
        is_first_term = True

        for term in terms:
            upper_term = term.upper()
            if upper_term in ["AND", "OR", "NOT"]:
                current_operator = upper_term
            else:
                # Preprocess search term to match lexicon format
                proc = preprocess_text(term)
                if not proc:
                    continue
                search_term = proc[0]
                
                term_docs = set(self.inverted_index.search(search_term, self.lexicon))
                
                if is_first_term:
                    result_set = term_docs
                    is_first_term = False
                else:
                    if current_operator == "AND":
                        result_set &= term_docs
                    elif current_operator == "OR":
                        result_set |= term_docs
                    elif current_operator == "NOT":
                        result_set -= term_docs
                        
        return result_set

    def ranked_search(self, query_terms):
        """
        Score and rank documents containing query terms based on Term Frequency (TF).
        
        :param query_terms: List of preprocessed terms.
        :return: List of sorted (doc_id, score) tuples.
        """
        doc_scores = defaultdict(float)
        for term in query_terms:
            if term in self.lexicon:
                term_docs = self.inverted_index.search(term, self.lexicon)
                
                # Check format of returned posting lists
                if isinstance(term_docs, list):
                    for doc_id in term_docs:
                        doc_scores[doc_id] += 1.0  # TF score increment
                elif isinstance(term_docs, dict):
                    # In case index format supports positions in the future
                    idf = 1.0
                    for doc_id, positions in term_docs.items():
                        tf = len(positions)
                        doc_scores[doc_id] += tf * idf
                        
        return sorted(doc_scores.items(), key=lambda x: x[1], reverse=True)

    def search(self, query):
        """
        Perform a hybrid search combining Boolean, phrase, fuzzy spelling, and ranking.
        Unifies and aligns the result sets to support reliable UI rendering and pagination.
        
        :param query: Input query string.
        :return: Tuple of (list of doc_ids, list of (doc_id, score) tuples).
        """
        phrases, terms = self.parse_query(query)

        # 1. Retrieve phrase search matches
        phrase_results = set()
        for phrase in phrases:
            phrase_results |= self.phrase_search(phrase)

        # 2. Retrieve boolean search matches
        boolean_results = self.boolean_search(terms)
        
        # Combine all exact matches
        exact_match_docs = phrase_results | boolean_results

        # 3. Fuzzy spelling match terms
        fuzzy_terms = []
        for term in terms:
            if term.upper() not in ["AND", "OR", "NOT"]:
                proc = preprocess_text(term)
                if proc:
                    # Get closest spelling correction
                    fuzzy_terms.append(self.spelling_matcher.fuzzy_match(proc[0]))

        # 4. Perform ranked search on spelling-corrected query terms
        ranked_results = self.ranked_search(fuzzy_terms)

        # 5. Unify results and apply exact-match scoring boost
        unified_scores = {}
        for doc_id, score in ranked_results:
            unified_scores[doc_id] = score

        # Add any boolean/phrase matches not captured by fuzzy ranked search
        for doc_id in exact_match_docs:
            if doc_id not in unified_scores:
                unified_scores[doc_id] = 0.0
            # Apply relevance boost for exact term matching
            unified_scores[doc_id] += 10.0

        # Sort the unified results list by relevance score descending
        final_ranked = sorted(unified_scores.items(), key=lambda x: x[1], reverse=True)
        final_doc_ids = [doc_id for doc_id, _ in final_ranked]

        return final_doc_ids, final_ranked

    def map_doc_ids_to_details(self, doc_ids):
        """
        Map list of doc IDs to their corresponding metadata details.
        """
        return [
            self.doc_id_to_details.get(
                doc_id, 
                {"id": "unknown", "name": "Unknown", "artists": "Unknown", "album_name": "Unknown"}
            ) 
            for doc_id in doc_ids
        ]

    def map_ranked_results_to_details(self, ranked_results):
        """
        Map list of ranked results tuples to (details, score) tuples.
        """
        return [
            (
                self.doc_id_to_details.get(
                    doc_id, 
                    {"id": "unknown", "name": "Unknown", "artists": "Unknown", "album_name": "Unknown"}
                ), 
                score
            ) 
            for doc_id, score in ranked_results
        ]
