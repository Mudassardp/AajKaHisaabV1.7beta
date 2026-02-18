// bin.js - v1.0.2 - Fixed restore to remove from bin after restoring
class BinManager {
    constructor() {
        this.deletedSheets = JSON.parse(localStorage.getItem('hisaabKitaabDeletedSheets')) || [];
        this.isInitialized = false;
        this.isAdmin = localStorage.getItem('hisaabKitaabAdmin') === 'true';
    }

    // Initialize bin manager
    init() {
        this.isInitialized = true;
        this.isAdmin = localStorage.getItem('hisaabKitaabAdmin') === 'true';
        this.setupEventListeners();
        this.setupFirebaseListener();
        // Initial UI update
        this.updateBinUI();
    }

    // Setup Firebase listener for real-time bin updates
    setupFirebaseListener() {
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.addBinListener((cloudBin) => {
                this.handleCloudUpdate(cloudBin);
            });
        }
    }

    // Handle cloud updates
    handleCloudUpdate(cloudBin) {
        this.deletedSheets = cloudBin || [];
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(this.deletedSheets));
        this.updateBinUI();
    }

    // Setup event listeners
    setupEventListeners() {
        // Empty bin button
        const emptyBinBtn = document.getElementById('emptyBinBtn');
        if (emptyBinBtn) {
            emptyBinBtn.addEventListener('click', () => this.emptyBin());
        }

        // Restore all button
        const restoreAllBtn = document.getElementById('restoreAllBtn');
        if (restoreAllBtn) {
            restoreAllBtn.addEventListener('click', () => this.restoreAll());
        }

        // Listen for admin status changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'hisaabKitaabAdmin') {
                this.isAdmin = e.newValue === 'true';
                this.updateBinUI();
            }
        });
    }

    // Update bin UI in settings
    updateBinUI() {
        const binSection = document.getElementById('deletedSheetsBinSection');
        const emptyBinMessage = document.getElementById('emptyBinMessage');
        const deletedSheetsList = document.getElementById('deletedSheetsList');
        const binActions = document.getElementById('binActions');

        if (!binSection) return;

        // Always show bin section for admin, but update content based on admin status
        if (!this.isAdmin) {
            binSection.style.display = 'none';
            return;
        }

        // Show bin section for admin (even if empty)
        binSection.style.display = 'block';
        
        // Get latest deleted sheets
        this.deletedSheets = JSON.parse(localStorage.getItem('hisaabKitaabDeletedSheets')) || [];

        if (this.deletedSheets.length === 0) {
            emptyBinMessage.style.display = 'block';
            emptyBinMessage.textContent = 'Bin is empty';
            deletedSheetsList.style.display = 'none';
            binActions.style.display = 'none';
            return;
        }

        emptyBinMessage.style.display = 'none';
        deletedSheetsList.style.display = 'block';
        binActions.style.display = 'flex';

        // Sort by deletion date (newest first)
        const sortedDeletedSheets = [...this.deletedSheets].sort((a, b) => {
            return new Date(b.deletedDate) - new Date(a.deletedDate);
        });

        deletedSheetsList.innerHTML = '';

        sortedDeletedSheets.forEach(sheet => {
            const sheetItem = this.createBinSheetItem(sheet);
            deletedSheetsList.appendChild(sheetItem);
        });

        // Add event listeners to restore and delete buttons
        this.addBinItemEventListeners();
    }

    // Create bin sheet item
    createBinSheetItem(sheet) {
        const sheetItem = document.createElement('li');
        sheetItem.className = 'sheet-item deleted-sheet-item';
        
        const displayDate = sheet.lastUpdated ? this.formatDateTime(new Date(sheet.lastUpdated)) : 
                          sheet.date ? this.formatDateTime(new Date(sheet.date)) : 
                          this.formatDateTime(new Date(sheet.createdAt));
        
        const version = sheet.version || 'v3.0';
        const versionColor = version === 'v4.0' ? '#9b59b6' : '#7f8c8d';
        
        sheetItem.innerHTML = `
            <div>
                <strong>${sheet.name}</strong>
                <div class="sheet-date">Deleted: ${this.formatDateTime(new Date(sheet.deletedDate))}</div>
                <div style="font-size: 10px; color: ${versionColor}; margin-top: 2px;">${version} ${version === 'v4.0' ? '• Equal Split' : ''}</div>
            </div>
            <div class="sheet-item-actions">
                <button class="btn btn-small btn-success restore-sheet-btn" data-id="${sheet.id}">Restore</button>
                <button class="btn btn-small btn-danger permanent-delete-btn" data-id="${sheet.id}">Delete</button>
            </div>
        `;
        
        return sheetItem;
    }

    // Add event listeners to bin item buttons
    addBinItemEventListeners() {
        document.querySelectorAll('.restore-sheet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.restoreSheet(btn.dataset.id);
            });
        });
        
        document.querySelectorAll('.permanent-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.permanentlyDeleteSheet(btn.dataset.id);
            });
        });
    }

    // Format date time
    formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}/${month}/${day} ${hours}:${minutes}`;
    }

    // Add sheet to bin (called from script.js when deleting)
    async addToBin(sheet) {
        if (!sheet) return false;
        
        // Add deletion date
        sheet.deletedDate = new Date().toISOString();
        
        // Add to bin
        this.deletedSheets.push(sheet);
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(this.deletedSheets));
        
        // Sync to cloud
        await this.syncToCloud();
        
        // Update UI
        this.updateBinUI();
        
        return true;
    }

    // Restore sheet from bin
    async restoreSheet(sheetId) {
        const sheetIndex = this.deletedSheets.findIndex(sheet => sheet.id === sheetId);
        if (sheetIndex === -1) return false;
        
        const sheet = this.deletedSheets[sheetIndex];
        
        // Remove from bin FIRST (locally)
        this.deletedSheets.splice(sheetIndex, 1);
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(this.deletedSheets));
        
        // Add back to saved sheets
        const savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
        savedSheets.push(sheet);
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        // Sync bin to cloud (this will remove it from sharedBin)
        await this.syncToCloud();
        
        // Sync sheets to cloud (this will add it to sharedSheets)
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            await window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        // Update UI
        this.updateBinUI();
        
        // Refresh sheets list if visible
        if (window.loadSavedSheets) {
            window.loadSavedSheets();
        }
        if (window.updateHomeStats) {
            window.updateHomeStats();
        }
        
        alert('Sheet restored successfully!');
        return true;
    }

    // Permanently delete sheet from bin
    async permanentlyDeleteSheet(sheetId) {
        if (!confirm('Permanently delete this sheet? This action cannot be undone.')) {
            return false;
        }
        
        const sheetIndex = this.deletedSheets.findIndex(sheet => sheet.id === sheetId);
        if (sheetIndex === -1) return false;
        
        this.deletedSheets.splice(sheetIndex, 1);
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(this.deletedSheets));
        
        // Sync to cloud
        await this.syncToCloud();
        
        // Update UI
        this.updateBinUI();
        
        alert('Sheet permanently deleted!');
        return true;
    }

    // Empty entire bin
    async emptyBin() {
        if (this.deletedSheets.length === 0) return false;
        
        if (!confirm('Empty the entire bin? This will permanently delete all sheets in the bin.')) {
            return false;
        }
        
        this.deletedSheets = [];
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(this.deletedSheets));
        
        // Sync to cloud
        await this.syncToCloud();
        
        // Update UI
        this.updateBinUI();
        
        alert('Bin emptied successfully!');
        return true;
    }

    // Restore all sheets from bin
    async restoreAll() {
        if (this.deletedSheets.length === 0) return false;
        
        if (!confirm(`Restore all ${this.deletedSheets.length} deleted sheets?`)) {
            return false;
        }
        
        const savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
        
        // Add all deleted sheets to saved sheets
        this.deletedSheets.forEach(sheet => {
            savedSheets.push(sheet);
        });
        
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        // Clear the bin
        this.deletedSheets = [];
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(this.deletedSheets));
        
        // Sync bin to cloud (this will clear sharedBin)
        await this.syncToCloud();
        
        // Sync sheets to cloud (this will add all restored sheets to sharedSheets)
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            await window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        // Update UI
        this.updateBinUI();
        
        // Refresh sheets list if visible
        if (window.loadSavedSheets) {
            window.loadSavedSheets();
        }
        if (window.updateHomeStats) {
            window.updateHomeStats();
        }
        
        alert('All sheets restored successfully!');
        return true;
    }

    // Sync bin to cloud
    async syncToCloud() {
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            try {
                await window.firebaseSync.saveBinToCloud(this.deletedSheets);
                console.log('Bin synced to cloud');
            } catch (error) {
                console.error('Failed to sync bin to cloud:', error);
            }
        }
    }

    // Get all deleted sheets
    getDeletedSheets() {
        return [...this.deletedSheets];
    }

    // Check if sheet is in bin
    isInBin(sheetId) {
        return this.deletedSheets.some(sheet => sheet.id === sheetId);
    }
}

// Create global instance
window.binManager = new BinManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.binManager) {
            window.binManager.init();
        }
    }, 1500);
});