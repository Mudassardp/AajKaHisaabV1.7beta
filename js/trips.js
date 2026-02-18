// trips.js - v2.2 - Trips Feature for HisaabKitaabApp v5.9
// FIXED: Trip deletion persistence - now properly syncs with Firebase

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize Trips after a short delay to ensure script.js is loaded
        setTimeout(initTrips, 500);
    });
    
    function initTrips() {
        console.log('Initializing Trips v2.2...');
        
        // ===== TRIPS STATE =====
        let savedTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
        let deletedTrips = JSON.parse(localStorage.getItem('hisaabKitaabDeletedTrips')) || [];
        let currentTripData = null;

        // Expose functions and data globally for Firebase sync
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
        
        // Check admin status from main app
        let isAdmin = localStorage.getItem('hisaabKitaabAdmin') === 'true';
        
        // ===== DOM ELEMENTS =====
        // Navigation
        const tripsBtn = document.getElementById('tripsBtn');
        const homeBtn = document.getElementById('homeBtn');
        const sheetsBtn = document.getElementById('sheetsBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        
        // Page Contents
        const homeContent = document.getElementById('homeContent');
        const sheetsContent = document.getElementById('sheetsContent');
        const tripsContent = document.getElementById('tripsContent');
        const createContent = document.getElementById('createContent');
        const settingsContent = document.getElementById('settingsContent');
        const sheetSection = document.getElementById('sheetSection');
        const editParticipantsSection = document.getElementById('editParticipantsSection');
        const tripDetailSection = document.getElementById('tripDetailSection');
        
        // Home Page Elements
        const createTripHomeBtn = document.getElementById('createTripHomeBtn');
        const recentTripsList = document.getElementById('recentTripsList');
        const viewAllTripsBtn = document.getElementById('viewAllTripsBtn');
        const totalTripsCount = document.getElementById('totalTripsCount');
        const totalTripsCard = document.getElementById('totalTripsCard');
        
        // Trips Page Elements
        const tripsList = document.getElementById('tripsList');
        const noTripsMessage = document.getElementById('noTripsMessage');
        
        // Trip Detail Elements
        const tripDetailName = document.getElementById('tripDetailName');
        const editTripBtn = document.getElementById('editTripBtn');
        const tripDetailDate = document.getElementById('tripDetailDate');
        const tripDetailDescription = document.getElementById('tripDetailDescription');
        const saveTripBtn = document.getElementById('saveTripBtn');
        const shareTripPdfBtn = document.getElementById('shareTripPdfBtn');
        const closeTripBtn = document.getElementById('closeTripBtn');
        
        // Modals
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
        
        // DELETE MODAL
        const deleteModal = document.getElementById('deleteModal');
        const deleteModalTitle = document.getElementById('deleteModalTitle');
        const deleteModalMessage = document.getElementById('deleteModalMessage');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        
        // Settings Page Elements
        const deletedTripsBinSection = document.getElementById('deletedTripsBinSection');
        const deletedTripsList = document.getElementById('deletedTripsList');
        const emptyTripsBinMessage = document.getElementById('emptyTripsBinMessage');
        const tripsBinActions = document.getElementById('tripsBinActions');
        const emptyTripsBinBtn = document.getElementById('emptyTripsBinBtn');
        const restoreAllTripsBtn = document.getElementById('restoreAllTripsBtn');
        
        // ===== SETUP EVENT LISTENERS =====
        setupEventListeners();
        
        // ===== FUNCTIONS =====
        
        function forceRefreshFromStorage() {
            console.log('Force refreshing trips from localStorage');
            savedTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
            deletedTrips = JSON.parse(localStorage.getItem('hisaabKitaabDeletedTrips')) || [];
            window.tripsManager.savedTrips = savedTrips;
            
            updateTripsStats();
            loadRecentTrips();
            loadAllTrips();
            updateDeletedTripsBin();
        }
        
        function setupEventListeners() {
            // Navigation - Trips button
            if (tripsBtn) {
                tripsBtn.addEventListener('click', function() {
                    console.log('Trips button clicked - hiding all pages');
                    hideAllPages();
                    showTripsPage();
                });
            }
            
            // Home button
            if (homeBtn) {
                homeBtn.addEventListener('click', function() {
                    console.log('Home button clicked - hiding all pages');
                    hideAllPages();
                    showHomePage();
                });
            }
            
            // Sheets button
            if (sheetsBtn) {
                sheetsBtn.addEventListener('click', function() {
                    console.log('Sheets button clicked - hiding all pages');
                    hideAllPages();
                    showSheetsPage();
                });
            }
            
            // Settings button
            if (settingsBtn) {
                settingsBtn.addEventListener('click', function() {
                    console.log('Settings button clicked - hiding all pages');
                    hideAllPages();
                    showSettingsPage();
                });
            }
            
            // Refresh button
            if (refreshBtn) {
                refreshBtn.addEventListener('click', function() {
                    if (window.tripsFirebaseSync && window.tripsFirebaseSync.isInitialized) {
                        window.tripsFirebaseSync.manualSync();
                    }
                });
            }
            
            // Home Page
            if (createTripHomeBtn) {
                createTripHomeBtn.addEventListener('click', function() {
                    if (isAdmin) {
                        showCreateTripModal();
                    } else {
                        alert('Only admin users can create trips. Please login as admin.');
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
            
            // Trip Detail
            if (editTripBtn) {
                editTripBtn.addEventListener('click', function() {
                    if (currentTripData && isAdmin) {
                        showRenameTripModal(currentTripData.id, currentTripData.name, currentTripData.description);
                    }
                });
            }
            
            if (saveTripBtn) {
                saveTripBtn.addEventListener('click', saveCurrentTrip);
            }
            
            if (shareTripPdfBtn) {
                shareTripPdfBtn.addEventListener('click', generateTripPDF);
            }
            
            if (closeTripBtn) {
                closeTripBtn.addEventListener('click', function() {
                    hideAllPages();
                    showTripsPage();
                });
            }
            
            // Create Trip Modal
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
            
            // Rename Trip Modal
            if (confirmRenameTripBtn) {
                confirmRenameTripBtn.addEventListener('click', renameTrip);
            }
            
            if (cancelRenameTripBtn) {
                cancelRenameTripBtn.addEventListener('click', hideRenameTripModal);
            }
            
            if (renameTripModal) {
                renameTripModal.addEventListener('click', function(e) {
                    if (e.target === renameTripModal) {
                        hideRenameTripModal();
                    }
                });
            }
            
            // Enter key in inputs
            if (createTripNameInput) {
                createTripNameInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        createNewTrip();
                    }
                });
            }
            
            if (renameTripInput) {
                renameTripInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        renameTrip();
                    }
                });
            }
            
            // Listen for custom event from script.js for trip deletion
            window.addEventListener('tripDeleteConfirmed', function(e) {
                console.log('Trip delete confirmed event received:', e.detail);
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
            
            // Listen for admin status changes
            window.addEventListener('storage', function(e) {
                if (e.key === 'hisaabKitaabAdmin') {
                    isAdmin = e.newValue === 'true';
                    updateTripsUIForAdmin();
                }
            });
            
            // Check admin status periodically
            setInterval(function() {
                const newAdminStatus = localStorage.getItem('hisaabKitaabAdmin') === 'true';
                if (newAdminStatus !== isAdmin) {
                    isAdmin = newAdminStatus;
                    updateTripsUIForAdmin();
                }
            }, 1000);
        }
        
        function hideAllPages() {
            console.log('Hiding all pages');
            
            if (homeContent) homeContent.classList.remove('active');
            if (sheetsContent) sheetsContent.classList.remove('active');
            if (tripsContent) tripsContent.classList.remove('active');
            if (createContent) createContent.classList.remove('active');
            if (settingsContent) settingsContent.classList.remove('active');
            if (sheetSection) sheetSection.classList.remove('active');
            if (editParticipantsSection) editParticipantsSection.classList.remove('active');
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
            console.log('Showing Home page');
            if (homeContent) homeContent.classList.add('active');
            const homeBtn = document.getElementById('homeBtn');
            if (homeBtn) homeBtn.classList.add('active');
            loadRecentTrips();
        }
        
        function showSheetsPage() {
            console.log('Showing Sheets page');
            if (sheetsContent) sheetsContent.classList.add('active');
            const sheetsBtn = document.getElementById('sheetsBtn');
            if (sheetsBtn) sheetsBtn.classList.add('active');
        }
        
        function showTripsPage() {
            console.log('Showing Trips page');
            if (tripsContent) tripsContent.classList.add('active');
            const tripsBtn = document.getElementById('tripsBtn');
            if (tripsBtn) tripsBtn.classList.add('active');
            loadAllTrips();
        }
        
        function showSettingsPage() {
            console.log('Showing Settings page');
            if (settingsContent) settingsContent.classList.add('active');
            const settingsBtn = document.getElementById('settingsBtn');
            if (settingsBtn) settingsBtn.classList.add('active');
            updateDeletedTripsBin();
        }
        
        function showPage(page) {
            hideAllPages();
            
            if (page === 'home') {
                showHomePage();
            } else if (page === 'sheets') {
                showSheetsPage();
            } else if (page === 'trips') {
                showTripsPage();
            } else if (page === 'create') {
                if (createContent) createContent.classList.add('active');
            } else if (page === 'settings') {
                showSettingsPage();
            } else if (page === 'tripDetail') {
                if (tripDetailSection) tripDetailSection.classList.add('active');
            }
        }
        
        function showCreateTripModal() {
            if (!isAdmin) {
                alert('Only admin users can create trips. Please login as admin.');
                return;
            }
            
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = String(now.getFullYear());
            const defaultName = `Trip-${day}/${month}/${year}`;
            
            createTripNameInput.value = defaultName;
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
                alert('A trip with this name already exists. Please choose a different name.');
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
            
            const sortedTrips = [...savedTrips].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
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
            
            const sortedTrips = [...savedTrips].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            const recentTrips = sortedTrips.slice(0, 3);
            
            recentTrips.forEach(trip => {
                const tripItem = createRecentTripItem(trip);
                recentTripsList.appendChild(tripItem);
            });
        }
        
        function createRecentTripItem(trip) {
            const item = document.createElement('div');
            item.className = 'recent-trip-item';
            item.addEventListener('click', function(e) {
                if (e.target.classList.contains('action-btn') || e.target.closest('.sheet-item-actions')) {
                    return;
                }
                openTrip(trip.id);
            });
            
            const displayDate = trip.createdAt ? formatDateShort(new Date(trip.createdAt)) : 'Unknown';
            const description = trip.description || 'No description';
            const truncatedDesc = description.length > 30 ? description.substring(0, 27) + '...' : description;
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div class="recent-trip-name">${trip.name}</div>
                        <div class="recent-trip-description">${truncatedDesc}</div>
                        <div class="recent-trip-date">Created: ${displayDate}</div>
                    </div>
                </div>
            `;
            
            if (isAdmin) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'sheet-item-actions';
                actionsDiv.style.cssText = `
                    display: flex;
                    gap: 8px;
                    margin-top: 10px;
                `;
                
                const editBtn = document.createElement('button');
                editBtn.className = 'btn btn-small btn-info action-btn';
                editBtn.innerHTML = '✏️';
                editBtn.style.cssText = `
                    padding: 4px 8px;
                    font-size: 11px;
                `;
                editBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showRenameTripModal(trip.id, trip.name, trip.description);
                });
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-small btn-danger action-btn';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.style.cssText = `
                    padding: 4px 8px;
                    font-size: 11px;
                `;
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showDeleteTripConfirmation(trip.id);
                });
                
                actionsDiv.appendChild(editBtn);
                actionsDiv.appendChild(deleteBtn);
                item.querySelector('div').appendChild(actionsDiv);
            }
            
            return item;
        }
        
        function createTripListItem(trip) {
            const item = document.createElement('li');
            item.className = 'trip-item';
            item.addEventListener('click', function(e) {
                if (e.target.classList.contains('action-btn') || e.target.closest('.trip-item-actions')) {
                    return;
                }
                openTrip(trip.id);
            });
            
            const displayDate = trip.createdAt ? formatDateShort(new Date(trip.createdAt)) : 'Unknown';
            const description = trip.description || 'No description';
            const truncatedDesc = description.length > 40 ? description.substring(0, 37) + '...' : description;
            
            const tripInfo = document.createElement('div');
            tripInfo.innerHTML = `
                <strong>${trip.name}</strong>
                <div class="trip-description">${truncatedDesc}</div>
                <div class="trip-date">Created: ${displayDate}</div>
            `;
            
            item.appendChild(tripInfo);
            
            if (isAdmin) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'trip-item-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'btn btn-small btn-info action-btn';
                editBtn.innerHTML = '✏️';
                editBtn.style.cssText = `
                    padding: 4px 8px;
                    font-size: 11px;
                `;
                editBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showRenameTripModal(trip.id, trip.name, trip.description);
                });
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-small btn-danger action-btn';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.style.cssText = `
                    padding: 4px 8px;
                    font-size: 11px;
                `;
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showDeleteTripConfirmation(trip.id);
                });
                
                actionsDiv.appendChild(editBtn);
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
            
            const existingBadge = tripDetailName.querySelector('.version-badge');
            if (existingBadge) existingBadge.remove();
            
            const tripBadge = document.createElement('span');
            tripBadge.className = 'version-badge';
            tripBadge.style.cssText = `
                font-size: 12px;
                background-color: #e67e22;
                color: white;
                padding: 3px 8px;
                border-radius: 12px;
                margin-left: 10px;
                cursor: default;
            `;
            tripBadge.textContent = 'Trip v1.0';
            tripDetailName.appendChild(tripBadge);
            
            tripDetailDate.textContent = `Created: ${formatDateLong(new Date(currentTripData.createdAt))}`;
            tripDetailDescription.textContent = currentTripData.description || 'No description';
            
            editTripBtn.style.display = isAdmin ? 'inline-block' : 'none';
            
            showPage('tripDetail');
        }
        
        function updateCurrentTripDisplay() {
            if (!currentTripData) return;
            
            tripDetailName.textContent = currentTripData.name;
            
            const existingBadge = tripDetailName.querySelector('.version-badge');
            if (existingBadge) existingBadge.remove();
            
            const tripBadge = document.createElement('span');
            tripBadge.className = 'version-badge';
            tripBadge.style.cssText = `
                font-size: 12px;
                background-color: #e67e22;
                color: white;
                padding: 3px 8px;
                border-radius: 12px;
                margin-left: 10px;
                cursor: default;
            `;
            tripBadge.textContent = 'Trip v1.0';
            tripDetailName.appendChild(tripBadge);
            
            tripDetailDate.textContent = `Created: ${formatDateLong(new Date(currentTripData.createdAt))}`;
            tripDetailDescription.textContent = currentTripData.description || 'No description';
        }
        
        function showRenameTripModal(tripId, currentName, currentDescription) {
            renameTripModal.dataset.tripId = tripId;
            renameTripInput.value = currentName || '';
            editTripDescriptionInput.value = currentDescription || '';
            renameTripModal.style.display = 'flex';
            
            setTimeout(() => {
                renameTripInput.focus();
                renameTripInput.select();
            }, 100);
        }
        
        function hideRenameTripModal() {
            renameTripModal.style.display = 'none';
            delete renameTripModal.dataset.tripId;
        }
        
        function renameTrip() {
            if (!isAdmin) {
                alert('Only admin users can rename trips.');
                hideRenameTripModal();
                return;
            }
            
            const tripId = renameTripModal.dataset.tripId;
            const newName = renameTripInput.value.trim();
            const newDescription = editTripDescriptionInput.value.trim();
            
            if (!tripId) {
                alert('Trip ID not found.');
                hideRenameTripModal();
                return;
            }
            
            if (!newName) {
                alert('Please enter a trip name.');
                return;
            }
            
            const tripIndex = savedTrips.findIndex(trip => trip.id === tripId);
            
            if (tripIndex === -1) {
                alert('Trip not found.');
                hideRenameTripModal();
                return;
            }
            
            const nameExists = savedTrips.some(trip => 
                trip.id !== tripId && trip.name.toLowerCase() === newName.toLowerCase()
            );
            
            if (nameExists) {
                alert('A trip with this name already exists. Please choose a different name.');
                return;
            }
            
            savedTrips[tripIndex].name = newName;
            savedTrips[tripIndex].description = newDescription;
            savedTrips[tripIndex].lastUpdated = formatDateTime(new Date());
            
            saveTripsToStorage();
            
            if (currentTripData && currentTripData.id === tripId) {
                currentTripData.name = newName;
                currentTripData.description = newDescription;
                updateCurrentTripDisplay();
            }
            
            updateTripsStats();
            loadRecentTrips();
            loadAllTrips();
            
            hideRenameTripModal();
            alert('Trip updated successfully!');
        }
        
        function showDeleteTripConfirmation(tripId) {
            console.log('Showing delete confirmation for trip:', tripId);
            
            deleteModal.dataset.tripId = tripId;
            deleteModal.dataset.type = 'trip';
            
            deleteModalTitle.textContent = 'Delete Trip';
            deleteModalMessage.textContent = 'Are you sure you want to delete this trip? It will be moved to the bin and can be restored later.';
            
            deleteModal.style.display = 'flex';
        }
        
        function hideDeleteModal() {
            deleteModal.style.display = 'none';
            delete deleteModal.dataset.tripId;
            delete deleteModal.dataset.type;
        }
        
        function deleteTripById(tripId) {
            console.log('Deleting trip by ID:', tripId);
            
            const tripIndex = savedTrips.findIndex(trip => trip.id === tripId);
            
            if (tripIndex === -1) {
                alert('Trip not found.');
                return;
            }
            
            const trip = savedTrips[tripIndex];
            
            // Add to deleted trips
            trip.deletedDate = new Date().toISOString();
            deletedTrips.push(trip);
            saveDeletedTripsToStorage();
            
            // Remove from saved trips
            savedTrips.splice(tripIndex, 1);
            
            // Update window reference
            window.tripsManager.savedTrips = savedTrips;
            
            // Save to storage (this will also sync to Firebase)
            saveTripsToStorage();
            
            // If this is the current open trip, navigate away
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
        
        function saveCurrentTrip() {
            if (!currentTripData || !isAdmin) {
                alert('You do not have permission to save this trip.');
                return;
            }
            
            currentTripData.lastUpdated = formatDateTime(new Date());
            
            const existingIndex = savedTrips.findIndex(trip => trip.id === currentTripData.id);
            if (existingIndex !== -1) {
                savedTrips[existingIndex] = JSON.parse(JSON.stringify(currentTripData));
            } else {
                savedTrips.push(JSON.parse(JSON.stringify(currentTripData)));
            }
            
            saveTripsToStorage();
            
            updateTripsStats();
            alert('Trip saved successfully!');
        }
        
        function generateTripPDF() {
            if (!currentTripData) {
                alert('No trip data available to share');
                return;
            }
            
            alert('PDF generation for trips will be available in a future update!');
        }
        
        function updateTripsStats() {
            if (totalTripsCount) {
                totalTripsCount.textContent = savedTrips.length;
            }
        }
        
        function updateTripsUIForAdmin() {
            console.log('Updating UI for admin status:', isAdmin);
            
            if (createTripHomeBtn) {
                createTripHomeBtn.style.display = isAdmin ? 'block' : 'none';
            }
            
            loadRecentTrips();
            loadAllTrips();
            updateDeletedTripsBin();
            
            if (editTripBtn) {
                editTripBtn.style.display = isAdmin && currentTripData ? 'inline-block' : 'none';
            }
            
            if (deletedTripsBinSection) {
                deletedTripsBinSection.style.display = isAdmin ? 'block' : 'none';
            }
        }
        
        function saveTripsToStorage() {
            console.log('Saving trips to storage:', savedTrips.length);
            localStorage.setItem('hisaabKitaabTrips', JSON.stringify(savedTrips));
            window.tripsManager.savedTrips = savedTrips;
            updateTripsStats();
            
            // Sync to Firebase if available
            if (window.tripsFirebaseSync && window.tripsFirebaseSync.isInitialized) {
                window.tripsFirebaseSync.saveTripsToCloud(savedTrips);
            }
        }
        
        function saveDeletedTripsToStorage() {
            console.log('Saving deleted trips to storage:', deletedTrips.length);
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
            
            const sortedDeletedTrips = [...deletedTrips].sort((a, b) => {
                return new Date(b.deletedDate) - new Date(a.deletedDate);
            });
            
            deletedTripsList.innerHTML = '';
            
            sortedDeletedTrips.forEach(trip => {
                const tripItem = document.createElement('li');
                tripItem.className = 'trip-item deleted-trip-item';
                
                const displayDate = trip.deletedDate ? formatDateTime(new Date(trip.deletedDate)) : 'Unknown';
                const description = trip.description || 'No description';
                
                tripItem.innerHTML = `
                    <div>
                        <strong>${trip.name}</strong>
                        <div class="trip-description">${description}</div>
                        <div class="trip-date">Deleted: ${displayDate}</div>
                    </div>
                    <div class="trip-item-actions">
                        <button class="btn btn-small btn-success restore-trip-btn" data-id="${trip.id}">Restore</button>
                        <button class="btn btn-small btn-danger permanent-delete-trip-btn" data-id="${trip.id}">Delete</button>
                    </div>
                `;
                
                deletedTripsList.appendChild(tripItem);
            });
            
            // Re-attach event listeners
            document.querySelectorAll('.restore-trip-btn').forEach(btn => {
                btn.removeEventListener('click', handleRestoreClick);
                btn.addEventListener('click', handleRestoreClick);
            });
            
            document.querySelectorAll('.permanent-delete-trip-btn').forEach(btn => {
                btn.removeEventListener('click', handlePermanentDeleteClick);
                btn.addEventListener('click', handlePermanentDeleteClick);
            });
        }
        
        function handleRestoreClick(e) {
            e.stopPropagation();
            restoreDeletedTrip(this.dataset.id);
        }
        
        function handlePermanentDeleteClick(e) {
            e.stopPropagation();
            permanentlyDeleteTrip(this.dataset.id);
        }
        
        function restoreDeletedTrip(tripId) {
            console.log('Restoring deleted trip:', tripId);
            
            const tripIndex = deletedTrips.findIndex(trip => trip.id === tripId);
            if (tripIndex === -1) {
                alert('Trip not found in bin.');
                return;
            }
            
            const trip = deletedTrips[tripIndex];
            
            // Remove from deleted trips
            deletedTrips.splice(tripIndex, 1);
            saveDeletedTripsToStorage();
            
            // Add back to saved trips
            savedTrips.push(trip);
            
            // Update window reference
            window.tripsManager.savedTrips = savedTrips;
            
            // Save to storage (this will also sync to Firebase)
            saveTripsToStorage();
            
            // Refresh UI
            updateTripsStats();
            loadRecentTrips();
            loadAllTrips();
            updateDeletedTripsBin();
            
            alert('Trip restored successfully!');
        }
        
        function permanentlyDeleteTrip(tripId) {
            console.log('Permanently deleting trip:', tripId);
            
            if (!confirm('Permanently delete this trip? This action cannot be undone.')) {
                return;
            }
            
            const tripIndex = deletedTrips.findIndex(trip => trip.id === tripId);
            if (tripIndex === -1) {
                alert('Trip not found in bin.');
                return;
            }
            
            deletedTrips.splice(tripIndex, 1);
            saveDeletedTripsToStorage();
            
            updateDeletedTripsBin();
            
            alert('Trip permanently deleted!');
        }
        
        function emptyTripsBin() {
            console.log('Emptying trips bin');
            
            if (!confirm('Empty the entire trips bin? This will permanently delete all trips in the bin.')) {
                return;
            }
            
            deletedTrips = [];
            saveDeletedTripsToStorage();
            
            updateDeletedTripsBin();
            
            alert('Trips bin emptied successfully!');
        }
        
        function restoreAllTrips() {
            console.log('Restoring all deleted trips');
            
            if (deletedTrips.length === 0) {
                alert('No trips to restore.');
                return;
            }
            
            if (!confirm(`Restore all ${deletedTrips.length} deleted trips?`)) {
                return;
            }
            
            // Add all deleted trips back to saved trips
            deletedTrips.forEach(trip => {
                savedTrips.push(trip);
            });
            
            // Update window reference
            window.tripsManager.savedTrips = savedTrips;
            
            // Save to storage (this will also sync to Firebase)
            saveTripsToStorage();
            
            // Clear deleted trips
            deletedTrips = [];
            saveDeletedTripsToStorage();
            
            // Refresh UI
            updateTripsStats();
            loadRecentTrips();
            loadAllTrips();
            updateDeletedTripsBin();
            
            alert('All trips restored successfully!');
        }
        
        // ===== UTILITY FUNCTIONS =====
        
        function formatDateShort(date) {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = String(d.getFullYear());
            return `${day}/${month}/${year}`;
        }
        
        function formatDateLong(date) {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        function formatDateTime(date) {
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        }
        
        // ===== INITIAL LOAD =====
        function init() {
            savedTrips = JSON.parse(localStorage.getItem('hisaabKitaabTrips')) || [];
            deletedTrips = JSON.parse(localStorage.getItem('hisaabKitaabDeletedTrips')) || [];
            window.tripsManager.savedTrips = savedTrips;
            
            updateTripsStats();
            loadRecentTrips();
            updateDeletedTripsBin();
            updateTripsUIForAdmin();
            
            setTimeout(() => {
                if (window.tripsFirebaseSync) {
                    window.tripsFirebaseSync.initialize();
                }
            }, 2000);
            
            console.log('Trips v2.2 initialized successfully!');
            console.log('Saved Trips:', savedTrips.length);
            console.log('Admin status:', isAdmin);
        }
        
        init();
    }
})();