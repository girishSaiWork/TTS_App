import { TTSModule } from './modules/tts.js';

class App {
    constructor() {
        this.initializeApp();
    }

    async initializeApp() {
        console.log('Initializing app...');
        try {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) {
                throw new Error('Main content element not found');
            }

            mainContent.innerHTML = '<p>Loading Text-to-Speech interface...</p>';

            this.ttsModule = new TTSModule();
            await this.ttsModule.initialize();
            this.ttsModule.showTTSInterface();
            console.log('TTS interface loaded successfully');
        } catch (error) {
            console.error('Error initializing TTS module:', error);
            this.showErrorMessage(`Failed to load the Text-to-Speech interface: ${error.message}`);
        }
    }

    showErrorMessage(message) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `<p style="color: red;">${message}</p>`;
        } else {
            console.error('Main content element not found');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new App();
});