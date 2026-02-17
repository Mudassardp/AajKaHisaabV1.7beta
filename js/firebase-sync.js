// firebase-sync.js - v2.2 with Profile Image and Profile Data Sync
class FirebaseSync {
    constructor() {
        this.isInitialized = false;
        this.isSyncing = false;
    }

    // Initialize Firebase
    initialize() {
        try {
            console.log('Starting Firebase initialization v2.2 with Profile Sync...');
            
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
            this.storage = firebase.storage();
            
            this.isInitialized = true;
            console.log('Firebase initialized successfully v2.2 with Profile Sync');
            
            this.showSyncStatus('Connected to shared cloud', 'success');
            
            // Listen for real-time updates for sheets
            this.setupSheetsRealTimeListener();
            
            // Listen for real-time updates for profiles
            this.setupProfilesRealTimeListener();
            
            // Load initial data from cloud
            this.loadSheetsFromCloud();
            this.loadProfilesFromCloud();
            
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.showSyncStatus('Cloud sync unavailable - ' + error.message, 'error');
        }
    }

    // Listen for real-time updates for sheets from other users
    setupSheetsRealTimeListener() {
        this.db.ref('sharedSheets').on('value', (snapshot) => {
            const cloudData = snapshot.val();
            console.log('Real-time sheets update received:', cloudData);
            
            if (cloudData && Array.isArray(cloudData)) {
                this.replaceLocalSheets(cloudData);
                this.showSyncStatus('Sheets updated from cloud', 'info');
            }
        });
    }

    // Listen for real-time updates for profiles from other users
    setupProfilesRealTimeListener() {
        this.db.ref('sharedProfiles').on('value', (snapshot) => {
            const cloudProfiles = snapshot.val();
            console.log('Real-time profiles update received:', cloudProfiles);
            
            if (cloudProfiles) {
                this.replaceLocalProfiles(cloudProfiles);
                this.showSyncStatus('Profiles updated from cloud', 'info');
            }
        });
    }

    // Save sheets data to shared cloud
    async saveSheetsToCloud(data) {
        if (!this.isInitialized || this.isSyncing) {
            console.log('Cannot sync sheets - not ready');
            return;
        }
        
        try {
            this.isSyncing = true;
            this.showSyncStatus('Syncing sheets to cloud...', 'syncing');
            
            console.log('Saving sheets to shared cloud...', data);
            await this.db.ref('sharedSheets').set(data);
            
            this.showSyncStatus('Sheets synced to cloud', 'success');
            console.log('Sheets data saved to shared cloud successfully');
            
        } catch (error) {
            console.error('Failed to save sheets to shared cloud:', error);
            this.showSyncStatus('Sheets sync failed: ' + error.message, 'error');
        } finally {
            this.isSyncing = false;
        }
    }

    // Save profiles data to shared cloud
    async saveProfilesToCloud(profiles) {
        if (!this.isInitialized || this.isSyncing) {
            console.log('Cannot sync profiles - not ready');
            return;
        }
        
        try {
            this.isSyncing = true;
            this.showSyncStatus('Syncing profiles to cloud...', 'syncing');
            
            console.log('Saving profiles to shared cloud...', profiles);
            await this.db.ref('sharedProfiles').set(profiles);
            
            this.showSyncStatus('Profiles synced to cloud', 'success');
            console.log('Profiles data saved to shared cloud successfully');
            
        } catch (error) {
            console.error('Failed to save profiles to shared cloud:', error);
            this.showSyncStatus('Profiles sync failed: ' + error.message, 'error');
        } finally {
            this.isSyncing = false;
        }
    }

    // Load sheets data from shared cloud
    async loadSheetsFromCloud() {
        if (!this.isInitialized) {
            console.log('Cannot load sheets - not ready');
            return;
        }
        
        try {
            this.showSyncStatus('Loading shared sheets...', 'syncing');
            
            console.log('Loading sheets from shared cloud...');
            const snapshot = await this.db.ref('sharedSheets').once('value');
            const cloudData = snapshot.val();
            
            console.log('Shared cloud sheets data received:', cloudData);
            
            if (cloudData && Array.isArray(cloudData)) {
                // Replace local data with shared data
                this.replaceLocalSheets(cloudData);
                this.showSyncStatus('Shared sheets loaded', 'success');
            } else {
                this.showSyncStatus('No shared sheets found', 'info');
            }
            
        } catch (error) {
            console.error('Failed to load sheets from shared cloud:', error);
            this.showSyncStatus('Sheets cloud load failed: ' + error.message, 'error');
        }
    }

    // Load profiles data from shared cloud
    async loadProfilesFromCloud() {
        if (!this.isInitialized) {
            console.log('Cannot load profiles - not ready');
            return;
        }
        
        try {
            this.showSyncStatus('Loading shared profiles...', 'syncing');
            
            console.log('Loading profiles from shared cloud...');
            const snapshot = await this.db.ref('sharedProfiles').once('value');
            const cloudProfiles = snapshot.val();
            
            console.log('Shared cloud profiles data received:', cloudProfiles);
            
            if (cloudProfiles) {
                // Replace local data with shared data
                this.replaceLocalProfiles(cloudProfiles);
                this.showSyncStatus('Shared profiles loaded', 'success');
            } else {
                this.showSyncStatus('No shared profiles found', 'info');
            }
            
        } catch (error) {
            console.error('Failed to load profiles from shared cloud:', error);
            this.showSyncStatus('Profiles cloud load failed: ' + error.message, 'error');
        }
    }

    // Replace local sheets with shared data
    replaceLocalSheets(cloudData) {
        // Save shared data to localStorage
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(cloudData));
        
        // Refresh the UI
        if (window.loadSavedSheets) {
            window.loadSavedSheets();
        }
        
        // If we have a current sheet open, check if it needs updating
        if (window.currentSheetData) {
            const updatedSheet = cloudData.find(sheet => sheet.id === window.currentSheetData.id);
            if (updatedSheet) {
                window.currentSheetData = updatedSheet;
                // Trigger UI update if needed
                if (window.renderExpenseTable) {
                    window.renderExpenseTable();
                }
            }
        }
    }

    // Replace local profiles with shared data
    replaceLocalProfiles(cloudProfiles) {
        // Save shared data to localStorage
        localStorage.setItem('hisaabKitaabProfiles', JSON.stringify(cloudProfiles));
        
        // Refresh Profile Manager if it exists
        if (window.profileManager) {
            window.profileManager.loadProfiles();
            console.log('Profiles updated from cloud, refreshing Profile Manager');
        }
        
        // Trigger UI updates for avatars
        this.updateAllProfileAvatars();
    }

    // Update all avatars in the UI when profiles change
    updateAllProfileAvatars() {
        // This function can be called to refresh avatars when profiles update
        if (window.profileManager && window.updateParticipantAvatars) {
            // Update default participants list
            const defaultParticipants = JSON.parse(localStorage.getItem('hisaabKitaabDefaultParticipants')) || [];
            defaultParticipants.forEach(participant => {
                window.profileManager.updateParticipantAvatars(participant);
            });
        }
    }

    // Upload profile image to Firebase Storage
    async uploadProfileImage(participantName, imageDataUrl) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            // Convert data URL to blob
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            
            // Create a reference to the storage location
            const storageRef = this.storage.ref();
            const imageRef = storageRef.child(`profile_images/${participantName}_${Date.now()}.jpg`);
            
            // Upload the image
            const snapshot = await imageRef.put(blob, {
                contentType: 'image/jpeg',
            });
            
            // Get the download URL
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            console.log('Profile image uploaded:', downloadURL);
            return downloadURL;
            
        } catch (error) {
            console.error('Failed to upload profile image:', error);
            throw error;
        }
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

    // Manual sync trigger for both sheets and profiles
    async manualSync() {
        if (!this.isInitialized) {
            this.showSyncStatus('Cloud sync not initialized', 'error');
            return;
        }
        
        // Sync sheets
        const localSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
        await this.saveSheetsToCloud(localSheets);
        
        // Sync profiles
        const localProfiles = JSON.parse(localStorage.getItem('hisaabKitaabProfiles')) || {};
        await this.saveProfilesToCloud(localProfiles);
    }

    // Sync a single profile update
    async syncProfileUpdate(participantName, profileData) {
        if (!this.isInitialized) {
            return;
        }
        
        try {
            // Get current profiles
            const profiles = JSON.parse(localStorage.getItem('hisaabKitaabProfiles')) || {};
            
            // Update the specific profile
            profiles[participantName] = profileData;
            
            // Save locally
            localStorage.setItem('hisaabKitaabProfiles', JSON.stringify(profiles));
            
            // Sync to cloud
            await this.saveProfilesToCloud(profiles);
            
            console.log('Profile synced to cloud:', participantName);
            
        } catch (error) {
            console.error('Failed to sync profile:', error);
        }
    }
}

// Create global instance
window.firebaseSync = new FirebaseSync();