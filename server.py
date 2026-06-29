"""
Lyrica Search Engine Server

Flask API providing endpoints for searching songs, adding new song documents,
and transcribing voice queries.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import csv
import pandas as pd
import numpy as np

from search_engine import (
    HybridSearchEngine,
    InvertedIndex,
    preprocess_text,
    load_lexicon,
    save_lexicon
)
from speech import speech_to_text

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

SEARCH_HISTORY_FILE = "search_history.json"

def load_search_history():
    if os.path.exists(SEARCH_HISTORY_FILE):
        try:
            with open(SEARCH_HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_search_history(history):
    try:
        with open(SEARCH_HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Error saving search history: {e}")

# 1. Load Lexicon
lexicon = load_lexicon("lexicon.csv")

# 2. Load Details mapping
try:
    with open("details.json", "r", encoding="utf-8") as f:
        details = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    details = []
doc_id_to_details = {item["doc_id"]: item for item in details}

# 3. Load Inverted Index and Barrels
inverted_index = InvertedIndex()
try:
    inverted_index.load_from_barrels(r".\barrels")
except Exception as e:
    print(f"Warning: Could not load index barrels: {e}")

# 4. Initialize Global Hybrid Search Engine
hybrid_engine = HybridSearchEngine(inverted_index, lexicon, doc_id_to_details)


@app.route('/search')
def search():
    """
    Perform a hybrid search query.
    """
    query = request.args.get('query', '')
    if not query:
        return jsonify({"error": "No query provided"}), 400

    # Track search query count
    normalized_query = query.strip().lower()
    if normalized_query:
        history = load_search_history()
        history[normalized_query] = history.get(normalized_query, 0) + 1
        save_search_history(history)

    # Perform hybrid search
    final_results, ranked_results = hybrid_engine.search(query.lower())

    # Map document IDs to metadata details
    final_results_details = hybrid_engine.map_doc_ids_to_details(final_results)
    ranked_results_details = hybrid_engine.map_ranked_results_to_details(ranked_results)

    return jsonify({
        "query": query,
        "final_results": final_results_details,
        "ranked_results": ranked_results_details
    })


@app.route('/popular_searches')
def popular_searches():
    """
    Get the top most searched queries.
    """
    history = load_search_history()
    sorted_history = sorted(history.items(), key=lambda x: x[1], reverse=True)
    top_queries = [item[0] for item in sorted_history[:4]]
    
    # Pad with defaults if less than 4
    defaults = ["i will always love you", "hotel california", "blinding lights", "sad indie heartbreak"]
    for default in defaults:
        if len(top_queries) >= 4:
            break
        if default not in top_queries:
            top_queries.append(default)
            
    return jsonify(top_queries)


@app.route('/add_document', methods=['POST'])
def add_document():
    """
    Index and add a new song document to the system dynamically.
    """
    try:
        data = request.json
        required_fields = ["id", "name", "album_name", "artists", "lyrics"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": f"Missing required fields. Required: {required_fields}"}), 400

        # Step 1: Append to songs.csv
        csv_file = "songs.csv"
        new_song_data = {
            "id": data["id"],
            "name": data["name"],
            "album_name": data["album_name"],
            "artists": data["artists"],
            "danceability": float(data.get("danceability", 0.0)),
            "energy": float(data.get("energy", 0.0)),
            "key": int(data.get("key", 0)),
            "loudness": float(data.get("loudness", 0.0)),
            "mode": int(data.get("mode", 0)),
            "speechiness": float(data.get("speechiness", 0.0)),
            "acousticness": float(data.get("acousticness", 0.0)),
            "instrumentalness": float(data.get("instrumentalness", 0.0)),
            "liveness": float(data.get("liveness", 0.0)),
            "valence": float(data.get("valence", 0.0)),
            "tempo": float(data.get("tempo", 0.0)),
            "duration_ms": int(data.get("duration_ms", 0)),
            "lyrics": data["lyrics"]
        }

        with open(csv_file, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=new_song_data.keys())
            writer.writerow(new_song_data)

        # Step 2: Update lexicon in-memory and save to disk
        combined_text = f"{data['lyrics']} {data['name']} {data['album_name']} {data['artists']}"
        tokens = preprocess_text(combined_text)
        new_tokens = [token for token in tokens if token not in lexicon]

        for token in new_tokens:
            lexicon[token] = len(lexicon) + 1
            # Real-time update to the in-memory spell checker
            hybrid_engine.spelling_matcher.add_word(token)

        save_lexicon(lexicon, "lexicon.csv")

        # Step 3: Update Forward Index
        forward_index_file = "forward_index.csv"
        if os.path.exists(forward_index_file) and os.path.getsize(forward_index_file) > 0:
            try:
                forward_index_df = pd.read_csv(forward_index_file)
                new_doc_id = int(forward_index_df["Document ID"].max() + 1)
            except Exception as e:
                return jsonify({"error": f"Failed to read existing forward index: {str(e)}"}), 500
        else:
            new_doc_id = 1
            forward_index_df = pd.DataFrame(columns=["Document ID", "Terms"])

        unique_terms = set(tokens)
        new_row = pd.DataFrame([{"Document ID": new_doc_id, "Terms": str(list(unique_terms))}])
        forward_index_df = pd.concat([forward_index_df, new_row], ignore_index=True)
        forward_index_df.to_csv(forward_index_file, index=False)

        # Step 4: Update Inverted Index Barrels
        for term in unique_terms:
            word_id = lexicon.get(term)
            if word_id is not None:
                inverted_index.barrels.add_to_barrel(term, word_id, {new_doc_id})

        inverted_index.save_to_barrels("barrels")

        # Step 5: Update Inverted Index CSV
        inverted_index_csv_file = "inverted_index.csv"
        existing_inverted_index = {}
        if os.path.exists(inverted_index_csv_file) and os.path.getsize(inverted_index_csv_file) > 0:
            try:
                with open(inverted_index_csv_file, mode='r', newline='', encoding='utf-8') as file:
                    reader = csv.reader(file)
                    next(reader, None)  # Skip header
                    for row in reader:
                        if len(row) == 2:
                            term, doc_ids_str = row
                            doc_ids = set(map(int, doc_ids_str.split(","))) if doc_ids_str else set()
                            existing_inverted_index[term] = doc_ids
            except Exception as e:
                return jsonify({"error": f"Failed to read existing inverted index: {str(e)}"}), 500

        for term in unique_terms:
            if term not in existing_inverted_index:
                existing_inverted_index[term] = set()
            existing_inverted_index[term].add(new_doc_id)

        with open(inverted_index_csv_file, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(["Term", "Document IDs"])
            for term, doc_ids in sorted(existing_inverted_index.items()):
                writer.writerow([term, ",".join(map(str, sorted(doc_ids)))])

        # Step 6: Update details.json and in-memory mappings
        details_file = "details.json"
        new_details = {
            "spotify_id": data["id"],
            "name": data["name"],
            "doc_id": new_doc_id,
            "artists": data["artists"],
            "album_name": data["album_name"],
        }

        if os.path.exists(details_file) and os.path.getsize(details_file) > 0:
            try:
                with open(details_file, "r", encoding="utf-8") as file:
                    details_data = json.load(file)
            except Exception as e:
                return jsonify({"error": f"Failed to parse details.json: {str(e)}"}), 500
        else:
            details_data = []

        details_data.append(new_details)

        # Ensure types are standard JSON serializable
        for item in details_data:
            for key, value in item.items():
                if isinstance(value, (np.int64, np.float64)):
                    item[key] = int(value) if isinstance(value, np.int64) else float(value)

        with open(details_file, "w", encoding="utf-8") as file:
            json.dump(details_data, file, ensure_ascii=False, indent=4)

        # Update in-memory mappings
        doc_id_to_details[new_doc_id] = new_details
        hybrid_engine.update_doc_details(new_doc_id, new_details)

        return jsonify({"message": "Document added successfully", "doc_id": new_doc_id}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Transcribe audio request and search the results.
    """
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files['audio']
    file_path = 'audio.mp3'
    audio_file.save(file_path)

    try:
        transcript = speech_to_text(file_path)
        if os.path.exists(file_path):
            os.remove(file_path)

        # Track search query count
        normalized_query = transcript.strip().lower()
        if normalized_query:
            history = load_search_history()
            history[normalized_query] = history.get(normalized_query, 0) + 1
            save_search_history(history)

        # Perform hybrid search using transcription
        final_results, ranked_results = hybrid_engine.search(transcript.lower())

        # Map document IDs to details
        final_results_details = hybrid_engine.map_doc_ids_to_details(final_results)
        ranked_results_details = hybrid_engine.map_ranked_results_to_details(ranked_results)

        return jsonify({
            "transcription": transcript,
            "query": transcript,
            "final_results": final_results_details,
            "ranked_results": ranked_results_details
        })
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)