# Lyricist Search Engine

Lyricist is a high-performance song lyrics search engine featuring speech-to-text search, spelling auto-correction, and a minimalistic, editorial-style user interface. 

It is optimized for constrained server environments (such as Render's 512MB RAM tier) by utilizing a dual-mode index manager: high-performance SQLite index streaming for production deployments and modular inverted index barrels partitioning for development.

## Demo Links

- **Live Frontend**: [lyricist-frontend.vercel.app](https://lyricist-frontend.vercel.app)
- **Live Backend API**: [lyricist-backend-i4iy.onrender.com](https://lyricist-backend-i4iy.onrender.com)

## Key Features

- **Hybrid Ranking Engine**: Integrates term frequency, field weighting, and positional index data to search and rank songs.
- **Speech-to-Text Search**: Ingests microphone audio queries, transcribes them using AssemblyAI, and queries the search index.
- **Spelling Auto-Correction**: Utilizes a character-bigram fuzzy matcher to suggest correct searches for misspelled queries.
- **Dynamic Index Updates**: Supports real-time addition of new songs via atomic API writes without full-index rebuilds.
- **Memory Optimized**: SQLite streaming mode loads data on demand, reducing the active memory footprint to under 40MB.
- **Minimalist Editorial UI**: Designed with a clean, high-contrast, brutalist style using thin lines and structural layout grids.

## System Architecture

Lyricist is structured as a decoupled web application with two core components:
1. **Frontend (`/frontend`)**: A React SPA built with Vite, utilizing responsive Tailwind CSS, custom layout borders, search history tracking, and WebRTC audio recorder APIs.
2. **Backend (Root)**: A Flask REST API that interacts with the custom `search_engine` Python package.

### Directory Structure

```text
├── LICENSE                      # MIT License
├── README.md                    # Core project documentation
├── server.py                    # Flask REST API implementation
├── speech.py                    # Audio transcription handler (AssemblyAI)
├── main.py                      # Core index building entrypoint
├── search.py                    # Compatibility/CLI search script
├── requirements.txt             # Python backend dependencies
├── .gitignore                   # Version control exclusions
│
├── search_engine/               # Core search engine modules
│   ├── __init__.py              # Barrel file exposing engine components
│   ├── preprocessor.py          # Tokenizer, stopword filter, and lemmatizer
│   ├── lexicon.py               # Vocabulary & word-to-id dictionary
│   ├── barrels.py               # Multi-barrel partitioning manager
│   ├── index.py                 # Forward and inverted index structures
│   ├── spelling.py              # Bigram fuzzy speller autocorrect
│   ├── sqlite_index.py          # High-performance SQLite engine manager
│   └── searcher.py              # Hybrid ranking and search evaluator
│
├── scripts/                     # Helper & migration scripts
│   ├── convert_to_sqlite.py     # Generates SQLite index (details.db) from CSVs
│   ├── kaggle_preprocess.py     # Cleans and formats raw Kaggle song datasets
│   ├── download_index.py        # Helper to fetch pre-built datasets/indexes
│   └── processjson.py           # Helper for metadata JSON structuring
│
└── frontend/                    # React SPA project folder
```

## Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+ (for frontend)

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AbdurRehman-eng/Lyricist-backend.git
   cd Lyricist-backend
   ```

2. **Create a virtual environment and install dependencies**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Download NLTK Corpora**:
   The preprocessor requires NLTK text processing datasets. Run the following command:
   ```bash
   python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('punkt_tab')"
   ```

4. **Environment Variables**:
   Create a `.env` file in the root folder with your AssemblyAI API key for speech search support:
   ```env
   ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
   ```

5. **Start the server**:
   ```bash
   python server.py
   ```
   The backend server will run on `http://127.0.0.1:5000`.

## API Endpoints

### 1. `GET /search`
Searches for songs using lyrics, title, album, or artist.
- **Parameters**:
  - `query` (string, required): The search text.
- **Response**:
  ```json
  {
    "query": "hello darkness",
    "final_results": [...],
    "ranked_results": [
      {
        "doc_id": 482,
        "spotify_id": "4j5t3...",
        "name": "The Sound of Silence",
        "artists": "Simon & Garfunkel",
        "album_name": "Sounds of Silence"
      }
    ]
  }
  ```

### 2. `POST /add_document`
Dynamically indexes and appends a new song to the search database.
- **Body**:
  ```json
  {
    "id": "spotify_track_id",
    "name": "Song Name",
    "album_name": "Album Title",
    "artists": "Artist Name",
    "lyrics": "Full song lyrics go here..."
  }
  ```
- **Response**:
  ```json
  {
    "message": "Document added successfully",
    "doc_id": 960841
  }
  ```

### 3. `POST /transcribe`
Transcribes uploaded audio recordings and queries the index.
- **Multipart Form**:
  - `audio` (MP3/WAV file): The recorded query.
- **Response**:
  ```json
  {
    "transcription": "stairway to heaven",
    "query": "stairway to heaven",
    "final_results": [...],
    "ranked_results": [...]
  }
  ```

### 4. `GET /songs`
Retrieves paginated lists of all songs.
- **Parameters**:
  - `page` (int, optional): Default `1`.
  - `limit` (int, optional): Default `15`.
  - `search` (string, optional): Live query filter.

### 5. `GET /popular_searches`
Retrieves top-performing queries based on local query traffic history.

## Contributing

Contributions are welcome! To contribute:
1. Fork the Project.
2. Create a Feature Branch (`git checkout -b feature/NewFeature`).
3. Commit your Changes (`git commit -m 'Add NewFeature'`).
4. Push to the Branch (`git push origin feature/NewFeature`).
5. Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` for more information.
