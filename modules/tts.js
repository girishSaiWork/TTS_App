export class TTSModule {
    constructor() {
        this.synth = null;
        this.voices = [];
        this.currentWordIndex = 0;
        this.isPlaying = false;
    }

    async initialize() {
        console.log('Initializing TTSModule...');
        if ('speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
            await this.loadVoices();
        } else {
            throw new Error('Speech synthesis not supported in this browser');
        }
    }

    async loadVoices() {
        return new Promise((resolve, reject) => {
            let voices = this.synth.getVoices();
            if (voices.length > 0) {
                this.voices = voices;
                resolve();
            } else {
                this.synth.onvoiceschanged = () => {
                    voices = this.synth.getVoices();
                    if (voices.length > 0) {
                        this.voices = voices;
                        resolve();
                    } else {
                        reject(new Error('No voices available'));
                    }
                };
                // Set a timeout in case onvoiceschanged doesn't fire
                setTimeout(() => reject(new Error('Timeout waiting for voices')), 5000);
            }
        });
    }

    showTTSInterface() {
        console.log('Showing TTS interface...');
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            throw new Error('Main content element not found');
        }

        mainContent.innerHTML = `
            <div class="tts-container">
                <h2>Text to Speech</h2>
                <div id="text-display"></div>
                <textarea id="text-input" rows="5" placeholder="Enter text to convert to speech"></textarea>
                <select id="voice-select"></select>
                <div class="control-group">
                    <button id="play-pause-btn"><span class="material-icons">play_arrow</span> Play</button>
                    <button id="stop-btn"><span class="material-icons">stop</span> Stop</button>
                </div>
                <div class="slider-container">
                    <label for="speed">Speed</label>
                    <input type="range" id="speed" min="0.5" max="2" step="0.1" value="1">
                </div>
                <div class="slider-container">
                    <label for="volume">Volume</label>
                    <input type="range" id="volume" min="0" max="1" step="0.1" value="1">
                </div>
            </div>
        `;

        this.populateVoiceList();
        this.attachEventListeners();
        this.updateTextDisplay();
        console.log('TTS interface loaded successfully');
    }

    populateVoiceList() {
        const voiceSelect = document.getElementById('voice-select');
        voiceSelect.innerHTML = '';
        this.voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        });
        
        if (this.voices.length > 0) {
            voiceSelect.selectedIndex = 0;
        }
    }

    attachEventListeners() {
        document.getElementById('play-pause-btn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('stop-btn').addEventListener('click', () => this.stop());
        document.getElementById('text-input').addEventListener('input', () => this.updateTextDisplay());
    }

    togglePlayPause() {
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (this.isPlaying) {
            this.pause();
            playPauseBtn.innerHTML = '<span class="material-icons">play_arrow</span> Play';
        } else {
            this.play();
            playPauseBtn.innerHTML = '<span class="material-icons">pause</span> Pause';
        }
        this.isPlaying = !this.isPlaying;
    }

    play() {
        if (this.synth.speaking && this.synth.paused) {
            this.synth.resume();
        } else if (!this.synth.speaking) {
            const textInput = document.getElementById('text-input');
            const voiceSelect = document.getElementById('voice-select');
            const speedInput = document.getElementById('speed');
            const volumeInput = document.getElementById('volume');

            if (textInput.value) {
                this.updateTextDisplay();
                const words = textInput.value.split(/\s+/);
                this.currentWordIndex = 0;

                const utterance = new SpeechSynthesisUtterance(textInput.value);
                
                if (voiceSelect.selectedIndex !== -1) {
                    utterance.voice = this.voices[voiceSelect.selectedIndex];
                }
                
                utterance.rate = parseFloat(speedInput.value);
                utterance.volume = parseFloat(volumeInput.value);

                let lastWordIndex = 0;
                utterance.onboundary = (event) => {
                    const wordIndex = Math.floor(event.charIndex / 5);
                    if (wordIndex > lastWordIndex) {
                        this.highlightWord(wordIndex);
                        lastWordIndex = wordIndex;
                    }
                };

                utterance.onend = () => {
                    this.resetHighlight();
                    this.isPlaying = false;
                    document.getElementById('play-pause-btn').innerHTML = '<span class="material-icons">play_arrow</span> Play';
                };

                try {
                    this.synth.speak(utterance);
                } catch (error) {
                    console.error('Error during speech synthesis:', error);
                }
            }
        }
    }

    highlightWord(index) {
        this.resetHighlight();
        const wordElement = document.getElementById(`word-${index}`);
        if (wordElement) {
            wordElement.style.backgroundColor = '#FFFF00'; // Bright yellow background
            wordElement.style.color = '#000000'; // Black text
            wordElement.style.padding = '0 2px'; // Add some padding
            wordElement.style.borderRadius = '3px'; // Rounded corners
        }
    }

    resetHighlight() {
        const textDisplay = document.getElementById('text-display');
        textDisplay.querySelectorAll('span').forEach(span => {
            span.style.backgroundColor = '';
            span.style.color = '';
            span.style.padding = '';
            span.style.borderRadius = '';
        });
    }

    pause() {
        if (this.synth.speaking) {
            this.synth.pause();
        }
    }

    stop() {
        this.synth.cancel();
        this.resetHighlight();
        this.isPlaying = false;
        document.getElementById('play-pause-btn').innerHTML = '<span class="material-icons">play_arrow</span> Play';
    }

    updateTextDisplay() {
        const textInput = document.getElementById('text-input');
        const textDisplay = document.getElementById('text-display');
        const words = textInput.value.split(/\s+/);
        textDisplay.innerHTML = words.map((word, index) => 
            `<span id="word-${index}">${word}</span>`
        ).join(' ');
    }
}