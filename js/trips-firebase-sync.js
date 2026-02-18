// trips-firebase-sync.js - v1.5 - Trips Firebase Sync for HisaabKitaabApp v5.9
// FIXED: Cross-device trip deletion and restore - now works like sheets

class TripsFirebaseSync {
    constructor() {
        this.isInitialized = false;
        this.isSyncing = false;
        this.db = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.pendingSyncTimeout = null;
        this.lastSyncTimestamp = 0;
        this.listenerActive = false;
    }

    // Initialize Firebase for trips
    initialize() {
        try {
            console.log('Initializing Trips Firebase Sync v1.5...');
            
            // Check if Firebase is available
            if (typeof firebase === 'undefined') {
                console.warn('Firebase not available, will retry...');
                this.retryInitialize();
                return false;
            }

            // Try to get database from existing firebaseSync first
            if (window.firebaseSync && window.firebaseSync.db) {
                this.db = window.firebaseSync.db;
                this.isInitialized = true;
                console.log('Trips Firebase Sync initialized successfully using existing connection');
                
                // Set up real-time listener for trips
                this.setupTripsRealTimeListener();
                
                // Load initial trips data from cloud
                this.loadTripsFromCloud();
                
                return true;
            } 
            // If firebaseSync not available, try to initialize directly
            else if (firebase.apps.length > 0) {
                this.db = firebase.database();
                this.isInitialized = true;
                console.log('Trips Firebase Sync initialized directly');
                
                // Set up real-time listener for trips
                this.setupTripsRealTimeListener();
                
                // Load initial trips data from cloud
                this.loadTripsFromCloud();
                
                return true;
            }
            else {
                console.warn('Firebase not initialized yet, will retry...');
                this.retryInitialize();
                return false;
            }
        } catch (error) {
            console.error('Trips Firebase Sync initialization failed:', error);
            this.retryInitialize();
            return false;
        }
    }

    retryInitialize() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Retrying Trips Firebase Sync initialization (${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => this.initialize(), 2000);
        } else {
            console.error('Trips Firebase Sync failed to initialize after', this.maxRetries, 'attempts');
            this.showSyncStatus('Trips sync unavailable', 'error');
        }
    }

    // Listen for real-time updates for trips from other users
    setupTripsRealTimeListener() {
        if (!this.db) {
            console.error('Cannot setup trips listener - database not initialized');
            return;
        }
        
        // Prevent setting up multiple listeners
        if (this.listenerActive) {
            console.log('Trips listener already active, skipping...');
            return;
        }
        
        console.log('Setting up trips real-time listener...');
        
        // Remove any existing listener first
        this.db.ref('sharedTrips').off();
        
        // Set up new listener with proper error handling
        this.db.ref('sharedTrips').on('value', (snapshot) => {
            const now = Date.now();
            
            // Only process if we're not currently syncing and it's been at least 1 second since last sync
            if (!this.isSyncing && (now - this.lastSyncTimestamp) > 1000) {
                const cloudData = snapshot.val();
                console.log('Real-time trips update received:', cloudData);
                
                if (cloudData && Array.isArray(cloudData)) {
                    this.handleCloudUpdate(cloudData);
                } else if (cloudData === null) {
                    console.log('No trips data in cloud yet');
                    // If cloud is empty but we have local trips, sync them up
                    const localTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
                    if (localTrips.length > 0) {
                        console.log('Cloud empty, pushing local trips to cloud');
                        this.saveTripsToCloud(localTrips);
                    }
                }
            } else {
                console.log('Skipping trips cloud update - sync in progress or too soon after last sync');
            }
        }, (error) => {
            console.error('Error in trips real-time listener:', error);
            this.showSyncStatus('Trips sync error: ' + error.message, 'error');
        });
        
        this.listenerActive = true;
        console.log('Trips real-time listener setup complete');
    }

    // Handle cloud update - this is the key function for cross-device sync
    handleCloudUpdate(cloudData) {
        console.log('Handling cloud update with', cloudData.length, 'trips');
        
        // Get current local data
        const localTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
        const localDeletedTrips = JSON.parse(localStorage.getItem('hisaabKitaabDeletedTrips')) || [];
        
        // Create maps for easy lookup
        const cloudTripsMap = new Map();
        cloudData.forEach(trip => cloudTripsMap.set(trip.id, trip));
        
        const localTripsMap = new Map();
        localTrips.forEach(trip => localTripsMap.set(trip.id, trip));
        
        const deletedTripsMap = new Map();
        localDeletedTrips.forEach(trip => deletedTripsMap.set(trip.id, trip));
        
        console.log('Local trips:', localTrips.length, 'Cloud trips:', cloudData.length, 'Deleted:', localDeletedTrips.length);
        
        // Step 1: Filter out any trips that are in the local deleted bin
        const filteredCloudData = cloudData.filter(trip => !deletedTripsMap.has(trip.id));
        
        // Step 2: Check if any local trips are missing from cloud (they were deleted on another device)
        // We need to move them to deleted bin
        const newDeletedTrips = [];
        localTrips.forEach(localTrip => {
            if (!cloudTripsMap.has(localTrip.id)) {
                // This trip was deleted on another device
                console.log('Trip deleted on another device:', localTrip.name);
                
                // Check if it's already in deleted bin
                if (!deletedTripsMap.has(localTrip.id)) {
                    // Add to deleted bin
                    localTrip.deletedDate = new Date().toISOString();
                    newDeletedTrips.push(localTrip);
                }
            }
        });
        
        // Step 3: Update deleted trips bin
        if (newDeletedTrips.length > 0) {
            console.log('Adding', newDeletedTrips.length, 'trips to deleted bin from cloud deletion');
            localDeletedTrips.push(...newDeletedTrips);
            localStorage.setItem('hisaabKitaabDeletedTrips', JSON.stringify(localDeletedTrips));
        }
        
        // Step 4: Save filtered cloud data to localStorage (this becomes our new trips list)
        console.log('Saving filtered cloud data:', filteredCloudData.length, 'trips');
        localStorage.setItem('hisaabKitaabTrips', JSON.stringify(filteredCloudData));
        
        // Step 5: Refresh the UI
        this.refreshTripsUI(filteredCloudData);
        
        this.showSyncStatus('Trips updated from cloud', 'success');
    }

    // Refresh all trips UI elements
    refreshTripsUI(updatedTrips) {
        console.log('Refreshing trips UI');
        
        if (window.tripsManager) {
            // Force refresh from storage
            if (window.tripsManager.forceRefreshFromStorage) {
                window.tripsManager.forceRefreshFromStorage();
            } else {
                // Manual refresh of all UI components
                if (window.tripsManager.loadAllTrips) {
                    window.tripsManager.loadAllTrips();
                }
                if (window.tripsManager.loadRecentTrips) {
                    window.tripsManager.loadRecentTrips();
                }
                if (window.tripsManager.updateDeletedTripsBin) {
                    window.tripsManager.updateDeletedTripsBin();
                }
            }
            
            // Update current trip data if it's open
            if (window.tripsManager.currentTripData) {
                const updatedCurrentTrip = updatedTrips.find(t => t.id === window.tripsManager.currentTripData.id);
                if (updatedCurrentTrip) {
                    window.tripsManager.currentTripData = updatedCurrentTrip;
                    if (window.tripsManager.updateCurrentTripDisplay) {
                        window.tripsManager.updateCurrentTripDisplay();
                    }
                } else {
                    // Current trip was deleted from another device
                    console.log('Current trip was deleted on another device, closing...');
                    window.tripsManager.currentTripData = null;
                    if (window.tripsManager.hideAllPages && window.tripsManager.showTripsPage) {
                        window.tripsManager.hideAllPages();
                        window.tripsManager.showTripsPage();
                    }
                }
            }
        }
    }

    // Save trips data to shared cloud with debouncing
    async saveTripsToCloud(data) {
        if (!this.isInitialized || !this.db) {
            console.log('Cannot sync trips - not ready');
            // Try to initialize again
            setTimeout(() => this.initialize(), 1000);
            return false;
        }
        
        // Debounce multiple rapid saves
        if (this.pendingSyncTimeout) {
            clearTimeout(this.pendingSyncTimeout);
        }
        
        return new Promise((resolve) => {
            this.pendingSyncTimeout = setTimeout(async () => {
                if (this.isSyncing) {
                    console.log('Already syncing trips, waiting...');
                    setTimeout(() => this.saveTripsToCloud(data), 500);
                    return;
                }
                
                try {
                    this.isSyncing = true;
                    this.lastSyncTimestamp = Date.now();
                    this.showSyncStatus('Syncing trips to cloud...', 'syncing');
                    
                    console.log('Saving trips to shared cloud...', data.length);
                    await this.db.ref('sharedTrips').set(data);
                    
                    this.showSyncStatus('Trips synced to cloud', 'success');
                    console.log('Trips data saved to shared cloud successfully');
                    resolve(true);
                    
                } catch (error) {
                    console.error('Failed to save trips to shared cloud:', error);
                    this.showSyncStatus('Trips sync failed: ' + error.message, 'error');
                    resolve(false);
                } finally {
                    this.isSyncing = false;
                    this.pendingSyncTimeout = null;
                }
            }, 500);
        });
    }

    // Load trips data from shared cloud
    async loadTripsFromCloud() {
        if (!this.isInitialized || !this.db) {
            console.log('Cannot load trips - not ready');
            return;
        }
        
        if (this.isSyncing) {
            console.log('Already syncing, skipping load');
            return;
        }
        
        try {
            this.isSyncing = true;
            this.showSyncStatus('Loading shared trips...', 'syncing');
            
            console.log('Loading trips from shared cloud...');
            const snapshot = await this.db.ref('sharedTrips').once('value');
            const cloudData = snapshot.val();
            
            console.log('Shared cloud trips data received:', cloudData);
            
            if (cloudData && Array.isArray(cloudData)) {
                this.handleCloudUpdate(cloudData);
                this.showSyncStatus('Shared trips loaded', 'success');
            } else {
                console.log('No shared trips found');
                this.showSyncStatus('No shared trips found', 'info');
            }
            
        } catch (error) {
            console.error('Failed to load trips from shared cloud:', error);
            this.showSyncStatus('Trips cloud load failed: ' + error.message, 'error');
        } finally {
            this.isSyncing = false;
        }
    }

    // Manual sync trigger for trips
    async manualSync() {
        if (!this.isInitialized || !this.db) {
            this.showSyncStatus('Trips cloud sync not initialized', 'error');
            // Try to initialize
            this.initialize();
            return false;
        }
        
        this.showSyncStatus('Manual trips sync started...', 'syncing');
        
        // First, load from cloud to get latest
        await this.loadTripsFromCloud();
        
        // Then save local trips to cloud
        const localTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
        const result = await this.saveTripsToCloud(localTrips);
        
        if (result) {
            this.showSyncStatus('Trips sync completed', 'success');
        }
        
        return result;
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
                transition: opacity 0.3s;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
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
        statusElement.style.display = 'block';
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusElement.style.opacity = '0';
                setTimeout(() => {
                    statusElement.style.display = 'none';
                    statusElement.style.opacity = '1';
                }, 300);
            }, 3000);
        }
    }
}

// Create global instance
window.tripsFirebaseSync = new TripsFirebaseSync();

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for main Firebase to initialize
    setTimeout(() => {
        if (window.tripsFirebaseSync) {
            window.tripsFirebaseSync.initialize();
        }
    }, 3000);
});