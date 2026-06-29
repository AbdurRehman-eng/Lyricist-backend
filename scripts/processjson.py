import pandas as pd
import json

def create_details_json(data, output_file):
    """
    Create a details.json file with the name, doc_id, artists, and album_name of each song.
    
    :param data: List of dictionaries containing dataset rows with doc_id assigned.
    :param output_file: Path to the output JSON file.
    """
    details = []
    for row in data:
        details.append({
            "spotify_id": row.get("id"),
            "name": row.get("name", "Unknown") if pd.notna(row.get("name")) else "Unknown",
            "doc_id": row["doc_id"],
            "artists": row.get("artists", "Unknown") if pd.notna(row.get("artists")) else "Unknown",
            "album_name": row.get("album_name", "Unknown") if pd.notna(row.get("album_name")) else "Unknown"
        })
    with open(output_file, 'w') as f:
        json.dump(details, f, indent=4)
    print(f"Details saved to {output_file}.")

# Load preprocessed data with doc_id
def generate_details_json():
    # Assume this CSV was saved after processing in the forward index step
    file_path = "forward_index.csv"
    data = pd.read_csv(file_path).to_dict(orient="records")
    
    # Generate and save details.json
    create_details_json(data, "details.json")

if __name__ == "__main__":
    generate_details_json()
