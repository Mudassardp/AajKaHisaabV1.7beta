// trips-firebase-sync.js - v2.0 - ULTIMATE FIX for cross-device trip deletion
// NOW WORKS EXACTLY LIKE SHEETS - creation and deletion both sync properly

class TripsFirebaseSync {
    constructor() {
        this.isInitialized = false;
        this.isSyncing = false;
        this.db = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.pendingSyncTimeout = null;
        this.lastSyncTimestamp = 0;
    }

    // Initialize Firebase for trips
    initialize() {
        try {
            console.log('Initializing Trips Firebase Sync v2.0...');
            
            if (typeof firebase === 'undefined') {
                console.warn('Firebase not available, will retry...');
                this.retryInitialize();
                return false;
            }

            if (window.firebaseSync && window.firebaseSync.db) {
                this.db = window.firebaseSync.db;
                this.isInitialized = true;
                console.log('Trips Firebase Sync initialized successfully');
                
                // Remove any existing listener
                this.db.ref('sharedTrips').off();
                
                // Set up real-time listener
                this.setupTripsRealTimeListener();
                
                // Load initial data
                this.loadTripsFromCloud();
                
                return true;
            } else {
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
            console.log(`Retrying initialization (${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => this.initialize(), 2000);
        }
    }

    setupTripsRealTimeListener() {
        if (!this.db) return;
        
        console.log('Setting up trips real-time listener...');
        
        this.db.ref('sharedTrips').on('value', (snapshot) => {
            const cloudData = snapshot.val();
            console.log('Real-time trips update received:', cloudData);
            
            if (cloudData && Array.isArray(cloudData)) {
                // THIS IS THE CRITICAL PART - handle cloud update exactly like sheets
                this.handleCloudUpdate(cloudData);
            } else if (cloudData === null) {
                console.log('No trips data in cloud yet');
                // If cloud is empty but we have local trips, push them
                const localTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
                if (localTrips.length > 0) {
                    console.log('Cloud empty, pushing local trips to cloud');
                    this.saveTripsToCloud(localTrips);
                }
            }
        });
    }

    // EXACT SAME LOGIC AS SHEETS - this is the key function
    handleCloudUpdate(cloudTrips) {
        console.log('Handling cloud update with', cloudTrips.length, 'trips');
        
        // Get current local data
        const localTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
        const localDeletedTrips = JSON.parse(localStorage.getItem('hisaabKitaabDeletedTrips')) || [];
        
        // Create maps for quick lookup
        const cloudTripIds = new Set(cloudTrips.map(t => t.id));
        const localTripIds = new Set(localTrips.map(t => t.id));
        const deletedTripIds = new Set(localDeletedTrips.map(t => t.id));
        
        console.log('Local trips:', localTrips.length, 'Cloud trips:', cloudTrips.length, 'Deleted:', localDeletedTrips.length);
        
        // STEP 1: Find trips that exist locally but NOT in cloud (these were deleted on another device)
        const tripsToDelete = localTrips.filter(trip => !cloudTripIds.has(trip.id) && !deletedTripIds.has(trip.id));
        
        if (tripsToDelete.length > 0) {
            console.log('Found', tripsToDelete.length, 'trips to delete (removed from cloud)');
            
            // Add them to deleted bin
            tripsToDelete.forEach(trip => {
                trip.deletedDate = new Date().toISOString();
                localDeletedTrips.push(trip);
            });
            
            // Save updated deleted trips
            localStorage.setItem('hisaabKitaabDeletedTrips', JSON.stringify(localDeletedTrips));
        }
        
        // STEP 2: Filter out any trips that are in our deleted bin
        const filteredCloudTrips = cloudTrips.filter(trip => !deletedTripIds.has(trip.id));
        
        // STEP 3: Save the filtered cloud data as our new trips list
        console.log('Saving', filteredCloudTrips.length, 'trips from cloud');
        localStorage.setItem('hisaabKitaabTrips', JSON.stringify(filteredCloudTrips));
        
        // STEP 4: Refresh UI
        this.refreshTripsUI(filteredCloudTrips);
        
        this.showSyncStatus('Trips synced from cloud', 'success');
    }

    refreshTripsUI(updatedTrips) {
        console.log('Refreshing trips UI');
        
        if (window.tripsManager) {
            // Force reload from localStorage
            if (window.tripsManager.forceRefreshFromStorage) {
                window.tripsManager.forceRefreshFromStorage();
            } else {
                // Manual refresh
                const savedTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
                if (window.tripsManager.savedTrips) {
                    window.tripsManager.savedTrips = savedTrips;
                }
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
            
            // Handle current open trip
            if (window.tripsManager.currentTripData) {
                const stillExists = updatedTrips.some(t => t.id === window.tripsManager.currentTripData.id);
                if (!stillExists) {
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

    async saveTripsToCloud(trips) {
        if (!this.isInitialized || !this.db) return false;
        
        if (this.pendingSyncTimeout) {
            clearTimeout(this.pendingSyncTimeout);
        }
        
        return new Promise((resolve) => {
            this.pendingSyncTimeout = setTimeout(async () => {
                if (this.isSyncing) {
                    setTimeout(() => this.saveTripsToCloud(trips), 500);
                    return;
                }
                
                try {
                    this.isSyncing = true;
                    this.lastSyncTimestamp = Date.now();
                    this.showSyncStatus('Syncing trips to cloud...', 'syncing');
                    
                    console.log('Saving', trips.length, 'trips to cloud');
                    await this.db.ref('sharedTrips').set(trips);
                    
                    this.showSyncStatus('Trips synced to cloud', 'success');
                    resolve(true);
                } catch (error) {
                    console.error('Failed to save trips:', error);
                    this.showSyncStatus('Sync failed', 'error');
                    resolve(false);
                } finally {
                    this.isSyncing = false;
                    this.pendingSyncTimeout = null;
                }
            }, 500);
        });
    }

    async loadTripsFromCloud() {
        if (!this.isInitialized || !this.db || this.isSyncing) return;
        
        try {
            this.isSyncing = true;
            this.showSyncStatus('Loading trips...', 'syncing');
            
            const snapshot = await this.db.ref('sharedTrips').once('value');
            const cloudData = snapshot.val();
            
            if (cloudData && Array.isArray(cloudData)) {
                this.handleCloudUpdate(cloudData);
                this.showSyncStatus('Trips loaded', 'success');
            }
        } catch (error) {
            console.error('Failed to load trips:', error);
            this.showSyncStatus('Load failed', 'error');
        } finally {
            this.isSyncing = false;
        }
    }

    async manualSync() {
        if (!this.isInitialized) {
            this.initialize();
            return false;
        }
        
        await this.loadTripsFromCloud();
        const localTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
        return await this.saveTripsToCloud(localTrips);
    }

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
                background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#e2e3e5'};
                color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#383d41'};
                border: 1px solid currentColor;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(statusElement);
        }
        
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusElement.style.opacity = '0';
                setTimeout(() => {
                    statusElement.style.display = 'none';
                    statusElement.style.opacity = '1';
                }, 300);
            }, 2000);
        }
    }
}

window.tripsFirebaseSync = new TripsFirebaseSync();

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.tripsFirebaseSync) {
            window.tripsFirebaseSync.initialize();
        }
    }, 3000);
});