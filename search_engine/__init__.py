"""
Search Engine Package

A modular, high-performance search engine implementation utilizing
forward & inverted indexing, barrels partitioning, character-bigram spell correction,
and hybrid relevancy ranking.
"""

from .preprocessor import preprocess_text
from .lexicon import create_lexicon, load_lexicon, save_lexicon
from .barrels import Barrels
from .index import InvertedIndex, create_forward_index, create_details_json
from .spelling import BigramFuzzyMatcher
from .searcher import HybridSearchEngine

__all__ = [
    'preprocess_text',
    'create_lexicon',
    'load_lexicon',
    'save_lexicon',
    'Barrels',
    'InvertedIndex',
    'create_forward_index',
    'create_details_json',
    'BigramFuzzyMatcher',
    'HybridSearchEngine'
]
