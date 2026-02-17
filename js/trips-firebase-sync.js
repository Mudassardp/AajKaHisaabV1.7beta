// trips-firebase-sync.js - v1.0 - Trips Firebase Sync for HisaabKitaabApp v5.9
// This file handles Firebase synchronization for trips data

class TripsFirebaseSync {
    constructor() {
        this.isInitialized = false;
        this.isSyncing = false;
        this.db = null;
    }

    // Initialize Firebase for trips
    initialize() {
        try {
            console.log('Initializing Trips Firebase Sync v1.0...');
            
            // Check if Firebase is already initialized
            if (window.firebaseSync && window.firebaseSync.isInitialized) {
                this.db = window.firebaseSync.db;
                this.isInitialized = true;
                console.log('Trips Firebase Sync initialized successfully');
                
                // Set up real-time listener for trips
                this.setupTripsRealTimeListener();
                
                // Load initial trips data from cloud
                this.loadTripsFromCloud();
                
                return true;
            } else {
                console.warn('Firebase not initialized yet, will retry...');
                // Retry after 2 seconds
                setTimeout(() => this.initialize(), 2000);
                return false;
            }
        } catch (error) {
            console.error('Trips Firebase Sync initialization failed:', error);
            return false;
        }
    }

    // Listen for real-time updates for trips from other users
    setupTripsRealTimeListener() {
        if (!this.db) return;
        
        this.db.ref('sharedTrips').on('value', (snapshot) => {
            const cloudData = snapshot.val();
            console.log('Real-time trips update received:', cloudData);
            
            if (cloudData && Array.isArray(cloudData)) {
                this.replaceLocalTrips(cloudData);
                this.showSyncStatus('Trips updated from cloud', 'info');
            }
        }, (error) => {
            console.error('Error in trips real-time listener:', error);
        });
    }

    // Save trips data to shared cloud
    async saveTripsToCloud(data) {
        if (!this.isInitialized || !this.db || this.isSyncing) {
            console.log('Cannot sync trips - not ready');
            return false;
        }
        
        try {
            this.isSyncing = true;
            this.showSyncStatus('Syncing trips to cloud...', 'syncing');
            
            console.log('Saving trips to shared cloud...', data);
            await this.db.ref('sharedTrips').set(data);
            
            this.showSyncStatus('Trips synced to cloud', 'success');
            console.log('Trips data saved to shared cloud successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to save trips to shared cloud:', error);
            this.showSyncStatus('Trips sync failed: ' + error.message, 'error');
            return false;
        } finally {
            this.isSyncing = false;
        }
    }

    // Load trips data from shared cloud
    async loadTripsFromCloud() {
        if (!this.isInitialized || !this.db) {
            console.log('Cannot load trips - not ready');
            return;
        }
        
        try {
            this.showSyncStatus('Loading shared trips...', 'syncing');
            
            console.log('Loading trips from shared cloud...');
            const snapshot = await this.db.ref('sharedTrips').once('value');
            const cloudData = snapshot.val();
            
            console.log('Shared cloud trips data received:', cloudData);
            
            if (cloudData && Array.isArray(cloudData)) {
                // Replace local data with shared data
                this.replaceLocalTrips(cloudData);
                this.showSyncStatus('Shared trips loaded', 'success');
            } else {
                console.log('No shared trips found');
                this.showSyncStatus('No shared trips found', 'info');
            }
            
        } catch (error) {
            console.error('Failed to load trips from shared cloud:', error);
            this.showSyncStatus('Trips cloud load failed: ' + error.message, 'error');
        }
    }

    // Replace local trips with shared data
    replaceLocalTrips(cloudData) {
        // Save shared data to localStorage
        localStorage.setItem('hisaabKitaabTrips', JSON.stringify(cloudData));
        
        // Refresh the trips UI
        if (window.tripsManager && window.tripsManager.loadAllTrips) {
            window.tripsManager.loadAllTrips();
        }
        if (window.tripsManager && window.tripsManager.loadRecentTrips) {
            window.tripsManager.loadRecentTrips();
        }
        if (window.tripsManager && window.tripsManager.updateDeletedTripsBin) {
            window.tripsManager.updateDeletedTripsBin();
        }
        
        console.log('Local trips replaced with cloud data');
    }

    // Manual sync trigger for trips
    async manualSync() {
        if (!this.isInitialized || !this.db) {
            this.showSyncStatus('Trips cloud sync not initialized', 'error');
            return false;
        }
        
        // Get local trips
        const localTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
        return await this.saveTripsToCloud(localTrips);
    }

    // Show sync status
    showSyncStatus(message, type = 'info') {
        let statusElement = document.getElementById('tripsSyncStatus');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'tripsSyncStatus';
            statusElement.style.cssText = `
                position: fixed;
                top: 60px;
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
        } else {
            statusElement.style.display = 'block';
        }
    }
}

// Create global instance
window.tripsFirebaseSync = new TripsFirebaseSync();