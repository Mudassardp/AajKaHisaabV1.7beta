// script.js - Mobile App Redesign v4.5.4 - Fixed Create Button
document.addEventListener('DOMContentLoaded', function() {
    // ===== GLOBAL STATE =====
    let selectedParticipants = [];
    let currentSheetData = null;
    let savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
    let deletedSheets = JSON.parse(localStorage.getItem('hisaabKitaabDeletedSheets')) || [];
    let isAdmin = localStorage.getItem('hisaabKitaabAdmin') === 'true';
    let defaultParticipants = JSON.parse(localStorage.getItem('hisaabKitaabDefaultParticipants')) || [
        "Rizwan", "Aarif", "Abdul Razzaq", "Haris", "Mauzam", 
        "Masif", "Mudassar", "Shahid", "Mansoor Kotawdekar", 
        "Mansoor Wasta", "Mohsin", "Ubedulla", "Abdul Alim", "Sabir", "Aftab", "Sikandar", "Asif"
    ];
    
    const ADMIN_PASSWORD = "226622";
    
    // ===== DOM ELEMENTS =====
    // Navigation
    const homeBtn = document.getElementById('homeBtn');
    const sheetsBtn = document.getElementById('sheetsBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    // Page Contents
    const homeContent = document.getElementById('homeContent');
    const sheetsContent = document.getElementById('sheetsContent');
    const createContent = document.getElementById('createContent');
    const settingsContent = document.getElementById('settingsContent');
    const sheetSection = document.getElementById('sheetSection');
    const editParticipantsSection = document.getElementById('editParticipantsSection');
    
    // Home Page Elements
    const createQuickBtn = document.getElementById('createQuickBtn');
    const viewAllSheetsBtn = document.getElementById('viewAllSheetsBtn');
    const recentSheetsList = document.getElementById('recentSheetsList');
    const totalSheetsCount = document.getElementById('totalSheetsCount');
    const totalParticipantsCount = document.getElementById('totalParticipantsCount');
    const defaultParticipantsCard = document.getElementById('defaultParticipantsCard');
    const totalSheetsCard = document.getElementById('totalSheetsCard');
    
    // Sheets Page Elements
    const syncSheetsBtn = document.getElementById('syncSheetsBtn');
    const sheetsFilterContainer = document.getElementById('sheetsFilterContainer');
    const filterTabsContainer = document.getElementById('filterTabsContainer');
    const allSheetsTab = document.getElementById('allSheetsTab');
    const publishedSheetsTab = document.getElementById('publishedSheetsTab');
    const unpublishedSheetsTab = document.getElementById('unpublishedSheetsTab');
    const sheetsList = document.getElementById('sheetsList');
    const noSheetsMessage = document.getElementById('noSheetsMessage');
    
    // Create Page Elements
    const cancelCreateBtn = document.getElementById('cancelCreateBtn');
    const createParticipantsList = document.getElementById('createParticipantsList');
    const customParticipantInput = document.getElementById('customParticipantInput');
    const addCustomParticipantBtn = document.getElementById('addCustomParticipantBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const createSheetBtn = document.getElementById('createSheetBtn');
    
    // Settings Page Elements
    const loginSection = document.getElementById('loginSection');
    const adminSection = document.getElementById('adminSection');
    const loginAsAdminBtn = document.getElementById('loginAsAdminBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const themeToggle = document.getElementById('themeToggle');
    const autoSyncToggle = document.getElementById('autoSyncToggle');
    const defaultParticipantsBtn = document.getElementById('defaultParticipantsBtn');
    const manualSyncBtn = document.getElementById('manualSyncBtn');
    const deletedSheetsBinSection = document.getElementById('deletedSheetsBinSection');
    
    // Sheet Page Elements
    const closeSheetBtn = document.getElementById('closeSheetBtn');
    const mobileSheetName = document.getElementById('mobileSheetName');
    const togglePublishBtn = document.getElementById('togglePublishBtn');
    const publishIcon = document.getElementById('publishIcon');
    const sheetDate = document.getElementById('sheetDate');
    const sheetParticipants = document.getElementById('sheetParticipants');
    const tableBody = document.getElementById('tableBody');
    const calculateBtn = document.getElementById('calculateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const sharePdfBtn = document.getElementById('sharePdfBtn');
    const editParticipantsBtn = document.getElementById('editParticipantsBtn');
    const adminSheetActions = document.getElementById('adminSheetActions');
    const totalParticipants = document.getElementById('totalParticipants');
    const totalSpent = document.getElementById('totalSpent');
    const costPerMeal = document.getElementById('costPerMeal');
    const settlementList = document.getElementById('settlementList');
    
    // Edit Participants Elements
    const backToSheetBtn = document.getElementById('backToSheetBtn');
    const editCustomParticipantInput = document.getElementById('editCustomParticipantInput');
    const editAddCustomParticipantBtn = document.getElementById('editAddCustomParticipantBtn');
    const editParticipantsList = document.getElementById('editParticipantsList');
    const updateParticipantsBtn = document.getElementById('updateParticipantsBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    
    // Modal Elements
    const adminLoginModal = document.getElementById('adminLoginModal');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const confirmAdminLoginBtn = document.getElementById('confirmAdminLoginBtn');
    const cancelAdminLoginBtn = document.getElementById('cancelAdminLoginBtn');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const defaultParticipantsModal = document.getElementById('defaultParticipantsModal');
    const closeDefaultParticipantsBtn = document.getElementById('closeDefaultParticipantsBtn');
    
    // Rename Sheet Modal
    const renameSheetModal = document.getElementById('renameSheetModal');
    const renameSheetInput = document.getElementById('renameSheetInput');
    const confirmRenameBtn = document.getElementById('confirmRenameBtn');
    const cancelRenameBtn = document.getElementById('cancelRenameBtn');
    
    // Deleted Sheets Bin Elements (in Settings)
    const emptyBinBtn = document.getElementById('emptyBinBtn');
    const restoreAllBtn = document.getElementById('restoreAllBtn');
    const deletedSheetsList = document.getElementById('deletedSheetsList');
    const emptyBinMessage = document.getElementById('emptyBinMessage');
    const binActions = document.getElementById('binActions');
    const addDefaultParticipantBtn = document.getElementById('addDefaultParticipantBtn');
    const newDefaultParticipantInput = document.getElementById('newDefaultParticipantInput');
    
    // ===== INITIALIZATION =====
    initApp();
    
    function initApp() {
        defaultParticipants.sort(alphabeticalSort);
        setupEventListeners();
        updateUIForUserRole();
        applyTheme();
        updateHomeStats();
        loadRecentSheets();
        loadAllSheets();
        updateDeletedSheetsBin();
        
        if (window.profileManager) {
            window.profileManager.init();
        }
        
        setTimeout(() => {
            if (window.firebaseSync && typeof firebase !== 'undefined') {
                try {
                    window.firebaseSync.initialize();
                } catch (error) {
                    console.log('Firebase initialization skipped for local testing:', error.message);
                }
            }
        }, 1000);
        
        showPage('home');
        createPWAInstallButton();
    }
    
    function setupEventListeners() {
        // Navigation
        homeBtn.addEventListener('click', () => showPage('home'));
        sheetsBtn.addEventListener('click', () => showPage('sheets'));
        refreshBtn.addEventListener('click', refreshApp);
        settingsBtn.addEventListener('click', () => showPage('settings'));
        
        // Home Page - FIXED: Keep createQuickBtn event listener
        createQuickBtn.addEventListener('click', () => {
            if (isAdmin) {
                showPage('create');
            } else {
                alert('Only admin users can create new sheets. Please login as admin.');
            }
        });
        
        viewAllSheetsBtn.addEventListener('click', () => showPage('sheets'));
        defaultParticipantsCard.addEventListener('click', () => {
            defaultParticipantsModal.style.display = 'flex';
            updateDefaultParticipantsList();
        });
        totalSheetsCard.addEventListener('click', () => showPage('sheets'));
        
        // Sheets Page
        syncSheetsBtn.addEventListener('click', handleSync);
        allSheetsTab.addEventListener('click', () => filterSheets('all'));
        publishedSheetsTab.addEventListener('click', () => filterSheets('published'));
        unpublishedSheetsTab.addEventListener('click', () => filterSheets('unpublished'));
        
        // Create Page
        cancelCreateBtn.addEventListener('click', () => showPage('home'));
        addCustomParticipantBtn.addEventListener('click', () => addCustomParticipant(customParticipantInput, createParticipantsList));
        customParticipantInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addCustomParticipant(customParticipantInput, createParticipantsList);
        });
        selectAllBtn.addEventListener('click', selectAllParticipants);
        deselectAllBtn.addEventListener('click', deselectAllParticipants);
        createSheetBtn.addEventListener('click', createNewSheet);
        
        // Settings Page
        loginAsAdminBtn.addEventListener('click', showAdminLoginModal);
        logoutBtn.addEventListener('click', handleLogout);
        themeToggle.addEventListener('change', toggleTheme);
        manualSyncBtn.addEventListener('click', handleSync);
        defaultParticipantsBtn.addEventListener('click', () => {
            defaultParticipantsModal.style.display = 'flex';
            updateDefaultParticipantsList();
        });
        
        // Sheet Page
        closeSheetBtn.addEventListener('click', () => showPage('sheets'));
        togglePublishBtn.addEventListener('click', togglePublishSheet);
        calculateBtn.addEventListener('click', calculateShares);
        saveBtn.addEventListener('click', saveSheet);
        sharePdfBtn.addEventListener('click', handlePDFGeneration);
        editParticipantsBtn.addEventListener('click', openEditParticipants);
        
        // Sheet Name Click - Rename sheet from sheet view
        mobileSheetName.addEventListener('click', function(e) {
            // Only allow renaming for admin
            if (isAdmin && currentSheetData) {
                // Don't trigger if clicking on version badge
                if (e.target.classList.contains('version-badge')) {
                    return;
                }
                showRenameSheetModal(currentSheetData.id, currentSheetData.name);
            }
        });
        
        // Edit Participants
        backToSheetBtn.addEventListener('click', () => showPage('sheet'));
        editAddCustomParticipantBtn.addEventListener('click', () => addCustomParticipantToEdit(editCustomParticipantInput, editParticipantsList));
        editCustomParticipantInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addCustomParticipantToEdit(editCustomParticipantInput, editParticipantsList);
        });
        updateParticipantsBtn.addEventListener('click', updateParticipants);
        cancelEditBtn.addEventListener('click', () => showPage('sheet'));
        
        // Modals
        confirmAdminLoginBtn.addEventListener('click', handleAdminLogin);
        cancelAdminLoginBtn.addEventListener('click', hideAdminLoginModal);
        confirmDeleteBtn.addEventListener('click', deleteCurrentSheet);
        cancelDeleteBtn.addEventListener('click', hideDeleteConfirmation);
        closeDefaultParticipantsBtn.addEventListener('click', () => defaultParticipantsModal.style.display = 'none');
        
        // Rename Sheet Modal
        confirmRenameBtn.addEventListener('click', renameSheet);
        cancelRenameBtn.addEventListener('click', hideRenameSheetModal);
        renameSheetInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                renameSheet();
            }
        });
        
        // Default Participants Modal
        addDefaultParticipantBtn.addEventListener('click', addDefaultParticipant);
        newDefaultParticipantInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addDefaultParticipant();
        });
        
        // Deleted Sheets Bin Actions
        emptyBinBtn.addEventListener('click', emptyDeletedSheetsBin);
        restoreAllBtn.addEventListener('click', restoreAllDeletedSheets);
        
        window.addEventListener('click', (e) => {
            if (e.target === adminLoginModal) hideAdminLoginModal();
            if (e.target === deleteModal) hideDeleteConfirmation();
            if (e.target === defaultParticipantsModal) defaultParticipantsModal.style.display = 'none';
            if (e.target === renameSheetModal) hideRenameSheetModal();
        });
    }
    
    // ===== SHEET RENAMING FUNCTIONS =====
    
    function showRenameSheetModal(sheetId, currentName) {
        renameSheetModal.dataset.sheetId = sheetId;
        renameSheetInput.value = currentName;
        renameSheetModal.style.display = 'flex';
        setTimeout(() => {
            renameSheetInput.focus();
            renameSheetInput.select();
        }, 100);
    }
    
    function hideRenameSheetModal() {
        renameSheetModal.style.display = 'none';
        renameSheetInput.value = '';
        delete renameSheetModal.dataset.sheetId;
    }
    
    function renameSheet() {
        if (!isAdmin) {
            alert('Only admin users can rename sheets.');
            hideRenameSheetModal();
            return;
        }
        
        const sheetId = renameSheetModal.dataset.sheetId;
        const newName = renameSheetInput.value.trim();
        
        if (!sheetId) {
            alert('Sheet ID not found.');
            hideRenameSheetModal();
            return;
        }
        
        if (!newName) {
            alert('Please enter a sheet name.');
            return;
        }
        
        // Check if name already exists
        const nameExists = savedSheets.some(sheet => 
            sheet.id !== sheetId && sheet.name.toLowerCase() === newName.toLowerCase()
        );
        
        if (nameExists) {
            alert('A sheet with this name already exists. Please choose a different name.');
            return;
        }
        
        // Find and update the sheet
        const sheetIndex = savedSheets.findIndex(sheet => sheet.id === sheetId);
        
        if (sheetIndex === -1) {
            alert('Sheet not found.');
            hideRenameSheetModal();
            return;
        }
        
        // Store old name for reference
        const oldName = savedSheets[sheetIndex].name;
        
        // Update sheet name
        savedSheets[sheetIndex].name = newName;
        savedSheets[sheetIndex].lastUpdated = formatDateTime(new Date());
        
        // Save to localStorage
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        // Sync to Firebase
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        // If this is the current open sheet, update the UI
        if (currentSheetData && currentSheetData.id === sheetId) {
            currentSheetData.name = newName;
            mobileSheetName.textContent = newName;
            
            // Re-add version badge
            const versionBadge = document.createElement('span');
            versionBadge.className = 'version-badge';
            versionBadge.style.cssText = `
                font-size: 12px;
                background-color: ${currentSheetData.version === 'v4.0' ? '#9b59b6' : '#7f8c8d'};
                color: white;
                padding: 3px 8px;
                border-radius: 12px;
                margin-left: 10px;
            `;
            versionBadge.textContent = currentSheetData.version === 'v4.0' ? 'v4.0' : 'v3.0';
            mobileSheetName.appendChild(versionBadge);
        }
        
        // Refresh UI
        updateHomeStats();
        loadRecentSheets();
        loadAllSheets();
        
        hideRenameSheetModal();
        alert(`Sheet renamed from "${oldName}" to "${newName}"`);
    }
    
    // ===== SHEET DELETION FUNCTIONS =====
    
    function showDeleteConfirmationForSheet(sheetId) {
        deleteModal.dataset.sheetId = sheetId;
        deleteModal.style.display = 'flex';
    }
    
    function hideDeleteConfirmation() {
        deleteModal.style.display = 'none';
        delete deleteModal.dataset.sheetId;
    }
    
    function deleteSheetById(sheetId) {
        const sheetIndex = savedSheets.findIndex(sheet => sheet.id === sheetId);
        
        if (sheetIndex === -1) {
            alert('Sheet not found.');
            return;
        }
        
        const sheet = savedSheets[sheetIndex];
        
        // Add to deleted sheets
        sheet.deletedDate = new Date().toISOString();
        deletedSheets.push(sheet);
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(deletedSheets));
        
        // Remove from saved sheets
        savedSheets.splice(sheetIndex, 1);
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        // Sync to Firebase
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        // If this is the current open sheet, navigate away
        if (currentSheetData && currentSheetData.id === sheetId) {
            currentSheetData = null;
            selectedParticipants = [];
            showPage('sheets');
        }
        
        // Refresh UI
        updateHomeStats();
        loadRecentSheets();
        loadAllSheets();
        updateDeletedSheetsBin();
        
        alert('Sheet moved to bin!');
    }
    
    // ===== PAGE MANAGEMENT =====
    function showPage(page) {
        homeContent.classList.remove('active');
        sheetsContent.classList.remove('active');
        createContent.classList.remove('active');
        settingsContent.classList.remove('active');
        sheetSection.classList.remove('active');
        editParticipantsSection.classList.remove('active');
        
        homeBtn.classList.remove('active');
        sheetsBtn.classList.remove('active');
        settingsBtn.classList.remove('active');
        
        switch(page) {
            case 'home':
                homeContent.classList.add('active');
                homeBtn.classList.add('active');
                updateHomeStats();
                loadRecentSheets();
                break;
            case 'sheets':
                sheetsContent.classList.add('active');
                sheetsBtn.classList.add('active');
                loadAllSheets();
                updateFilterTabsVisibility();
                break;
            case 'create':
                if (isAdmin) {
                    createContent.classList.add('active');
                    loadCreateParticipants();
                } else {
                    showPage('home');
                    alert('Only admin users can create new sheets. Please login as admin.');
                }
                break;
            case 'settings':
                settingsContent.classList.add('active');
                settingsBtn.classList.add('active');
                updateSettingsUI();
                updateDeletedSheetsBin();
                break;
            case 'sheet':
                sheetSection.classList.add('active');
                break;
            case 'editParticipants':
                editParticipantsSection.classList.add('active');
                break;
        }
        
        if (page === 'sheet' || page === 'editParticipants') {
            homeBtn.classList.remove('active');
            sheetsBtn.classList.remove('active');
            settingsBtn.classList.remove('active');
        }
    }
    
    function refreshApp() {
        savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
        updateHomeStats();
        loadRecentSheets();
        loadAllSheets();
        updateDeletedSheetsBin();
        
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.manualSync();
        }
        
        alert('App refreshed!');
    }
    
    function updateHomeStats() {
        totalSheetsCount.textContent = savedSheets.length;
        totalParticipantsCount.textContent = defaultParticipants.length;
        updateCreateButtonVisibility();
    }
    
    function updateCreateButtonVisibility() {
        if (isAdmin) {
            createQuickBtn.style.display = 'block';
        } else {
            createQuickBtn.style.display = 'none';
        }
    }
    
    function loadRecentSheets() {
        recentSheetsList.innerHTML = '';
        
        if (savedSheets.length === 0) {
            recentSheetsList.innerHTML = '<div class="no-recent-sheets">No recent sheets found.</div>';
            return;
        }
        
        const sortedSheets = [...savedSheets].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        const recentSheets = sortedSheets.slice(0, 3);
        let visibleSheetsCount = 0;
        
        recentSheets.forEach(sheet => {
            if (!isAdmin && !sheet.published) {
                return;
            }
            
            visibleSheetsCount++;
            const sheetItem = document.createElement('div');
            sheetItem.className = 'recent-sheet-item';
            sheetItem.addEventListener('click', (e) => {
                // Don't open sheet if clicking on action buttons
                if (e.target.classList.contains('action-btn') || e.target.closest('.sheet-item-actions')) {
                    return;
                }
                openSheet(sheet.id);
            });
            
            const displayDate = sheet.createdAt ? formatDateTime(new Date(sheet.createdAt)) : 'Unknown Date';
            
            sheetItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div class="recent-sheet-name">${sheet.name}</div>
                        <div class="recent-sheet-date">Created: ${displayDate}</div>
                        <div style="font-size: 11px; color: ${sheet.version === 'v4.0' ? '#9b59b6' : '#7f8c8d'}; margin-top: 4px;">${sheet.version || 'v3.0'} ${sheet.version === 'v4.0' ? '• Equal Split' : ''}</div>
                    </div>
                </div>
            `;
            
            // Add action buttons for admin (rename and delete)
            if (isAdmin) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'sheet-item-actions';
                actionsDiv.style.cssText = `
                    display: flex;
                    gap: 8px;
                    margin-top: 10px;
                `;
                
                const renameBtn = document.createElement('button');
                renameBtn.className = 'btn btn-small btn-info action-btn';
                renameBtn.innerHTML = '✏️';
                renameBtn.style.cssText = `
                    padding: 4px 8px;
                    font-size: 11px;
                `;
                renameBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showRenameSheetModal(sheet.id, sheet.name);
                });
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-small btn-danger action-btn';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.style.cssText = `
                    padding: 4px 8px;
                    font-size: 11px;
                `;
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDeleteConfirmationForSheet(sheet.id);
                });
                
                actionsDiv.appendChild(renameBtn);
                actionsDiv.appendChild(deleteBtn);
                sheetItem.querySelector('div').appendChild(actionsDiv);
            }
            
            recentSheetsList.appendChild(sheetItem);
        });
        
        if (visibleSheetsCount === 0) {
            recentSheetsList.innerHTML = '<div class="no-recent-sheets">No recent sheets found.</div>';
        }
    }
    
    function loadAllSheets() {
        sheetsList.innerHTML = '';
        
        const visibleSheets = isAdmin ? savedSheets : savedSheets.filter(sheet => sheet.published);
        
        if (visibleSheets.length === 0) {
            noSheetsMessage.style.display = 'block';
            sheetsList.style.display = 'none';
            return;
        }
        
        noSheetsMessage.style.display = 'none';
        sheetsList.style.display = 'block';
        
        const sortedSheets = [...visibleSheets].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        sortedSheets.forEach(sheet => {
            const sheetItem = createSheetListItem(sheet);
            sheetsList.appendChild(sheetItem);
        });
    }
    
    function createSheetListItem(sheet) {
        const sheetItem = document.createElement('li');
        sheetItem.className = 'sheet-item';
        sheetItem.addEventListener('click', (e) => {
            // Don't open sheet if clicking on action buttons
            if (e.target.classList.contains('action-btn') || e.target.closest('.sheet-item-actions')) {
                return;
            }
            openSheet(sheet.id);
        });
        
        const sheetInfo = document.createElement('div');
        const displayDate = sheet.createdAt ? formatDateTime(new Date(sheet.createdAt)) : 'Unknown Date';
        
        let publishedIndicator = '';
        if (sheet.published) {
            publishedIndicator = '<span style="color: var(--success-color); font-size: 0.8rem; margin-left: 8px;">📢 Published</span>';
        } else {
            publishedIndicator = '<span style="color: var(--warning-color); font-size: 0.8rem; margin-left: 8px;">🔒 Unpublished</span>';
        }
        
        const version = sheet.version || 'v3.0';
        const versionColor = version === 'v4.0' ? '#9b59b6' : '#7f8c8d';
        const versionText = version === 'v4.0' ? '• Equal Split' : '';
        
        sheetInfo.innerHTML = `
            <strong>${sheet.name}</strong>
            <div class="sheet-date">Created: ${displayDate} ${publishedIndicator}</div>
            <div style="font-size: 11px; color: ${versionColor}; margin-top: 4px;">${version} ${versionText}</div>
        `;
        
        sheetItem.appendChild(sheetInfo);
        
        // Add action buttons for admin (rename and delete)
        if (isAdmin) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'sheet-item-actions';
            actionsDiv.style.cssText = `
                display: flex;
                gap: 8px;
                margin-left: 10px;
            `;
            
            const renameBtn = document.createElement('button');
            renameBtn.className = 'btn btn-small btn-info action-btn';
            renameBtn.innerHTML = '✏️';
            renameBtn.style.cssText = `
                padding: 4px 8px;
                font-size: 11px;
            `;
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showRenameSheetModal(sheet.id, sheet.name);
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-small btn-danger action-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.style.cssText = `
                padding: 4px 8px;
                font-size: 11px;
            `;
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showDeleteConfirmationForSheet(sheet.id);
            });
            
            actionsDiv.appendChild(renameBtn);
            actionsDiv.appendChild(deleteBtn);
            sheetItem.appendChild(actionsDiv);
        }
        
        return sheetItem;
    }
    
    function filterSheets(filter) {
        allSheetsTab.classList.remove('active');
        publishedSheetsTab.classList.remove('active');
        unpublishedSheetsTab.classList.remove('active');
        
        switch(filter) {
            case 'all':
                allSheetsTab.classList.add('active');
                loadAllSheets();
                break;
            case 'published':
                publishedSheetsTab.classList.add('active');
                const publishedSheets = savedSheets.filter(sheet => sheet.published);
                displayFilteredSheets(publishedSheets);
                break;
            case 'unpublished':
                unpublishedSheetsTab.classList.add('active');
                const unpublishedSheets = savedSheets.filter(sheet => !sheet.published);
                displayFilteredSheets(unpublishedSheets);
                break;
        }
    }
    
    function displayFilteredSheets(filteredSheets) {
        sheetsList.innerHTML = '';
        
        if (filteredSheets.length === 0) {
            noSheetsMessage.style.display = 'block';
            sheetsList.style.display = 'none';
            noSheetsMessage.textContent = 'No sheets found for this filter.';
            return;
        }
        
        noSheetsMessage.style.display = 'none';
        sheetsList.style.display = 'block';
        
        filteredSheets.forEach(sheet => {
            const sheetItem = createSheetListItem(sheet);
            sheetsList.appendChild(sheetItem);
        });
    }
    
    function updateFilterTabsVisibility() {
        if (isAdmin) {
            sheetsFilterContainer.style.display = 'block';
            filterTabsContainer.style.display = 'flex';
        } else {
            sheetsFilterContainer.style.display = 'none';
        }
    }
    
    function loadCreateParticipants() {
        createParticipantsList.innerHTML = '';
        
        defaultParticipants.forEach(participantName => {
            addParticipantToCreateList(participantName);
        });
        
        customParticipantInput.value = '';
    }
    
    function addParticipantToCreateList(participantName) {
        const participantItem = document.createElement('li');
        participantItem.className = 'participant';
        
        const participantWithAvatar = document.createElement('div');
        participantWithAvatar.className = 'participant-with-avatar';
        
        let avatar;
        if (window.profileManager) {
            avatar = window.profileManager.createAvatarElement(participantName);
        } else {
            avatar = document.createElement('div');
            avatar.className = 'participant-avatar-small';
            avatar.style.backgroundColor = '#3498db';
            avatar.style.color = 'white';
            avatar.textContent = participantName.charAt(0).toUpperCase();
        }
        
        participantWithAvatar.appendChild(avatar);
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'participant-name';
        nameSpan.textContent = participantName;
        nameSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.profileManager) {
                window.profileManager.openProfileCard(participantName);
            }
        });
        participantWithAvatar.appendChild(nameSpan);
        
        participantItem.appendChild(participantWithAvatar);
        
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';
        checkboxContainer.innerHTML = `<input type="checkbox" id="participant_${participantName.replace(/\s+/g, '_')}" value="${participantName}" checked>`;
        
        participantItem.appendChild(checkboxContainer);
        createParticipantsList.appendChild(participantItem);
    }
    
    function selectAllParticipants() {
        const checkboxes = document.querySelectorAll('#createParticipantsList input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }
    
    function deselectAllParticipants() {
        const checkboxes = document.querySelectorAll('#createParticipantsList input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    function addCustomParticipant(inputElement, listElement) {
        const customName = inputElement.value.trim();
        if (!customName) {
            alert('Please enter a participant name');
            return;
        }
        
        if (defaultParticipants.includes(customName)) {
            alert('This participant already exists in the default list');
            inputElement.value = '';
            return;
        }
        
        const existingParticipants = Array.from(listElement.children).map(item => 
            item.querySelector('.participant-name').textContent
        );
        
        if (existingParticipants.includes(customName)) {
            alert('This participant already exists in the list');
            inputElement.value = '';
            return;
        }
        
        defaultParticipants.push(customName);
        defaultParticipants.sort(alphabeticalSort);
        saveDefaultParticipants();
        
        addParticipantToCreateList(customName);
        inputElement.value = '';
        
        updateHomeStats();
        alert(`"${customName}" added successfully!`);
    }
    
    function addCustomParticipantToEdit(inputElement, listElement) {
        const customName = inputElement.value.trim();
        if (!customName) {
            alert('Please enter a participant name');
            return;
        }
        
        const existingParticipants = Array.from(listElement.children).map(item => 
            item.querySelector('.edit-participant-name').textContent
        );
        
        if (existingParticipants.includes(customName)) {
            alert('This participant already exists in the list');
            inputElement.value = '';
            return;
        }
        
        addParticipantToEditList(customName);
        inputElement.value = '';
    }
    
    function addParticipantToEditList(participantName) {
        const participantItem = document.createElement('li');
        participantItem.className = 'edit-participant-item';
        participantItem.innerHTML = `
            <span class="edit-participant-name">${participantName}</span>
            <button class="remove-participant-btn" title="Remove Participant">🗑️</button>
        `;
        
        participantItem.querySelector('.remove-participant-btn').addEventListener('click', function() {
            participantItem.remove();
        });
        
        editParticipantsList.appendChild(participantItem);
    }
    
    function createNewSheet() {
        selectedParticipants = [];
        const checkboxes = document.querySelectorAll('#createParticipantsList input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            selectedParticipants.push(checkbox.value);
        });
        
        if (selectedParticipants.length === 0) {
            alert('Please select at least one participant');
            return;
        }
        
        selectedParticipants.sort(alphabeticalSort);
        
        const now = new Date();
        const dateString = formatDateYYYYMMDD(now);
        
        let sheetNameBase = `Hisaab-${dateString}`;
        let sheetNameFinal = sheetNameBase;
        let counter = 1;
        
        while (savedSheets.some(sheet => sheet.name === sheetNameFinal)) {
            counter++;
            sheetNameFinal = `${sheetNameBase}(${counter})`;
        }
        
        const sheetId = 'sheet_' + Date.now();
        
        currentSheetData = {
            id: sheetId,
            name: sheetNameFinal,
            date: dateString,
            lastUpdated: formatDateTime(new Date()),
            participants: selectedParticipants,
            expenses: {},
            settlements: {},
            published: false,
            createdAt: new Date().toISOString(),
            version: 'v4.0',
            splitType: 'equal'
        };
        
        selectedParticipants.forEach(participant => {
            currentSheetData.expenses[participant] = {
                spent: 0,
                meals: 3,
                toBePaid: 0
            };
        });
        
        mobileSheetName.textContent = sheetNameFinal;
        sheetDate.textContent = `Date: ${dateString}`;
        sheetParticipants.textContent = `Participants: ${selectedParticipants.length}`;
        
        renderExpenseTable();
        resetSummary();
        
        showPage('sheet');
        updateSheetAdminControls();
        updatePublishButton();
    }
    
    function updateSheetAdminControls() {
        if (isAdmin) {
            togglePublishBtn.style.display = 'inline-flex';
            adminSheetActions.style.display = 'flex';
            calculateBtn.style.display = 'inline-block';
            saveBtn.style.display = 'inline-block';
        } else {
            togglePublishBtn.style.display = 'none';
            adminSheetActions.style.display = 'none';
            calculateBtn.style.display = 'none';
            saveBtn.style.display = 'none';
        }
    }
    
    function updateSettingsUI() {
        if (isAdmin) {
            loginSection.style.display = 'none';
            adminSection.style.display = 'block';
            defaultParticipantsBtn.style.display = 'block';
            deletedSheetsBinSection.style.display = 'block';
        } else {
            loginSection.style.display = 'block';
            adminSection.style.display = 'none';
            defaultParticipantsBtn.style.display = 'block';
            deletedSheetsBinSection.style.display = 'none';
        }
        
        const savedTheme = localStorage.getItem('hisaabKitaabTheme') || 'light';
        themeToggle.checked = savedTheme === 'dark';
    }
    
    function renderExpenseTable() {
        tableBody.innerHTML = '';
        
        const isV4 = currentSheetData && currentSheetData.version === 'v4.0';
        
        selectedParticipants.forEach(participant => {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            const nameDiv = document.createElement('div');
            nameDiv.className = 'participant-with-avatar';
            nameDiv.style.alignItems = 'center';
            
            let avatar;
            if (window.profileManager) {
                avatar = window.profileManager.createAvatarElement(participant);
            } else {
                avatar = document.createElement('div');
                avatar.className = 'participant-avatar-small';
                avatar.style.backgroundColor = '#3498db';
                avatar.style.color = 'white';
                avatar.textContent = participant.charAt(0).toUpperCase();
                avatar.style.cursor = 'pointer';
                avatar.style.display = 'flex';
                avatar.style.alignItems = 'center';
                avatar.style.justifyContent = 'center';
                avatar.style.borderRadius = '50%';
            }
            
            nameDiv.appendChild(avatar);
            
            const nameSpan = document.createElement('span');
            nameSpan.innerHTML = `<span style="font-weight: 600;">${participant}</span>`;
            nameSpan.style.cursor = 'pointer';
            nameSpan.addEventListener('click', () => {
                if (window.profileManager) {
                    window.profileManager.openProfileCard(participant);
                }
            });
            
            nameDiv.appendChild(nameSpan);
            nameCell.appendChild(nameDiv);
            
            const spentCell = document.createElement('td');
            spentCell.className = 'amount-cell';
            
            if (isAdmin) {
                const spentInput = document.createElement('input');
                spentInput.type = 'number';
                spentInput.min = '0';
                spentInput.step = '0.01';
                spentInput.value = currentSheetData.expenses[participant].spent;
                spentInput.dataset.participant = participant;
                spentInput.addEventListener('input', function() {
                    currentSheetData.expenses[participant].spent = parseFloat(this.value) || 0;
                });
                spentCell.appendChild(spentInput);
            } else {
                spentCell.textContent = currentSheetData.expenses[participant].spent.toFixed(2) + ' SAR';
            }
            
            const mealsCell = document.createElement('td');
            mealsCell.className = 'meals-cell';
            
            if (isV4) {
                mealsCell.style.display = 'none';
            } else if (isAdmin) {
                const mealsSelect = document.createElement('select');
                mealsSelect.dataset.participant = participant;
                
                const mealOptions = [
                    { value: 1, text: '1 Meal' },
                    { value: 2, text: '2 Meals' },
                    { value: 3, text: 'All Meals' }
                ];
                
                mealOptions.forEach(mealOption => {
                    const option = document.createElement('option');
                    option.value = mealOption.value.toString();
                    option.textContent = mealOption.text;
                    mealsSelect.appendChild(option);
                });
                
                mealsSelect.value = currentSheetData.expenses[participant].meals.toString();
                mealsSelect.addEventListener('change', function() {
                    currentSheetData.expenses[participant].meals = parseInt(this.value);
                });
                mealsCell.appendChild(mealsSelect);
            } else {
                mealsCell.style.display = 'none';
            }
            
            const toBePaidCell = document.createElement('td');
            toBePaidCell.className = 'amount-cell';
            toBePaidCell.textContent = currentSheetData.expenses[participant].toBePaid.toFixed(2) + ' SAR';
            toBePaidCell.dataset.participant = participant;
            
            row.appendChild(nameCell);
            row.appendChild(spentCell);
            row.appendChild(mealsCell);
            row.appendChild(toBePaidCell);
            tableBody.appendChild(row);
        });
        
        updateTableHeader();
    }
    
    function updateTableHeader() {
        const tableHeader = document.querySelector('#expenseTable thead tr');
        if (!tableHeader) return;
        
        const isV4 = currentSheetData && currentSheetData.version === 'v4.0';
        
        if (isV4) {
            tableHeader.innerHTML = `
                <th>Participant</th>
                <th>Spent (SAR)</th>
                <th style="display: none;">Meals</th>
                <th>Balance (SAR)</th>
            `;
        } else if (!isAdmin) {
            tableHeader.innerHTML = `
                <th>Participant</th>
                <th>Spent (SAR)</th>
                <th style="display: none;">Meals</th>
                <th>To Be Paid (SAR)</th>
            `;
        } else {
            tableHeader.innerHTML = `
                <th>Participant</th>
                <th>Spent (SAR)</th>
                <th>Meals</th>
                <th>To Be Paid (SAR)</th>
            `;
        }
    }
    
    function calculateShares() {
        if (!isAdmin) return;
        
        const isV4 = currentSheetData && currentSheetData.version === 'v4.0';
        
        if (isV4) {
            calculateEqualSplit();
        } else {
            calculateMealsBasedSplit();
        }
    }
    
    function calculateEqualSplit() {
        // Store existing settlement statuses before recalculation
        const existingStatuses = {};
        if (currentSheetData.settlements) {
            Object.keys(currentSheetData.settlements).forEach(key => {
                existingStatuses[key] = currentSheetData.settlements[key].status;
            });
        }
        
        let totalSpentValue = 0;
        selectedParticipants.forEach(participant => {
            totalSpentValue += currentSheetData.expenses[participant].spent;
        });
        
        const participantCount = selectedParticipants.length;
        const perPersonShare = participantCount > 0 ? totalSpentValue / participantCount : 0;
        const perPersonShareRounded = Math.round(perPersonShare * 100) / 100;
        
        const actualTotalFromShares = perPersonShareRounded * participantCount;
        const roundingDifference = totalSpentValue - actualTotalFromShares;
        
        totalParticipants.textContent = selectedParticipants.length;
        totalSpent.textContent = totalSpentValue.toFixed(2) + ' SAR';
        
        const costPerMealLabel = document.querySelector('.summary-item:last-child .summary-label');
        if (costPerMealLabel) {
            costPerMealLabel.textContent = 'Per Person Share:';
        }
        costPerMeal.textContent = perPersonShareRounded.toFixed(2) + ' SAR';
        
        selectedParticipants.forEach(participant => {
            const spentAmount = currentSheetData.expenses[participant].spent;
            let toBePaid = perPersonShareRounded - spentAmount;
            
            if (participant === selectedParticipants[0] && Math.abs(roundingDifference) > 0.001) {
                toBePaid += roundingDifference;
            }
            
            currentSheetData.expenses[participant].toBePaid = Math.round(toBePaid * 100) / 100;
            
            const toBePaidCell = document.querySelector(`td[data-participant="${participant}"]`);
            if (toBePaidCell) {
                toBePaidCell.textContent = currentSheetData.expenses[participant].toBePaid.toFixed(2) + ' SAR';
                if (currentSheetData.expenses[participant].toBePaid > 0.01) {
                    toBePaidCell.style.color = 'var(--danger-color)';
                    toBePaidCell.title = 'Owes money';
                } else if (currentSheetData.expenses[participant].toBePaid < -0.01) {
                    toBePaidCell.style.color = 'var(--success-color)';
                    toBePaidCell.title = 'To be refunded';
                } else {
                    toBePaidCell.style.color = 'var(--text-color)';
                    toBePaidCell.title = 'Settled';
                }
            }
        });
        
        currentSheetData.totalSpent = totalSpentValue;
        currentSheetData.perPersonShare = perPersonShareRounded;
        currentSheetData.lastUpdated = formatDateTime(new Date());
        
        generateSettlementsV4(existingStatuses);
    }
    
    function calculateMealsBasedSplit() {
        // Store existing settlement statuses before recalculation
        const existingStatuses = {};
        if (currentSheetData.settlements) {
            Object.keys(currentSheetData.settlements).forEach(key => {
                existingStatuses[key] = currentSheetData.settlements[key].status;
            });
        }
        
        let totalSpentValue = 0;
        let totalMeals = 0;
        
        selectedParticipants.forEach(participant => {
            totalSpentValue += currentSheetData.expenses[participant].spent;
            totalMeals += currentSheetData.expenses[participant].meals;
        });
        
        const costPerMealValue = totalMeals > 0 ? totalSpentValue / totalMeals : 0;
        const costPerMealRounded = Math.round(costPerMealValue * 100) / 100;
        
        totalParticipants.textContent = selectedParticipants.length;
        totalSpent.textContent = totalSpentValue.toFixed(2) + ' SAR';
        
        const costPerMealLabel = document.querySelector('.summary-item:last-child .summary-label');
        if (costPerMealLabel) {
            costPerMealLabel.textContent = 'Cost Per Meal:';
        }
        costPerMeal.textContent = costPerMealRounded.toFixed(2) + ' SAR';
        
        selectedParticipants.forEach(participant => {
            const spentAmount = currentSheetData.expenses[participant].spent;
            const mealsAttended = currentSheetData.expenses[participant].meals;
            const shareAmount = costPerMealRounded * mealsAttended;
            let toBePaid = shareAmount - spentAmount;
            
            currentSheetData.expenses[participant].toBePaid = Math.round(toBePaid * 100) / 100;
            
            const toBePaidCell = document.querySelector(`td[data-participant="${participant}"]`);
            if (toBePaidCell) {
                toBePaidCell.textContent = currentSheetData.expenses[participant].toBePaid.toFixed(2) + ' SAR';
                if (currentSheetData.expenses[participant].toBePaid > 0.01) {
                    toBePaidCell.style.color = 'var(--danger-color)';
                } else if (currentSheetData.expenses[participant].toBePaid < -0.01) {
                    toBePaidCell.style.color = 'var(--success-color)';
                } else {
                    toBePaidCell.style.color = 'var(--text-color)';
                }
            }
        });
        
        currentSheetData.totalSpent = totalSpentValue;
        currentSheetData.totalMeals = totalMeals;
        currentSheetData.costPerMeal = costPerMealRounded;
        currentSheetData.lastUpdated = formatDateTime(new Date());
        
        generateLegacySettlements(existingStatuses);
    }
    
    function generateSettlementsV4(existingStatuses = {}) {
        currentSheetData.settlements = {};
        
        let creditors = [];
        let debtors = [];
        
        selectedParticipants.forEach(participant => {
            const balance = currentSheetData.expenses[participant].toBePaid;
            
            if (balance < -0.009) {
                creditors.push({
                    name: participant,
                    amount: Math.abs(balance),
                    originalAmount: balance
                });
            } else if (balance > 0.009) {
                debtors.push({
                    name: participant,
                    amount: balance,
                    originalAmount: balance
                });
            }
        });
        
        if (creditors.length === 0 || debtors.length === 0) {
            renderSettlementList();
            return;
        }
        
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);
        
        console.log('=== SETTLEMENT CALCULATION ===');
        console.log('Creditors (to be refunded):', creditors);
        console.log('Debtors (owe money):', debtors);
        
        const totalDebt = debtors.reduce((sum, d) => sum + d.amount, 0);
        const totalCredit = creditors.reduce((sum, c) => sum + c.amount, 0);
        
        console.log(`Total Debt: ${totalDebt.toFixed(2)}, Total Credit: ${totalCredit.toFixed(2)}`);
        
        let remainingCreditors = creditors.map(c => ({...c}));
        let remainingDebtors = debtors.map(d => ({...d}));
        
        const settlements = [];
        
        for (let i = 0; i < remainingDebtors.length; i++) {
            if (remainingDebtors[i].amount < 0.01) continue;
            
            const debtor = remainingDebtors[i];
            
            remainingCreditors.sort((a, b) => b.amount - a.amount);
            
            if (remainingCreditors.length > 0 && remainingCreditors[0].amount >= 0.01) {
                const creditor = remainingCreditors[0];
                
                const paymentAmount = debtor.amount;
                const roundedAmount = Math.round(paymentAmount * 100) / 100;
                
                const settlementKey = `${debtor.name}_to_${creditor.name}`;
                
                // Check if this settlement existed before and preserve its status
                const previousStatus = existingStatuses[settlementKey] || 'not-paid';
                
                settlements.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: roundedAmount,
                    key: settlementKey,
                    status: previousStatus
                });
                
                creditor.amount -= paymentAmount;
                debtor.amount = 0;
                
                console.log(`SETTLEMENT: ${debtor.name} pays ${roundedAmount.toFixed(2)} to ${creditor.name}`);
            }
        }
        
        console.log('After first pass - Remaining creditors:', remainingCreditors.filter(c => c.amount >= 0.01 || c.amount <= -0.01));
        
        const totalCollected = settlements.reduce((sum, s) => sum + s.amount, 0);
        console.log(`Total collected from debtors: ${totalCollected.toFixed(2)}`);
        
        const overpaidCreditors = [];
        const underpaidCreditors = [];
        
        remainingCreditors.forEach(creditor => {
            if (creditor.amount < -0.01) {
                overpaidCreditors.push({
                    name: creditor.name,
                    amount: Math.abs(creditor.amount),
                    originalAmount: creditor.originalAmount,
                    received: creditor.originalAmount - creditor.amount
                });
            } else if (creditor.amount > 0.01) {
                underpaidCreditors.push({
                    name: creditor.name,
                    amount: creditor.amount,
                    originalAmount: creditor.originalAmount
                });
            }
        });
        
        console.log('Overpaid creditors:', overpaidCreditors);
        console.log('Underpaid creditors:', underpaidCreditors);
        
        if (overpaidCreditors.length > 0 && underpaidCreditors.length > 0) {
            overpaidCreditors.sort((a, b) => b.amount - a.amount);
            underpaidCreditors.sort((a, b) => b.amount - a.amount);
            
            for (let i = 0; i < overpaidCreditors.length; i++) {
                const overpaid = overpaidCreditors[i];
                
                for (let j = 0; j < underpaidCreditors.length; j++) {
                    if (overpaid.amount < 0.01) break;
                    if (underpaidCreditors[j].amount < 0.01) continue;
                    
                    const underpaid = underpaidCreditors[j];
                    const transferAmount = Math.min(overpaid.amount, underpaid.amount);
                    const roundedTransfer = Math.round(transferAmount * 100) / 100;
                    
                    if (roundedTransfer >= 0.01) {
                        const settlementKey = `${overpaid.name}_to_${underpaid.name}`;
                        
                        // Check if this settlement existed before and preserve its status
                        const previousStatus = existingStatuses[settlementKey] || 'not-paid';
                        
                        settlements.push({
                            from: overpaid.name,
                            to: underpaid.name,
                            amount: roundedTransfer,
                            key: settlementKey,
                            status: previousStatus
                        });
                        
                        console.log(`REDISTRIBUTION: ${overpaid.name} pays ${roundedTransfer.toFixed(2)} to ${underpaid.name}`);
                        
                        overpaid.amount -= roundedTransfer;
                        underpaid.amount -= roundedTransfer;
                    }
                }
            }
        }
        
        const consolidatedMap = new Map();
        
        settlements.forEach(settlement => {
            const key = settlement.key;
            
            if (consolidatedMap.has(key)) {
                const existing = consolidatedMap.get(key);
                existing.amount = Math.round((existing.amount + settlement.amount) * 100) / 100;
                // Keep the most recent status? Or merge? For now, keep existing
                if (existing.status === 'not-paid' && settlement.status === 'paid') {
                    existing.status = 'paid'; // If any part is paid, consider it paid
                }
            } else {
                consolidatedMap.set(key, {
                    from: settlement.from,
                    to: settlement.to,
                    amount: settlement.amount,
                    key: key,
                    status: settlement.status
                });
            }
        });
        
        consolidatedMap.forEach((settlement, key) => {
            currentSheetData.settlements[key] = settlement;
        });
        
        const finalTotalPaid = Array.from(consolidatedMap.values())
            .reduce((sum, s) => sum + s.amount, 0);
        
        console.log('=== SETTLEMENT VERIFICATION ===');
        console.log(`Total owed by debtors: ${totalDebt.toFixed(2)}`);
        console.log(`Total owed to creditors: ${totalCredit.toFixed(2)}`);
        console.log(`Total settlement amount: ${finalTotalPaid.toFixed(2)}`);
        console.log(`Difference: ${(finalTotalPaid - totalDebt).toFixed(2)}`);
        console.log('================================');
        
        renderSettlementList();
    }
    
    function generateLegacySettlements(existingStatuses = {}) {
        currentSheetData.settlements = {};
        
        const creditors = [];
        const debtors = [];
        
        selectedParticipants.forEach(participant => {
            const balance = currentSheetData.expenses[participant].toBePaid;
            if (balance < -0.009) {
                creditors.push({
                    name: participant,
                    amount: Math.abs(balance)
                });
            } else if (balance > 0.009) {
                debtors.push({
                    name: participant,
                    amount: balance
                });
            }
        });
        
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);
        
        const settlements = [];
        let i = 0, j = 0;
        
        while (i < debtors.length && j < creditors.length) {
            if (debtors[i].amount < 0.01) {
                i++;
                continue;
            }
            
            if (creditors[j].amount < 0.01) {
                j++;
                continue;
            }
            
            const settlementAmount = Math.min(debtors[i].amount, creditors[j].amount);
            
            if (settlementAmount >= 0.01) {
                const settlementKey = `${debtors[i].name}_to_${creditors[j].name}`;
                const roundedAmount = Math.round(settlementAmount * 100) / 100;
                
                // Check if this settlement existed before and preserve its status
                const previousStatus = existingStatuses[settlementKey] || 'not-paid';
                
                settlements.push({
                    from: debtors[i].name,
                    to: creditors[j].name,
                    amount: roundedAmount,
                    key: settlementKey,
                    status: previousStatus
                });
                
                debtors[i].amount -= settlementAmount;
                creditors[j].amount -= settlementAmount;
                
                if (debtors[i].amount < 0.01) i++;
                if (creditors[j].amount < 0.01) j++;
            }
        }
        
        settlements.forEach(settlement => {
            currentSheetData.settlements[settlement.key] = settlement;
        });
        
        renderSettlementList();
    }
    
    // Render settlement list with checkboxes
    function renderSettlementList() {
        settlementList.innerHTML = '';
        
        if (!currentSheetData.settlements || Object.keys(currentSheetData.settlements).length === 0) {
            settlementList.innerHTML = '<div class="no-settlements">All balances are settled! 🎉</div>';
            return;
        }
        
        const settlements = Object.values(currentSheetData.settlements);
        
        if (currentSheetData.version === 'v4.0' && settlements.length > 0) {
            const note = document.createElement('div');
            note.className = 'settlement-note';
            
            const totalPaid = settlements.reduce((sum, s) => sum + (typeof s.amount === 'number' ? s.amount : parseFloat(s.amount)), 0);
            
            note.innerHTML = `<span style="font-size: 12px;">Total to settle: ${totalPaid.toFixed(2)} SAR</span>`;
            settlementList.appendChild(note);
        }
        
        settlements.forEach(settlement => {
            const settlementItem = document.createElement('div');
            settlementItem.className = 'settlement-item';
            
            const isPaid = settlement.status === 'paid';
            const settlementKey = settlement.key || `${settlement.from}_to_${settlement.to}`;
            const amountValue = typeof settlement.amount === 'number' 
                ? settlement.amount.toFixed(2) 
                : parseFloat(settlement.amount).toFixed(2);
            
            if (isAdmin) {
                // Admin view with checkbox
                settlementItem.innerHTML = `
                    <div class="settlement-details">
                        <div class="settlement-info">
                            <div class="settlement-first-line">
                                <span class="settlement-from">${settlement.from}</span>
                                <span class="settlement-arrow">→</span>
                                <span class="settlement-to">${settlement.to}</span>
                                <span class="settlement-amount">${amountValue} SAR</span>
                            </div>
                        </div>
                        <div class="settlement-checkbox-container">
                            <input type="checkbox" class="settlement-checkbox" data-settlement-key="${settlementKey}" ${isPaid ? 'checked' : ''}>
                            <span class="settlement-status-text ${isPaid ? 'paid' : 'not-paid'}">${isPaid ? 'Settled' : 'Not Settled yet'}</span>
                        </div>
                    </div>
                `;
            } else {
                // Non-admin view - just show status text
                settlementItem.innerHTML = `
                    <div class="settlement-details">
                        <div class="settlement-info">
                            <div class="settlement-first-line">
                                <span class="settlement-from">${settlement.from}</span>
                                <span class="settlement-arrow">→</span>
                                <span class="settlement-to">${settlement.to}</span>
                                <span class="settlement-amount">${amountValue} SAR</span>
                            </div>
                        </div>
                        <div class="settlement-checkbox-container">
                            <span class="settlement-status-display ${isPaid ? 'paid' : 'not-paid'}">${isPaid ? 'Settled' : 'Not Settled yet'}</span>
                        </div>
                    </div>
                `;
            }
            
            settlementList.appendChild(settlementItem);
        });
        
        // Add event listeners to checkboxes for admin
        if (isAdmin) {
            document.querySelectorAll('.settlement-checkbox').forEach(checkbox => {
                // Stop click event from bubbling up to prevent triggering other handlers
                checkbox.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                
                checkbox.addEventListener('change', toggleSettlementCheckbox);
            });
        }
    }
    
    // Toggle settlement status via checkbox
    function toggleSettlementCheckbox(event) {
        const checkbox = event.currentTarget;
        const settlementKey = checkbox.dataset.settlementKey;
        
        if (!settlementKey || !currentSheetData || !currentSheetData.settlements) {
            console.error('Settlement key or data not found');
            return;
        }
        
        // Find the settlement in currentSheetData.settlements
        let settlement = null;
        let actualKey = null;
        
        // Try direct lookup first
        if (currentSheetData.settlements[settlementKey]) {
            settlement = currentSheetData.settlements[settlementKey];
            actualKey = settlementKey;
        } else {
            // Try to find by matching from/to
            settlement = Object.values(currentSheetData.settlements).find(s => 
                `${s.from}_to_${s.to}` === settlementKey || s.key === settlementKey
            );
            if (settlement && settlement.key) {
                actualKey = settlement.key;
            }
        }
        
        if (!settlement || !actualKey) {
            console.error('Settlement not found:', settlementKey);
            return;
        }
        
        // Update status based on checkbox
        const newStatus = checkbox.checked ? 'paid' : 'not-paid';
        settlement.status = newStatus;
        
        // Update the status text next to checkbox
        const statusText = checkbox.parentElement.querySelector('.settlement-status-text');
        if (statusText) {
            statusText.textContent = newStatus === 'paid' ? 'Settled' : 'Not Settled yet';
            statusText.className = `settlement-status-text ${newStatus === 'paid' ? 'paid' : 'not-paid'}`;
        }
        
        // Save the updated sheet silently (no alert)
        saveSheetSilently();
    }
    
    // Silent save function that doesn't show alert
    function saveSheetSilently() {
        if (!currentSheetData || !isAdmin) return;
        
        // Don't call calculateShares() here to avoid resetting settlements
        // Just save the current data as is
        
        const existingIndex = savedSheets.findIndex(sheet => sheet.id === currentSheetData.id);
        if (existingIndex !== -1) {
            savedSheets[existingIndex] = JSON.parse(JSON.stringify(currentSheetData));
        } else {
            savedSheets.push(JSON.parse(JSON.stringify(currentSheetData)));
        }
        
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        // No alert here!
        updateHomeStats();
    }
    
    function saveSheet() {
        if (!currentSheetData || !isAdmin) return;
        
        // Store existing settlement statuses before recalculation
        const existingStatuses = {};
        if (currentSheetData.settlements) {
            Object.keys(currentSheetData.settlements).forEach(key => {
                existingStatuses[key] = currentSheetData.settlements[key].status;
            });
        }
        
        calculateShares();
        
        // After calculation, restore the statuses that existed before
        if (currentSheetData.settlements && Object.keys(existingStatuses).length > 0) {
            Object.keys(currentSheetData.settlements).forEach(key => {
                if (existingStatuses[key] !== undefined) {
                    currentSheetData.settlements[key].status = existingStatuses[key];
                }
            });
        }
        
        const existingIndex = savedSheets.findIndex(sheet => sheet.id === currentSheetData.id);
        if (existingIndex !== -1) {
            savedSheets[existingIndex] = JSON.parse(JSON.stringify(currentSheetData));
        } else {
            savedSheets.push(JSON.parse(JSON.stringify(currentSheetData)));
        }
        
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        updateHomeStats();
        
        // Re-render settlements to ensure UI reflects the restored statuses
        renderSettlementList();
        
        alert('Sheet saved successfully!');
    }
    
    function togglePublishSheet() {
        if (!currentSheetData || !isAdmin) return;
        
        currentSheetData.published = !currentSheetData.published;
        currentSheetData.lastUpdated = formatDateTime(new Date());
        
        updatePublishButton();
        saveSheetSilently();
        
        const status = currentSheetData.published ? 'published' : 'unpublished';
        alert(`Sheet ${status} successfully!`);
    }
    
    function updatePublishButton() {
        if (!currentSheetData) return;
        
        if (currentSheetData.published) {
            publishIcon.textContent = 'Published🔒';
            togglePublishBtn.classList.remove('btn-warning');
            togglePublishBtn.classList.add('btn-success');
            togglePublishBtn.title = 'Unpublish Sheet';
        } else {
            publishIcon.textContent = 'Unpublished📢';
            togglePublishBtn.classList.remove('btn-success');
            togglePublishBtn.classList.add('btn-warning');
            togglePublishBtn.title = 'Publish Sheet';
        }
    }
    
    function openEditParticipants() {
        if (!isAdmin || !currentSheetData) return;
        
        editParticipantsList.innerHTML = '';
        
        const sortedParticipants = [...selectedParticipants].sort(alphabeticalSort);
        
        sortedParticipants.forEach(participant => {
            addParticipantToEditList(participant);
        });
        
        editCustomParticipantInput.value = '';
        showPage('editParticipants');
    }
    
    function updateParticipants() {
        if (!isAdmin) return;
        
        const updatedParticipants = Array.from(editParticipantsList.children).map(item => 
            item.querySelector('.edit-participant-name').textContent
        );
        
        if (updatedParticipants.length === 0) {
            alert('Please add at least one participant');
            return;
        }
        
        updatedParticipants.sort(alphabeticalSort);
        
        selectedParticipants = updatedParticipants;
        currentSheetData.participants = updatedParticipants;
        
        updatedParticipants.forEach(participant => {
            if (!currentSheetData.expenses[participant]) {
                currentSheetData.expenses[participant] = { spent: 0, meals: 3, toBePaid: 0 };
            }
        });
        
        Object.keys(currentSheetData.expenses).forEach(participant => {
            if (!updatedParticipants.includes(participant)) {
                delete currentSheetData.expenses[participant];
            }
        });
        
        renderExpenseTable();
        calculateShares();
        showPage('sheet');
        alert('Participants updated successfully!');
    }
    
    function openSheet(sheetId) {
        const sheet = savedSheets.find(s => s.id === sheetId);
        if (!sheet) {
            alert('Sheet not found!');
            return;
        }
        
        currentSheetData = JSON.parse(JSON.stringify(sheet));
        selectedParticipants = currentSheetData.participants.sort(alphabeticalSort);
        
        if (!currentSheetData.version) {
            currentSheetData.version = 'v3.0';
        }
        
        mobileSheetName.textContent = currentSheetData.name;
        mobileSheetName.style.cursor = isAdmin ? 'pointer' : 'default';
        mobileSheetName.title = isAdmin ? 'Click to rename sheet' : '';
        
        const existingBadge = mobileSheetName.querySelector('.version-badge');
        if (existingBadge) existingBadge.remove();
        
        const versionBadge = document.createElement('span');
        versionBadge.className = 'version-badge';
        versionBadge.style.cssText = `
            font-size: 12px;
            background-color: ${currentSheetData.version === 'v4.0' ? '#9b59b6' : '#7f8c8d'};
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            margin-left: 10px;
            cursor: default;
        `;
        versionBadge.textContent = currentSheetData.version === 'v4.0' ? 'v4.0' : 'v3.0';
        mobileSheetName.appendChild(versionBadge);
        
        sheetDate.textContent = `Date: ${currentSheetData.date}`;
        sheetParticipants.textContent = `Participants: ${selectedParticipants.length}`;
        
        const costPerMealLabel = document.querySelector('.summary-item:last-child .summary-label');
        if (costPerMealLabel) {
            costPerMealLabel.textContent = currentSheetData.version === 'v4.0' ? 'Per Person Share:' : 'Cost Per Meal:';
        }
        
        renderExpenseTable();
        
        let totalSpentValue = 0;
        selectedParticipants.forEach(participant => {
            totalSpentValue += currentSheetData.expenses[participant].spent;
        });
        
        const perPersonShare = currentSheetData.version === 'v4.0' 
            ? (selectedParticipants.length > 0 ? totalSpentValue / selectedParticipants.length : 0)
            : (currentSheetData.costPerMeal || 0);
        
        totalParticipants.textContent = selectedParticipants.length;
        totalSpent.textContent = totalSpentValue.toFixed(2) + ' SAR';
        costPerMeal.textContent = perPersonShare.toFixed(2) + ' SAR';
        
        selectedParticipants.forEach(participant => {
            const toBePaid = currentSheetData.expenses[participant].toBePaid || 0;
            const toBePaidCell = document.querySelector(`td[data-participant="${participant}"]`);
            if (toBePaidCell) {
                toBePaidCell.textContent = toBePaid.toFixed(2) + ' SAR';
                if (toBePaid > 0.01) {
                    toBePaidCell.style.color = 'var(--danger-color)';
                    toBePaidCell.title = 'Owes money';
                } else if (toBePaid < -0.01) {
                    toBePaidCell.style.color = 'var(--success-color)';
                    toBePaidCell.title = 'To be refunded';
                } else {
                    toBePaidCell.style.color = 'var(--text-color)';
                    toBePaidCell.title = 'Settled';
                }
            }
        });
        
        if (!currentSheetData.settlements || Object.keys(currentSheetData.settlements).length === 0) {
            if (currentSheetData.version === 'v4.0') {
                calculateEqualSplit();
            } else {
                generateLegacySettlements();
            }
        } else {
            renderSettlementList();
        }
        
        updateSheetAdminControls();
        updatePublishButton();
        showPage('sheet');
    }
    
    function alphabeticalSort(a, b) {
        return a.localeCompare(b, 'en', { sensitivity: 'base' });
    }
    
    function formatDateYYYYMMDD(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
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
    
    function resetSummary() {
        totalParticipants.textContent = '0';
        totalSpent.textContent = '0.00 SAR';
        
        const costPerMealLabel = document.querySelector('.summary-item:last-child .summary-label');
        if (costPerMealLabel) {
            costPerMealLabel.textContent = currentSheetData && currentSheetData.version === 'v4.0' ? 'Per Person Share:' : 'Cost Per Meal:';
        }
        
        costPerMeal.textContent = '0.00 SAR';
        settlementList.innerHTML = '<div class="no-settlements">Calculate shares to see settlement suggestions</div>';
    }
    
    function updateUIForUserRole() {
        updateFilterTabsVisibility();
        updateTableHeader();
        updateCreateButtonVisibility();
    }
    
    function showAdminLoginModal() {
        adminLoginModal.style.display = 'flex';
        adminPasswordInput.value = '';
        adminPasswordInput.focus();
    }
    
    function hideAdminLoginModal() {
        adminLoginModal.style.display = 'none';
    }
    
    function handleAdminLogin() {
        const password = adminPasswordInput.value.trim();
        if (password === ADMIN_PASSWORD) {
            isAdmin = true;
            localStorage.setItem('hisaabKitaabAdmin', 'true');
            updateSettingsUI();
            updateFilterTabsVisibility();
            hideAdminLoginModal();
            alert('Admin login successful!');
            
            if (currentSheetData) {
                updateSheetAdminControls();
                updateTableHeader();
                renderExpenseTable();
                renderSettlementList(); // Re-render settlements with checkboxes
                mobileSheetName.style.cursor = 'pointer';
                mobileSheetName.title = 'Click to rename sheet';
            }
            
            updateCreateButtonVisibility();
            loadRecentSheets();
            loadAllSheets();
        } else {
            alert('Incorrect password. Please try again.');
            adminPasswordInput.value = '';
            adminPasswordInput.focus();
        }
    }
    
    function handleLogout() {
        isAdmin = false;
        localStorage.removeItem('hisaabKitaabAdmin');
        updateSettingsUI();
        updateFilterTabsVisibility();
        
        if (currentSheetData) {
            updateSheetAdminControls();
            updateTableHeader();
            renderExpenseTable();
            renderSettlementList(); // Re-render settlements without checkboxes
            mobileSheetName.style.cursor = 'default';
            mobileSheetName.title = '';
        }
        
        updateCreateButtonVisibility();
        loadRecentSheets();
        loadAllSheets();
        
        alert('Logged out successfully.');
    }
    
    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('hisaabKitaabTheme', isDark ? 'dark' : 'light');
    }
    
    function applyTheme() {
        const savedTheme = localStorage.getItem('hisaabKitaabTheme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.checked = false;
        }
    }
    
    function handleSync() {
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.manualSync();
            alert('Sync initiated!');
        } else {
            alert('Cloud sync not available.');
        }
    }
    
    function deleteCurrentSheet() {
        const sheetId = deleteModal.dataset.sheetId;
        
        if (!sheetId) {
            alert('Sheet ID not found.');
            hideDeleteConfirmation();
            return;
        }
        
        deleteSheetById(sheetId);
        hideDeleteConfirmation();
    }
    
    function updateDeletedSheetsBin() {
        deletedSheets = JSON.parse(localStorage.getItem('hisaabKitaabDeletedSheets')) || [];
        
        if (deletedSheets.length === 0) {
            emptyBinMessage.style.display = 'block';
            deletedSheetsList.style.display = 'none';
            binActions.style.display = 'none';
            return;
        }
        
        emptyBinMessage.style.display = 'none';
        deletedSheetsList.style.display = 'block';
        binActions.style.display = 'flex';
        
        const sortedDeletedSheets = [...deletedSheets].sort((a, b) => {
            return new Date(b.deletedDate) - new Date(a.deletedDate);
        });
        
        deletedSheetsList.innerHTML = '';
        
        sortedDeletedSheets.forEach(sheet => {
            const sheetItem = document.createElement('li');
            sheetItem.className = 'sheet-item deleted-sheet-item';
            
            const displayDate = sheet.lastUpdated ? formatDateTime(new Date(sheet.lastUpdated)) : 
                              sheet.date ? formatDateTime(new Date(sheet.date)) : 
                              formatDateTime(new Date(sheet.createdAt));
            
            const version = sheet.version || 'v3.0';
            const versionColor = version === 'v4.0' ? '#9b59b6' : '#7f8c8d';
            
            sheetItem.innerHTML = `
                <div>
                    <strong>${sheet.name}</strong>
                    <div class="sheet-date">Deleted: ${formatDateTime(new Date(sheet.deletedDate))}</div>
                    <div style="font-size: 10px; color: ${versionColor}; margin-top: 2px;">${version} ${version === 'v4.0' ? '• Equal Split' : ''}</div>
                </div>
                <div class="sheet-item-actions">
                    <button class="btn btn-small btn-success restore-sheet-btn" data-id="${sheet.id}">Restore</button>
                    <button class="btn btn-small btn-danger permanent-delete-btn" data-id="${sheet.id}">Delete</button>
                </div>
            `;
            
            deletedSheetsList.appendChild(sheetItem);
        });
        
        document.querySelectorAll('.restore-sheet-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                restoreDeletedSheet(this.dataset.id);
            });
        });
        
        document.querySelectorAll('.permanent-delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                permanentlyDeleteSheet(this.dataset.id);
            });
        });
    }
    
    function restoreDeletedSheet(sheetId) {
        const sheetIndex = deletedSheets.findIndex(sheet => sheet.id === sheetId);
        if (sheetIndex === -1) return;
        
        const sheet = deletedSheets[sheetIndex];
        
        deletedSheets.splice(sheetIndex, 1);
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(deletedSheets));
        
        savedSheets.push(sheet);
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        // Sync to Firebase
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        updateHomeStats();
        updateDeletedSheetsBin();
        alert('Sheet restored successfully!');
    }
    
    function permanentlyDeleteSheet(sheetId) {
        if (!confirm('Permanently delete this sheet? This action cannot be undone.')) {
            return;
        }
        
        const sheetIndex = deletedSheets.findIndex(sheet => sheet.id === sheetId);
        if (sheetIndex === -1) return;
        
        deletedSheets.splice(sheetIndex, 1);
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(deletedSheets));
        
        updateDeletedSheetsBin();
        alert('Sheet permanently deleted!');
    }
    
    function emptyDeletedSheetsBin() {
        if (!confirm('Empty the entire bin? This will permanently delete all sheets in the bin.')) {
            return;
        }
        
        deletedSheets = [];
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(deletedSheets));
        
        updateDeletedSheetsBin();
        alert('Bin emptied successfully!');
    }
    
    function restoreAllDeletedSheets() {
        if (deletedSheets.length === 0) return;
        
        if (!confirm(`Restore all ${deletedSheets.length} deleted sheets?`)) {
            return;
        }
        
        deletedSheets.forEach(sheet => {
            savedSheets.push(sheet);
        });
        
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        // Sync to Firebase
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        deletedSheets = [];
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(deletedSheets));
        
        updateHomeStats();
        updateDeletedSheetsBin();
        alert('All sheets restored successfully!');
    }
    
    function saveDefaultParticipants() {
        defaultParticipants.sort(alphabeticalSort);
        localStorage.setItem('hisaabKitaabDefaultParticipants', JSON.stringify(defaultParticipants));
        updateHomeStats();
        updateDefaultParticipantsList();
    }
    
    function updateDefaultParticipantsList() {
        const defaultParticipantsList = document.getElementById('defaultParticipantsList');
        if (!defaultParticipantsList) return;
        
        defaultParticipantsList.innerHTML = '';
        
        const addParticipantSection = document.querySelector('.add-participant-control');
        if (addParticipantSection) {
            addParticipantSection.style.display = isAdmin ? 'flex' : 'none';
        }
        
        defaultParticipants.forEach(participantName => {
            const participantItem = document.createElement('li');
            participantItem.className = 'default-participant-item';
            
            const participantInfo = document.createElement('div');
            participantInfo.className = 'default-participant-info';
            participantInfo.addEventListener('click', () => {
                if (window.profileManager) {
                    window.profileManager.openProfileCard(participantName);
                }
            });
            
            let avatar;
            if (window.profileManager) {
                avatar = window.profileManager.createAvatarElement(participantName);
            } else {
                avatar = document.createElement('div');
                avatar.className = 'default-participant-avatar';
                avatar.style.backgroundColor = '#3498db';
                avatar.style.color = 'white';
                avatar.textContent = participantName.charAt(0).toUpperCase();
            }
            
            avatar.className = 'default-participant-avatar';
            participantInfo.appendChild(avatar);
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'default-participant-name';
            nameSpan.textContent = participantName;
            participantInfo.appendChild(nameSpan);
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'default-participant-actions';
            
            if (isAdmin) {
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-default-btn';
                editBtn.innerHTML = '✏️';
                editBtn.title = 'Edit Profile';
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.profileManager) {
                        window.profileManager.openProfileCard(participantName);
                        setTimeout(() => {
                            window.profileManager.showEditProfileForm();
                        }, 300);
                    }
                });
                actionsDiv.appendChild(editBtn);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-default-btn';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.title = 'Remove from Default List';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Remove "${participantName}" from default list?`)) {
                        defaultParticipants = defaultParticipants.filter(p => p !== participantName);
                        saveDefaultParticipants();
                        loadCreateParticipants();
                    }
                });
                actionsDiv.appendChild(deleteBtn);
            } else {
                const viewOnlyMsg = document.createElement('span');
                viewOnlyMsg.className = 'view-only-message';
                viewOnlyMsg.textContent = 'View Only';
                viewOnlyMsg.style.fontSize = '0.8rem';
                viewOnlyMsg.style.color = 'var(--secondary-color)';
                viewOnlyMsg.style.fontStyle = 'italic';
                actionsDiv.appendChild(viewOnlyMsg);
            }
            
            participantItem.appendChild(participantInfo);
            participantItem.appendChild(actionsDiv);
            defaultParticipantsList.appendChild(participantItem);
        });
    }
    
    function addDefaultParticipant() {
        if (!isAdmin) {
            alert('Only admin users can add participants to the default list.');
            return;
        }
        
        const customName = newDefaultParticipantInput.value.trim();
        if (!customName) {
            alert('Please enter a participant name');
            return;
        }
        
        if (defaultParticipants.includes(customName)) {
            alert('This participant already exists in the default list');
            newDefaultParticipantInput.value = '';
            return;
        }
        
        defaultParticipants.push(customName);
        defaultParticipants.sort(alphabeticalSort);
        saveDefaultParticipants();
        
        newDefaultParticipantInput.value = '';
        
        if (createContent.classList.contains('active')) {
            loadCreateParticipants();
        }
        
        alert(`"${customName}" added to default list successfully!`);
    }
    
    function handlePDFGeneration() {
        if (!currentSheetData) {
            alert('No sheet data available to share');
            return;
        }
        
        if (isAdmin && (!currentSheetData.totalSpent || currentSheetData.totalSpent === 0)) {
            calculateShares();
        }
        
        if (window.generateExpensePDF) {
            window.generateExpensePDF(currentSheetData, selectedParticipants, isAdmin);
        } else {
            alert('PDF generator not loaded. Please refresh the page.');
        }
    }
    
    function createPWAInstallButton() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            window.navigator.standalone ||
                            document.referrer.includes('android-app://');
        
        if (!isStandalone && ('BeforeInstallPromptEvent' in window || 
            window.matchMedia('(display-mode: browser)').matches)) {
            
            const settingsSection = document.querySelector('#settingsContent .settings-section');
            if (settingsSection) {
                const installSection = document.createElement('div');
                installSection.className = 'section-card';
                installSection.innerHTML = `
                    <h3 class="section-title">Install App</h3>
                    <button id="pwaInstallSettingsBtn" class="btn btn-primary btn-block">
                        <span class="btn-icon">📱</span> Install HisaabKitaab App
                    </button>
                    <p style="margin-top: 10px; color: var(--secondary-color); font-size: 0.9rem;">
                        Install this app on your device for quick access and offline use.
                    </p>
                `;
                
                settingsSection.insertBefore(installSection, settingsSection.querySelector('.section-card:last-child'));
                
                document.getElementById('pwaInstallSettingsBtn').addEventListener('click', () => {
                    if (window.pwaInstaller && window.pwaInstaller.installApp) {
                        window.pwaInstaller.installApp();
                    } else {
                        alert('Visit https://mudassardp.github.io/AajKaHisaab/ on your mobile device and use "Add to Home Screen" from your browser menu.');
                    }
                });
            }
        }
    }
    
    window.showPDFLoading = function() {
        const loadingOverlay = document.getElementById('pdfLoadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    };
    
    window.hidePDFLoading = function() {
        const loadingOverlay = document.getElementById('pdfLoadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    };
    
    window.loadSavedSheets = loadAllSheets;
    window.renderExpenseTable = renderExpenseTable;
    window.currentSheetData = currentSheetData;
});