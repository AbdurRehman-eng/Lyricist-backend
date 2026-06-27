"""
Text Preprocessing Module

Provides functions to clean, tokenize, normalize, and lemmatize text
for indexing and querying.
"""

import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Ensure required NLTK data is downloaded if not already present
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('punkt_tab')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

# Initialize Lemmatizer once at the module level
_lemmatizer = WordNetLemmatizer()

# Cache stopwords as a set for O(1) fast lookup
try:
    _stopwords_set = set(stopwords.words('english'))
except Exception:
    # Fallback in case stopwords didn't load correctly
    _stopwords_set = set()

def preprocess_text(text):
    """
    Preprocess text: lowercase, remove punctuation, tokenize, remove stopwords, and lemmatize.
    
    :param text: Input string to process.
    :return: List of preprocessed, lemmatized tokens.
    """
    if not isinstance(text, str):
        return []
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    
    # Tokenize text
    tokens = word_tokenize(text)
    
    # Remove stopwords and lemmatize remaining words
    cleaned_tokens = [
        _lemmatizer.lemmatize(word)
        for word in tokens
        if word not in _stopwords_set
    ]
    
    return cleaned_tokens

# Warm up NLTK lazily-loaded resources at import time
try:
    _lemmatizer.lemmatize("warmup")
    word_tokenize("warmup")
except Exception:
    pass

