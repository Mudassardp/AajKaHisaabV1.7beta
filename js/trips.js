// trips.js - v2.4 - Trips Feature with proper deletion sync

(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initTrips, 500);
    });
    
    function initTrips() {
        console.log('Initializing Trips v2.4...');
        
        let savedTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
        let deletedTrips = JSON.parse(localStorage.getItem('hisaabKitaabDeletedTrips')) || [];
        let currentTripData = null;

        window.tripsManager = {
            savedTrips: savedTrips,
            currentTripData: currentTripData,
            loadAllTrips: loadAllTrips,
            loadRecentTrips: loadRecentTrips,
            updateDeletedTripsBin: updateDeletedTripsBin,
            hideAllPages: hideAllPages,
            showTripsPage: showTripsPage,
            updateCurrentTripDisplay: updateCurrentTripDisplay,
            forceRefreshFromStorage: forceRefreshFromStorage
        };
        
        let isAdmin = localStorage.getItem('hisaabKitaabAdmin') === 'true';
        
        // DOM Elements
        const tripsBtn = document.getElementById('tripsBtn');
        const homeBtn = document.getElementById('homeBtn');
        const sheetsBtn = document.getElementById('sheetsBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        
        const homeContent = document.getElementById('homeContent');
        const sheetsContent = document.getElementById('sheetsContent');
        const tripsContent = document.getElementById('tripsContent');
        const settingsContent = document.getElementById('settingsContent');
        const tripDetailSection = document.getElementById('tripDetailSection');
        
        const createTripHomeBtn = document.getElementById('createTripHomeBtn');
        const recentTripsList = document.getElementById('recentTripsList');
        const viewAllTripsBtn = document.getElementById('viewAllTripsBtn');
        const totalTripsCount = document.getElementById('totalTripsCount');
        const totalTripsCard = document.getElementById('totalTripsCard');
        
        const tripsList = document.getElementById('tripsList');
        const noTripsMessage = document.getElementById('noTripsMessage');
        
        const tripDetailName = document.getElementById('tripDetailName');
        const editTripBtn = document.getElementById('editTripBtn');
        const tripDetailDate = document.getElementById('tripDetailDate');
        const tripDetailDescription = document.getElementById('tripDetailDescription');
        const closeTripBtn = document.getElementById('closeTripBtn');
        
        const createTripModal = document.getElementById('createTripModal');
        const createTripNameInput = document.getElementById('createTripNameInput');
        const createTripDescriptionInput = document.getElementById('createTripDescriptionInput');
        const confirmCreateTripBtn = document.getElementById('confirmCreateTripBtn');
        const cancelCreateTripBtn = document.getElementById('cancelCreateTripBtn');
        
        const renameTripModal = document.getElementById('renameTripModal');
        const renameTripInput = document.getElementById('renameTripInput');
        const editTripDescriptionInput = document.getElementById('editTripDescriptionInput');
        const confirmRenameTripBtn = document.getElementById('confirmRenameTripBtn');
        const cancelRenameTripBtn = document.getElementById('cancelRenameTripBtn');
        
        const deleteModal = document.getElementById('deleteModal');
        const deleteModalTitle = document.getElementById('deleteModalTitle');
        const deleteModalMessage = document.getElementById('deleteModalMessage');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        
        const deletedTripsBinSection = document.getElementById('deletedTripsBinSection');
        const deletedTripsList = document.getElementById('deletedTripsList');
        const emptyTripsBinMessage = document.getElementById('emptyTripsBinMessage');
        const tripsBinActions = document.getElementById('tripsBinActions');
        const emptyTripsBinBtn = document.getElementById('emptyTripsBinBtn');
        const restoreAllTripsBtn = document.getElementById('restoreAllTripsBtn');
        
        setupEventListeners();
        
        function forceRefreshFromStorage() {
            savedTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
            deletedTrips = JSON.parse(localStorage.getItem('hisaabKitaabDeletedTrips')) || [];
            window.tripsManager.savedTrips = savedTrips;
            
            updateTripsStats();
            loadRecentTrips();
            loadAllTrips();
            updateDeletedTripsBin();
        }
        
        function setupEventListeners() {
            if (tripsBtn) {
                tripsBtn.addEventListener('click', function() {
                    hideAllPages();
                    showTripsPage();
                });
            }
            
            if (homeBtn) {
                homeBtn.addEventListener('click', function() {
                    hideAllPages();
                    showHomePage();
                });
            }
            
            if (sheetsBtn) {
                sheetsBtn.addEventListener('click', function() {
                    hideAllPages();
                    showSheetsPage();
                });
            }
            
            if (settingsBtn) {
                settingsBtn.addEventListener('click', function() {
                    hideAllPages();
                    showSettingsPage();
                });
            }
            
            if (refreshBtn) {
                refreshBtn.addEventListener('click', function() {
                    if (window.tripsFirebaseSync) {
                        window.tripsFirebaseSync.manualSync();
                    }
                });
            }
            
            if (createTripHomeBtn) {
                createTripHomeBtn.addEventListener('click', function() {
                    if (isAdmin) {
                        showCreateTripModal();
                    } else {
                        alert('Only admin users can create trips.');
                    }
                });
            }
            
            if (viewAllTripsBtn) {
                viewAllTripsBtn.addEventListener('click', function() {
                    hideAllPages();
                    showTripsPage();
                });
            }
            
            if (totalTripsCard) {
                totalTripsCard.addEventListener('click', function() {
                    hideAllPages();
                    showTripsPage();
                });
            }
            
            if (closeTripBtn) {
                closeTripBtn.addEventListener('click', function() {
                    hideAllPages();
                    showTripsPage();
                });
            }
            
            if (confirmCreateTripBtn) {
                confirmCreateTripBtn.addEventListener('click', createNewTrip);
            }
            
            if (cancelCreateTripBtn) {
                cancelCreateTripBtn.addEventListener('click', hideCreateTripModal);
            }
            
            if (createTripModal) {
                createTripModal.addEventListener('click', function(e) {
                    if (e.target === createTripModal) {
                        hideCreateTripModal();
                    }
                });
            }
            
            // CRITICAL: Listen for trip delete confirmation
            window.addEventListener('tripDeleteConfirmed', function(e) {
                console.log('Trip delete confirmed:', e.detail);
                if (e.detail && e.detail.tripId) {
                    deleteTripById(e.detail.tripId);
                }
            });
            
            // Bin Actions
            if (emptyTripsBinBtn) {
                emptyTripsBinBtn.addEventListener('click', emptyTripsBin);
            }
            
            if (restoreAllTripsBtn) {
                restoreAllTripsBtn.addEventListener('click', restoreAllTrips);
            }
            
            // Check admin status
            setInterval(function() {
                const newAdminStatus = localStorage.getItem('hisaabKitaabAdmin') === 'true';
                if (newAdminStatus !== isAdmin) {
                    isAdmin = newAdminStatus;
                    updateTripsUIForAdmin();
                }
            }, 1000);
        }
        
        function hideAllPages() {
            if (homeContent) homeContent.classList.remove('active');
            if (sheetsContent) sheetsContent.classList.remove('active');
            if (tripsContent) tripsContent.classList.remove('active');
            if (settingsContent) settingsContent.classList.remove('active');
            if (tripDetailSection) tripDetailSection.classList.remove('active');
            
            const homeBtn = document.getElementById('homeBtn');
            const sheetsBtn = document.getElementById('sheetsBtn');
            const tripsBtn = document.getElementById('tripsBtn');
            const settingsBtn = document.getElementById('settingsBtn');
            
            if (homeBtn) homeBtn.classList.remove('active');
            if (sheetsBtn) sheetsBtn.classList.remove('active');
            if (tripsBtn) tripsBtn.classList.remove('active');
            if (settingsBtn) settingsBtn.classList.remove('active');
        }
        
        function showHomePage() {
            if (homeContent) homeContent.classList.add('active');
            const homeBtn = document.getElementById('homeBtn');
            if (homeBtn) homeBtn.classList.add('active');
            loadRecentTrips();
        }
        
        function showSheetsPage() {
            if (sheetsContent) sheetsContent.classList.add('active');
            const sheetsBtn = document.getElementById('sheetsBtn');
            if (sheetsBtn) sheetsBtn.classList.add('active');
        }
        
        function showTripsPage() {
            if (tripsContent) tripsContent.classList.add('active');
            const tripsBtn = document.getElementById('tripsBtn');
            if (tripsBtn) tripsBtn.classList.add('active');
            loadAllTrips();
        }
        
        function showSettingsPage() {
            if (settingsContent) settingsContent.classList.add('active');
            const settingsBtn = document.getElementById('settingsBtn');
            if (settingsBtn) settingsBtn.classList.add('active');
            updateDeletedTripsBin();
        }
        
        function showPage(page) {
            hideAllPages();
            
            if (page === 'home') showHomePage();
            else if (page === 'sheets') showSheetsPage();
            else if (page === 'trips') showTripsPage();
            else if (page === 'settings') showSettingsPage();
            else if (page === 'tripDetail' && tripDetailSection) tripDetailSection.classList.add('active');
        }
        
        function showCreateTripModal() {
            if (!isAdmin) {
                alert('Only admin users can create trips.');
                return;
            }
            
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            createTripNameInput.value = `Trip-${day}/${month}/${year}`;
            createTripDescriptionInput.value = '';
            createTripModal.style.display = 'flex';
            
            setTimeout(() => {
                createTripNameInput.focus();
                createTripNameInput.select();
            }, 100);
        }
        
        function hideCreateTripModal() {
            createTripModal.style.display = 'none';
        }
        
        function createNewTrip() {
            if (!isAdmin) {
                alert('Only admin users can create trips.');
                hideCreateTripModal();
                return;
            }
            
            const tripName = createTripNameInput.value.trim();
            const tripDescription = createTripDescriptionInput.value.trim();
            
            if (!tripName) {
                alert('Please enter a trip name.');
                return;
            }
            
            const nameExists = savedTrips.some(trip => 
                trip.name.toLowerCase() === tripName.toLowerCase()
            );
            
            if (nameExists) {
                alert('A trip with this name already exists.');
                return;
            }
            
            const now = new Date();
            const tripId = 'trip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const newTrip = {
                id: tripId,
                name: tripName,
                description: tripDescription,
                createdAt: now.toISOString(),
                lastUpdated: formatDateTime(now),
                participants: [],
                expenses: {},
                status: 'active'
            };
            
            savedTrips.push(newTrip);
            saveTripsToStorage();
            
            hideCreateTripModal();
            openTrip(tripId);
        }
        
        function loadAllTrips() {
            if (!tripsList || !noTripsMessage) return;
            
            tripsList.innerHTML = '';
            
            if (savedTrips.length === 0) {
                noTripsMessage.style.display = 'block';
                tripsList.style.display = 'none';
                return;
            }
            
            noTripsMessage.style.display = 'none';
            tripsList.style.display = 'block';
            
            const sortedTrips = [...savedTrips].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            sortedTrips.forEach(trip => {
                const tripItem = createTripListItem(trip);
                tripsList.appendChild(tripItem);
            });
        }
        
        function loadRecentTrips() {
            if (!recentTripsList) return;
            
            recentTripsList.innerHTML = '';
            
            if (savedTrips.length === 0) {
                recentTripsList.innerHTML = '<div class="no-recent-trips">No recent trips found.</div>';
                return;
            }
            
            const sortedTrips = [...savedTrips].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            sortedTrips.slice(0, 3).forEach(trip => {
                const tripItem = createRecentTripItem(trip);
                recentTripsList.appendChild(tripItem);
            });
        }
        
        function createRecentTripItem(trip) {
            const item = document.createElement('div');
            item.className = 'recent-trip-item';
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn') && !e.target.closest('.sheet-item-actions')) {
                    openTrip(trip.id);
                }
            });
            
            const displayDate = trip.createdAt ? formatDateShort(new Date(trip.createdAt)) : 'Unknown';
            const description = trip.description || 'No description';
            
            item.innerHTML = `
                <div>
                    <div class="recent-trip-name">${trip.name}</div>
                    <div class="recent-trip-description">${description.substring(0, 30)}${description.length > 30 ? '...' : ''}</div>
                    <div class="recent-trip-date">Created: ${displayDate}</div>
                </div>
            `;
            
            if (isAdmin) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'sheet-item-actions';
                actionsDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 10px;';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-small btn-danger action-btn';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDeleteTripConfirmation(trip.id);
                });
                
                actionsDiv.appendChild(deleteBtn);
                item.appendChild(actionsDiv);
            }
            
            return item;
        }
        
        function createTripListItem(trip) {
            const item = document.createElement('li');
            item.className = 'trip-item';
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn') && !e.target.closest('.trip-item-actions')) {
                    openTrip(trip.id);
                }
            });
            
            const displayDate = trip.createdAt ? formatDateShort(new Date(trip.createdAt)) : 'Unknown';
            const description = trip.description || 'No description';
            
            item.innerHTML = `
                <div>
                    <strong>${trip.name}</strong>
                    <div class="trip-description">${description.substring(0, 40)}${description.length > 40 ? '...' : ''}</div>
                    <div class="trip-date">Created: ${displayDate}</div>
                </div>
            `;
            
            if (isAdmin) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'trip-item-actions';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-small btn-danger action-btn';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDeleteTripConfirmation(trip.id);
                });
                
                actionsDiv.appendChild(deleteBtn);
                item.appendChild(actionsDiv);
            }
            
            return item;
        }
        
        function openTrip(tripId) {
            const trip = savedTrips.find(t => t.id === tripId);
            if (!trip) {
                alert('Trip not found!');
                return;
            }
            
            currentTripData = JSON.parse(JSON.stringify(trip));
            window.tripsManager.currentTripData = currentTripData;
            
            tripDetailName.textContent = currentTripData.name;
            tripDetailDate.textContent = `Created: ${formatDateLong(new Date(currentTripData.createdAt))}`;
            tripDetailDescription.textContent = currentTripData.description || 'No description';
            
            editTripBtn.style.display = isAdmin ? 'inline-block' : 'none';
            showPage('tripDetail');
        }
        
        function updateCurrentTripDisplay() {
            if (!currentTripData) return;
            tripDetailName.textContent = currentTripData.name;
            tripDetailDate.textContent = `Created: ${formatDateLong(new Date(currentTripData.createdAt))}`;
            tripDetailDescription.textContent = currentTripData.description || 'No description';
        }
        
        function showDeleteTripConfirmation(tripId) {
            console.log('Showing delete confirmation for trip:', tripId);
            
            deleteModal.dataset.tripId = tripId;
            deleteModal.dataset.type = 'trip';
            deleteModalTitle.textContent = 'Delete Trip';
            deleteModalMessage.textContent = 'Are you sure you want to delete this trip? It will be moved to the bin.';
            deleteModal.style.display = 'flex';
        }
        
        function deleteTripById(tripId) {
            console.log('Deleting trip:', tripId);
            
            const tripIndex = savedTrips.findIndex(trip => trip.id === tripId);
            if (tripIndex === -1) return;
            
            const trip = savedTrips[tripIndex];
            
            // Add to deleted trips
            trip.deletedDate = new Date().toISOString();
            deletedTrips.push(trip);
            localStorage.setItem('hisaabKitaabDeletedTrips', JSON.stringify(deletedTrips));
            
            // Remove from saved trips
            savedTrips.splice(tripIndex, 1);
            
            // Update window reference
            window.tripsManager.savedTrips = savedTrips;
            
            // Save to storage (this triggers Firebase sync)
            localStorage.setItem('hisaabKitaabTrips', JSON.stringify(savedTrips));
            
            // Force Firebase sync
            if (window.tripsFirebaseSync) {
                window.tripsFirebaseSync.saveTripsToCloud(savedTrips);
            }
            
            // Close if current
            if (currentTripData && currentTripData.id === tripId) {
                currentTripData = null;
                window.tripsManager.currentTripData = null;
                hideAllPages();
                showTripsPage();
            }
            
            // Refresh UI
            updateTripsStats();
            loadRecentTrips();
            loadAllTrips();
            updateDeletedTripsBin();
            
            alert('Trip moved to bin!');
        }
        
        function updateTripsStats() {
            if (totalTripsCount) totalTripsCount.textContent = savedTrips.length;
        }
        
        function updateTripsUIForAdmin() {
            if (createTripHomeBtn) {
                createTripHomeBtn.style.display = isAdmin ? 'block' : 'none';
            }
            if (deletedTripsBinSection) {
                deletedTripsBinSection.style.display = isAdmin ? 'block' : 'none';
            }
            loadRecentTrips();
            loadAllTrips();
            updateDeletedTripsBin();
        }
        
        function saveTripsToStorage() {
            localStorage.setItem('hisaabKitaabTrips', JSON.stringify(savedTrips));
            window.tripsManager.savedTrips = savedTrips;
            updateTripsStats();
            
            if (window.tripsFirebaseSync) {
                window.tripsFirebaseSync.saveTripsToCloud(savedTrips);
            }
        }
        
        function saveDeletedTripsToStorage() {
            localStorage.setItem('hisaabKitaabDeletedTrips', JSON.stringify(deletedTrips));
        }
        
        function updateDeletedTripsBin() {
            if (!deletedTripsList || !emptyTripsBinMessage || !tripsBinActions) return;
            
            deletedTrips = JSON.parse(localStorage.getItem('hisaabKitaabDeletedTrips')) || [];
            
            if (deletedTrips.length === 0) {
                emptyTripsBinMessage.style.display = 'block';
                deletedTripsList.style.display = 'none';
                tripsBinActions.style.display = 'none';
                return;
            }
            
            emptyTripsBinMessage.style.display = 'none';
            deletedTripsList.style.display = 'block';
            tripsBinActions.style.display = 'flex';
            
            const sortedDeletedTrips = [...deletedTrips].sort((a, b) => 
                new Date(b.deletedDate) - new Date(a.deletedDate)
            );
            
            deletedTripsList.innerHTML = '';
            
            sortedDeletedTrips.forEach(trip => {
                const tripItem = document.createElement('li');
                tripItem.className = 'trip-item deleted-trip-item';
                
                const displayDate = trip.deletedDate ? formatDateTime(new Date(trip.deletedDate)) : 'Unknown';
                
                tripItem.innerHTML = `
                    <div>
                        <strong>${trip.name}</strong>
                        <div class="trip-description">${trip.description || 'No description'}</div>
                        <div class="trip-date">Deleted: ${displayDate}</div>
                    </div>
                    <div class="trip-item-actions">
                        <button class="btn btn-small btn-success restore-trip-btn" data-id="${trip.id}">Restore</button>
                        <button class="btn btn-small btn-danger permanent-delete-trip-btn" data-id="${trip.id}">Delete</button>
                    </div>
                `;
                
                deletedTripsList.appendChild(tripItem);
            });
            
            document.querySelectorAll('.restore-trip-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    restoreDeletedTrip(btn.dataset.id);
                });
            });
            
            document.querySelectorAll('.permanent-delete-trip-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    permanentlyDeleteTrip(btn.dataset.id);
                });
            });
        }
        
        function restoreDeletedTrip(tripId) {
            const tripIndex = deletedTrips.findIndex(trip => trip.id === tripId);
            if (tripIndex === -1) return;
            
            const trip = deletedTrips[tripIndex];
            
            deletedTrips.splice(tripIndex, 1);
            localStorage.setItem('hisaabKitaabDeletedTrips', JSON.stringify(deletedTrips));
            
            savedTrips.push(trip);
            localStorage.setItem('hisaabKitaabTrips', JSON.stringify(savedTrips));
            window.tripsManager.savedTrips = savedTrips;
            
            if (window.tripsFirebaseSync) {
                window.tripsFirebaseSync.saveTripsToCloud(savedTrips);
            }
            
            updateTripsStats();
            loadRecentTrips();
            loadAllTrips();
            updateDeletedTripsBin();
            
            alert('Trip restored successfully!');
        }
        
        function permanentlyDeleteTrip(tripId) {
            if (!confirm('Permanently delete this trip? This cannot be undone.')) return;
            
            const tripIndex = deletedTrips.findIndex(trip => trip.id === tripId);
            if (tripIndex === -1) return;
            
            deletedTrips.splice(tripIndex, 1);
            localStorage.setItem('hisaabKitaabDeletedTrips', JSON.stringify(deletedTrips));
            updateDeletedTripsBin();
        }
        
        function emptyTripsBin() {
            if (!confirm('Empty the entire trips bin?')) return;
            deletedTrips = [];
            localStorage.setItem('hisaabKitaabDeletedTrips', JSON.stringify(deletedTrips));
            updateDeletedTripsBin();
        }
        
        function restoreAllTrips() {
            if (deletedTrips.length === 0) return;
            
            deletedTrips.forEach(trip => savedTrips.push(trip));
            localStorage.setItem('hisaabKitaabTrips', JSON.stringify(savedTrips));
            window.tripsManager.savedTrips = savedTrips;
            
            if (window.tripsFirebaseSync) {
                window.tripsFirebaseSync.saveTripsToCloud(savedTrips);
            }
            
            deletedTrips = [];
            localStorage.setItem('hisaabKitaabDeletedTrips', JSON.stringify(deletedTrips));
            
            updateTripsStats();
            loadRecentTrips();
            loadAllTrips();
            updateDeletedTripsBin();
        }
        
        function formatDateShort(date) {
            const d = new Date(date);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }
        
        function formatDateLong(date) {
            return date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        }
        
        function formatDateTime(date) {
            return date.toLocaleString('en-US', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            });
        }
        
        // Initial load
        updateTripsStats();
        loadRecentTrips();
        updateDeletedTripsBin();
        updateTripsUIForAdmin();
        
        setTimeout(() => {
            if (window.tripsFirebaseSync) {
                window.tripsFirebaseSync.initialize();
            }
        }, 2000);
        
        console.log('Trips v2.4 ready -', savedTrips.length, 'trips,', deletedTrips.length, 'deleted');
    }
})();