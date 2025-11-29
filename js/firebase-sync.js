// firebase-sync.js - SHARED VERSION (FIXED)
class FirebaseSync {
    constructor() {
        this.isInitialized = false;
        this.isSyncing = false;
    }

    // Initialize Firebase
    initialize() {
        try {
            console.log('Starting Firebase initialization...');
            
            // Your Firebase configuration
            const firebaseConfig = {
                apiKey: "AIzaSyBztvDzbETHgerlY4mfDiKHpcVp73xKWNk",
                authDomain: "hisaab-kitaab-36cc1.firebaseapp.com",
                databaseURL: "https://hisaab-kitaab-36cc1-default-rtdb.asia-southeast1.firebasedatabase.app",
                projectId: "hisaab-kitaab-36cc1",
                storageBucket: "hisaab-kitaab-36cc1.firebasestorage.app",
                messagingSenderId: "745705132296",
                appId: "1:745705132296:web:0b8d430edad6e506971cbd"
            };

            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.database();
            
            this.isInitialized = true;
            console.log('Firebase initialized successfully');
            
            this.showSyncStatus('Connected to shared cloud', 'success');
            
            // Listen for real-time updates from other users
            this.setupRealTimeListener();
            
            // Load initial data from cloud
            this.loadFromCloud();
            
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.showSyncStatus('Cloud sync unavailable - ' + error.message, 'error');
        }
    }

    // Listen for real-time updates from other users
    setupRealTimeListener() {
        this.db.ref('sharedSheets').on('value', (snapshot) => {
            const cloudData = snapshot.val();
            console.log('Real-time update received:', cloudData);
            
            if (cloudData && Array.isArray(cloudData)) {
                this.replaceLocalData(cloudData);
                this.showSyncStatus('Sheet updated from cloud', 'info');
            }
        });
    }

    // Save data to shared cloud
    async saveToCloud(data) {
        if (!this.isInitialized || this.isSyncing) {
            console.log('Cannot sync - not ready');
            return;
        }
        
        try {
            this.isSyncing = true;
            this.showSyncStatus('Syncing to shared cloud...', 'syncing');
            
            console.log('Saving data to shared cloud...', data);
            await this.db.ref('sharedSheets').set(data);
            
            this.showSyncStatus('Synced to shared cloud', 'success');
            console.log('Data saved to shared cloud successfully');
            
        } catch (error) {
            console.error('Failed to save to shared cloud:', error);
            this.showSyncStatus('Sync failed: ' + error.message, 'error');
        } finally {
            this.isSyncing = false;
        }
    }

    // Load data from shared cloud
    async loadFromCloud() {
        if (!this.isInitialized) {
            console.log('Cannot load - not ready');
            return;
        }
        
        try {
            this.showSyncStatus('Loading shared sheets...', 'syncing');
            
            console.log('Loading data from shared cloud...');
            const snapshot = await this.db.ref('sharedSheets').once('value');
            const cloudData = snapshot.val();
            
            console.log('Shared cloud data received:', cloudData);
            
            if (cloudData && Array.isArray(cloudData)) {
                // Replace local data with shared data
                this.replaceLocalData(cloudData);
                this.showSyncStatus('Shared sheets loaded', 'success');
            } else {
                this.showSyncStatus('No shared sheets found', 'info');
            }
            
        } catch (error) {
            console.error('Failed to load from shared cloud:', error);
            this.showSyncStatus('Cloud load failed: ' + error.message, 'error');
        }
    }

    // Replace local data with shared data
    replaceLocalData(cloudData) {
        // Save shared data to localStorage
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(cloudData));
        
        // Refresh the UI
        if (window.loadSavedSheets) {
            window.loadSavedSheets();
        }
    }

    // Merge data (for backward compatibility)
    mergeData(cloudData) {
        console.log('mergeData called - using replaceLocalData instead');
        this.replaceLocalData(cloudData);
    }

    // Show sync status
    showSyncStatus(message, type = 'info') {
        let statusElement = document.getElementById('syncStatus');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'syncStatus';
            statusElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                z-index: 10000;
                max-width: 200px;
                text-align: center;
            `;
            document.body.appendChild(statusElement);
        }
        
        const colors = {
            success: '#d4edda',
            error: '#f8d7da', 
            warning: '#fff3cd',
            info: '#d1ecf1',
            syncing: '#e2e3e5'
        };
        
        const textColors = {
            success: '#155724',
            error: '#721c24',
            warning: '#856404',
            info: '#0c5460',
            syncing: '#383d41'
        };
        
        statusElement.style.backgroundColor = colors[type] || colors.info;
        statusElement.style.color = textColors[type] || textColors.info;
        statusElement.style.border = `1px solid ${textColors[type]}20`;
        statusElement.textContent = message;
        
        if (type === 'success') {
            setTimeout(() => {
                if (statusElement.textContent === message) {
                    statusElement.style.display = 'none';
                }
            }, 3000);
        }
    }

    // Manual sync trigger
    async manualSync() {
        if (!this.isInitialized) {
            this.showSyncStatus('Cloud sync not initialized', 'error');
            return;
        }
        
        const localData = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
        await this.saveToCloud(localData);
    }
}

// Create global instance
window.firebaseSync = new FirebaseSync();