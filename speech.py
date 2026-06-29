import requests
import time
import os
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(dotenv_path='.env.local')

# Replace with your AssemblyAI API key
API_KEY = os.getenv("ASSEMBLYAI_API_KEY")

# Upload audio file to AssemblyAI
def upload_audio(file_path):
    headers = {'authorization': API_KEY}
    with open(file_path, 'rb') as audio_file:
        response = requests.post(
            'https://api.assemblyai.com/v2/upload',
            headers=headers,
            data=audio_file
        )
    if response.status_code == 200:
        return response.json()['upload_url']
    else:
        raise Exception("Error uploading file: " + response.text)

# Request transcription
def request_transcription(audio_url):
    headers = {'authorization': API_KEY}
    json_data = {'audio_url': audio_url}
    response = requests.post(
        'https://api.assemblyai.com/v2/transcript',
        headers=headers,
        json=json_data
    )
    if response.status_code == 200:
        return response.json()['id']
    else:
        raise Exception("Error requesting transcription: " + response.text)

# Poll transcription status
def get_transcription(transcription_id):
    headers = {'authorization': API_KEY}
    url = f'https://api.assemblyai.com/v2/transcript/{transcription_id}'
    while True:
        response = requests.get(url, headers=headers)
        result = response.json()
        if result['status'] == 'completed':
            return result['text']
        elif result['status'] == 'failed':
            raise Exception("Transcription failed: " + result['error'])
        time.sleep(1)  # Wait for 1 second before polling again

# Main Function
def speech_to_text(file_path):
    print("Uploading audio...")
    audio_url = upload_audio(file_path)
    print("Audio uploaded. Requesting transcription...")
    transcription_id = request_transcription(audio_url)
    print("Transcription in progress...")
    text = get_transcription(transcription_id)
    print("Transcription completed!")
    return text
