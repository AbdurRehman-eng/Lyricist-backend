from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from search import HybridSearchEngine, lexicon,doc_id_to_details
from inverted_index import InvertedIndex
from speech import speech_to_text
import json
import csv
from lexicon import preprocess_text
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS

# Initialize inverted index and load barrels from CSV files
inverted_index = InvertedIndex()
inverted_index.load_from_barrels(r".\barrels")  # Load barrels from folder

# Initialize hybrid search engine
hybrid_engine = HybridSearchEngine(inverted_index, lexicon)

@app.route('/search')
def search():
    hybrid_engine = HybridSearchEngine(inverted_index, lexicon)
    query = request.args.get('query', '')
    if not query:
        return jsonify({"error": "No query provided"}), 400

    # Perform hybrid search
    final_results, ranked_results = hybrid_engine.search(query.lower())

    # Map document IDs to details
    final_results_details = hybrid_engine.map_doc_ids_to_details(final_results)
    ranked_results_details = hybrid_engine.map_ranked_results_to_details(ranked_results)

    # Return results as JSON
    return jsonify({
        "query": query,
        "final_results": final_results_details,
        "ranked_results": ranked_results_details
    })
@app.route('/add_document', methods=['POST'])
def add_document():
    try:
        # Step 1: Parse request data
        data = request.json
        required_fields = ["id", "name", "album_name", "artists", "lyrics"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": f"Missing required fields. Required: {required_fields}"}), 400

        # Step 2: Append to songs.csv
        csv_file = "songs.csv"
        new_song_data = {
            "id": data["id"],
            "name": data["name"],
            "album_name": data["album_name"],
            "artists": data["artists"],
            # Optional fields with default values
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

        # Step 3: Update the Lexicon
        tokens = preprocess_text(data["lyrics"] + " " + data["name"] + " " + data["album_name"] + " " + data["artists"])
        new_tokens = [token for token in tokens if token not in lexicon]

        for token in new_tokens:
            lexicon[token] = len(lexicon) + 1

        # Save updated lexicon to CSV
        pd.DataFrame(list(lexicon.items()), columns=["Term", "Word IDs"]).to_csv("lexicon.csv", index=False)

        # Step 4: Update Forward Index
        forward_index_file = "forward_index.csv"
        forward_index_df = pd.read_csv(forward_index_file)
        new_doc_id = int(forward_index_df["Document ID"].max() + 1)

        # Create a set of unique terms from the tokens
        unique_terms = set(tokens)

        # Add the new row with terms as a string and document ID
        new_row = pd.DataFrame([{"Document ID": new_doc_id, "Terms": str(list(unique_terms))}])
        forward_index_df = pd.concat([forward_index_df, new_row], ignore_index=True)
        forward_index_df.to_csv(forward_index_file, index=False)

        # Step 5: Update Inverted Index Barrels
        for term in unique_terms:
            word_id = lexicon.get(term)
            if word_id is not None:
                inverted_index.barrels.add_to_barrel(term, word_id, {new_doc_id})

        inverted_index.save_to_barrels("barrels")

        # Step 6: Update Inverted Index CSV
        inverted_index_csv_file = "inverted_index.csv"
        existing_inverted_index = {}
        try:
            with open(inverted_index_csv_file, mode='r', newline='', encoding='utf-8') as file:
                reader = csv.reader(file)
                header = next(reader)
                for row in reader:
                    if len(row) == 2:
                        term, doc_ids_str = row
                        doc_ids = set(map(int, doc_ids_str.split(","))) if doc_ids_str else set()
                        existing_inverted_index[term] = doc_ids
        except Exception as e:
            print(f"Error reading existing inverted index: {e}")

        # Update with new terms and new doc id
        for term in unique_terms:
            if term not in existing_inverted_index:
                existing_inverted_index[term] = set()
            existing_inverted_index[term].add(new_doc_id)

        # Save back to inverted_index.csv
        with open(inverted_index_csv_file, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(["Term", "Document IDs"])
            for term, doc_ids in existing_inverted_index.items():
                writer.writerow([term, ",".join(map(str, sorted(doc_ids)))])

        # Step 7: Update details.json
        details_file = "details.json"
        new_details = {
            "spotify_id": data["id"],
            "name": data["name"],
            "doc_id": new_doc_id,
            "artists": data["artists"],
            "album_name": data["album_name"],
        }

        try:
            with open(details_file, "r", encoding="utf-8") as file:
                details_data = json.load(file)
        except FileNotFoundError:
            details_data = []

        details_data.append(new_details)

        # Ensure JSON serializability
        for item in details_data:
            for key, value in item.items():
                if isinstance(value, (np.int64, np.float64)):
                    item[key] = int(value) if isinstance(value, np.int64) else float(value)

        with open(details_file, "w", encoding="utf-8") as file:
            json.dump(details_data, file, ensure_ascii=False, indent=4)

        # Update the in-memory mapping of document IDs to details
        # Directly update doc_id_to_details in memory
        doc_id_to_details[new_doc_id] = new_details

        # Return success message with the new document ID
        return jsonify({"message": "Document added successfully", "doc_id": new_doc_id}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files['audio']
    file_path = 'audio.mp3'
    audio_file.save(file_path)

    try:
        transcript = speech_to_text(file_path)
        os.remove(file_path)  # Delete the file after transcription

        # Perform hybrid search using the transcription as the query
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
            os.remove(file_path)  # Ensure the file is deleted in case of an error
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)