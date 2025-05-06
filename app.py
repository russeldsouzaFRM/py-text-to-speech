import os
import logging
import tempfile
from flask import Flask, render_template, request, jsonify, send_file
from gtts import gTTS, lang
import uuid
from googletrans import Translator

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

# Create translator
translator = Translator()

# Get supported languages from gTTS
SUPPORTED_LANGUAGES = lang.tts_langs()

@app.route('/')
def index():
    # Get language options from gTTS
    languages = {code: name for code, name in SUPPORTED_LANGUAGES.items()}
    return render_template('index.html', languages=languages)

@app.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    try:
        text = request.form.get('text', '')
        language = request.form.get('language', 'en')
        speed = request.form.get('speed', False)
        translate = request.form.get('translate', 'false')
        
        # Validate input
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        if language not in SUPPORTED_LANGUAGES:
            return jsonify({'error': f'Language {language} is not supported'}), 400
        
        # Convert speed string to boolean
        slow = speed.lower() == 'true' if isinstance(speed, str) else bool(speed)
        
        # Convert translate string to boolean
        should_translate = translate.lower() == 'true' if isinstance(translate, str) else bool(translate)
        
        # Translate text if requested
        if should_translate:
            try:
                # Translate the text
                logging.debug(f"Translating text to language: {language}")
                translated = translator.translate(text, dest=language)
                text = translated.text
                logging.debug(f"Translated text: {text}")
            except Exception as e:
                logging.error(f"Translation error: {str(e)}")
                return jsonify({'error': f'Translation error: {str(e)}'}), 500
        
        # Create a unique filename
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(tempfile.gettempdir(), filename)
        
        # Generate the speech file
        tts = gTTS(text=text, lang=language, slow=slow)
        tts.save(filepath)
        
        # Return response with translated text if applicable
        response = {'file': filename}
        if should_translate:
            response['translated_text'] = text
            
        return jsonify(response)
    
    except Exception as e:
        logging.error(f"Error generating TTS: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>', methods=['GET'])
def download(filename):
    try:
        filepath = os.path.join(tempfile.gettempdir(), filename)
        
        # Check if the file exists
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        # Return the file
        return send_file(filepath, as_attachment=True, download_name="speech.mp3", mimetype="audio/mpeg")
    
    except Exception as e:
        logging.error(f"Error downloading file: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
