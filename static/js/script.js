document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const ttsForm = document.getElementById('tts-form');
    const textInput = document.getElementById('text');
    const languageSelect = document.getElementById('language');
    const speedSelect = document.getElementById('speed');
    const translateCheck = document.getElementById('translate-check');
    const audioPlayer = document.getElementById('audio-player');
    const audioPlayerCard = document.getElementById('audio-player-card');
    const translatedTextContainer = document.getElementById('translated-text-container');
    const translatedTextElement = document.getElementById('translated-text');
    const volumeControl = document.getElementById('volume');
    const downloadBtn = document.getElementById('download-btn');
    const errorMessage = document.getElementById('error-message');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Current audio file
    let currentAudioFile = null;

    // Event Listeners
    ttsForm.addEventListener('submit', handleFormSubmit);
    volumeControl.addEventListener('input', adjustVolume);
    downloadBtn.addEventListener('click', downloadAudio);

    // Handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Hide any previous error
        errorMessage.style.display = 'none';
        translatedTextContainer.style.display = 'none';
        
        // Get form values
        const text = textInput.value.trim();
        const language = languageSelect.value;
        const speed = speedSelect.value;
        const translate = translateCheck.checked;
        
        // Validate text input
        if (!text) {
            showError('Please enter some text to convert.');
            return;
        }
        
        try {
            // Show loading overlay
            loadingOverlay.style.display = 'flex';
            
            // Create form data
            const formData = new FormData();
            formData.append('text', text);
            formData.append('language', language);
            formData.append('speed', speed);
            formData.append('translate', translate);
            
            // Send request to server
            const response = await fetch('/text-to-speech', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to convert text to speech.');
            }
            
            // Update the audio player
            currentAudioFile = data.file;
            audioPlayer.src = `/download/${currentAudioFile}`;
            audioPlayer.load();
            
            // Show the audio player
            audioPlayerCard.style.display = 'block';
            
            // Display translated text if available
            if (data.translated_text && translate) {
                translatedTextElement.textContent = data.translated_text;
                translatedTextContainer.style.display = 'block';
            }
            
            // Auto-play the audio
            try {
                await audioPlayer.play();
            } catch (playError) {
                console.log('Auto-play prevented by browser. User needs to interact first.');
            }
            
        } catch (error) {
            showError(error.message);
        } finally {
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
        }
    }

    // Adjust volume
    function adjustVolume() {
        audioPlayer.volume = volumeControl.value;
    }

    // Download audio
    function downloadAudio() {
        if (currentAudioFile) {
            window.location.href = `/download/${currentAudioFile}`;
        } else {
            showError('No audio file to download.');
        }
    }

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
});
