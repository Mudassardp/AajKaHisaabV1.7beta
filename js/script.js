// script.js - Mobile App Redesign v3.4 - Fixed Settlement with Bank Prioritization
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
        "Mansoor Wasta", "Mohsin", "Ubedulla", "Abdul Alim", "Sabir", "Aftab"
    ];
    
    const ADMIN_PASSWORD = "226622";
    
    // ===== DOM ELEMENTS =====
    // Navigation
    const homeBtn = document.getElementById('homeBtn');
    const sheetsBtn = document.getElementById('sheetsBtn');
    const createBtnNav = document.getElementById('createBtnNav');
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
    const deleteSheetBtn = document.getElementById('deleteSheetBtn');
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
    
    // Deleted Sheets Bin Elements (in Settings)
    const emptyBinBtn = document.getElementById('emptyBinBtn');
    const restoreAllBtn = document.getElementById('restoreAllBtn');
    const deletedSheetsList = document.getElementById('deletedSheetsList');
    const emptyBinMessage = document.getElementById('emptyBinMessage');
    const binActions = document.getElementById('binActions');
    const addDefaultParticipantBtn = document.getElementById('addDefaultParticipantBtn');
    const newDefaultParticipantInput = document.getElementById('newDefaultParticipantInput');
    
    // PWA Install Button Elements
    let pwaInstallBtn;
    
    // ===== INITIALIZATION =====
    initApp();
    
    function initApp() {
        // Sort default participants
        defaultParticipants.sort(alphabeticalSort);
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize UI
        updateUIForUserRole();
        applyTheme();
        updateHomeStats();
        loadRecentSheets();
        loadAllSheets();
        updateDeletedSheetsBin();
        
        // Initialize Profile Manager
        if (window.profileManager) {
            window.profileManager.init();
        }
        
        // Initialize Firebase (with error handling for local testing)
        setTimeout(() => {
            if (window.firebaseSync && typeof firebase !== 'undefined') {
                try {
                    window.firebaseSync.initialize();
                } catch (error) {
                    console.log('Firebase initialization skipped for local testing:', error.message);
                }
            }
        }, 1000);
        
        // Show home page by default
        showPage('home');
        
        // Initialize PWA Install button in Settings
        createPWAInstallButton();
    }
    
    function setupEventListeners() {
        // Navigation
        homeBtn.addEventListener('click', () => showPage('home'));
        sheetsBtn.addEventListener('click', () => showPage('sheets'));
        createBtnNav.addEventListener('click', () => showPage('create'));
        refreshBtn.addEventListener('click', refreshApp);
        settingsBtn.addEventListener('click', () => showPage('settings'));
        
        // Home Page
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
        deleteSheetBtn.addEventListener('click', showDeleteConfirmation);
        
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
        
        // Default Participants Modal
        addDefaultParticipantBtn.addEventListener('click', addDefaultParticipant);
        newDefaultParticipantInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addDefaultParticipant();
        });
        
        // Deleted Sheets Bin Actions
        emptyBinBtn.addEventListener('click', emptyDeletedSheetsBin);
        restoreAllBtn.addEventListener('click', restoreAllDeletedSheets);
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === adminLoginModal) hideAdminLoginModal();
            if (e.target === deleteModal) hideDeleteConfirmation();
            if (e.target === defaultParticipantsModal) defaultParticipantsModal.style.display = 'none';
        });
    }
    
    // ===== PAGE MANAGEMENT =====
    function showPage(page) {
        // Hide all pages
        homeContent.classList.remove('active');
        sheetsContent.classList.remove('active');
        createContent.classList.remove('active');
        settingsContent.classList.remove('active');
        sheetSection.classList.remove('active');
        editParticipantsSection.classList.remove('active');
        
        // Update navigation
        homeBtn.classList.remove('active');
        sheetsBtn.classList.remove('active');
        createBtnNav.classList.remove('active');
        settingsBtn.classList.remove('active');
        
        // Show selected page
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
                    createBtnNav.classList.add('active');
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
        
        // Update bottom nav highlight
        if (page === 'sheet' || page === 'editParticipants') {
            // Don't highlight any nav button when in sheet view
            homeBtn.classList.remove('active');
            sheetsBtn.classList.remove('active');
            createBtnNav.classList.remove('active');
            settingsBtn.classList.remove('active');
        }
    }
    
    function refreshApp() {
        // Refresh all data
        savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
        updateHomeStats();
        loadRecentSheets();
        loadAllSheets();
        updateDeletedSheetsBin();
        
        // Force sync if available
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.manualSync();
        }
        
        alert('App refreshed!');
    }
    
    // ===== HOME PAGE FUNCTIONS =====
    function updateHomeStats() {
        totalSheetsCount.textContent = savedSheets.length;
        totalParticipantsCount.textContent = defaultParticipants.length;
        
        // Show/hide create button based on admin status
        updateCreateButtonVisibility();
    }
    
    function updateCreateButtonVisibility() {
        // Hide create button for non-admin users
        if (isAdmin) {
            createQuickBtn.style.display = 'block';
            createBtnNav.style.display = 'flex';
        } else {
            createQuickBtn.style.display = 'none';
            createBtnNav.style.display = 'none';
        }
    }
    
    function loadRecentSheets() {
        recentSheetsList.innerHTML = '';
        
        if (savedSheets.length === 0) {
            recentSheetsList.innerHTML = '<div class="no-recent-sheets">No recent sheets found.</div>';
            return;
        }
        
        // Sort by creation date (newest first)
        const sortedSheets = [...savedSheets].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA; // Newest first
        });
        
        // Show only 3 most recent sheets
        const recentSheets = sortedSheets.slice(0, 3);
        let visibleSheetsCount = 0;
        
        recentSheets.forEach(sheet => {
            // Skip unpublished sheets for non-admin users
            if (!isAdmin && !sheet.published) {
                return;
            }
            
            visibleSheetsCount++;
            const sheetItem = document.createElement('div');
            sheetItem.className = 'recent-sheet-item';
            sheetItem.addEventListener('click', () => openSheet(sheet.id));
            
            const displayDate = sheet.createdAt ? formatDateTime(new Date(sheet.createdAt)) : 'Unknown Date';
            
            sheetItem.innerHTML = `
                <div class="recent-sheet-name">${sheet.name}</div>
                <div class="recent-sheet-date">Created: ${displayDate}</div>
            `;
            
            recentSheetsList.appendChild(sheetItem);
        });
        
        // If no visible sheets for non-admin
        if (visibleSheetsCount === 0) {
            recentSheetsList.innerHTML = '<div class="no-recent-sheets">No recent sheets found.</div>';
        }
    }
    
    // ===== SHEETS PAGE FUNCTIONS =====
    function loadAllSheets() {
        sheetsList.innerHTML = '';
        
        // Filter sheets based on admin status
        const visibleSheets = isAdmin ? savedSheets : savedSheets.filter(sheet => sheet.published);
        
        if (visibleSheets.length === 0) {
            noSheetsMessage.style.display = 'block';
            sheetsList.style.display = 'none';
            return;
        }
        
        noSheetsMessage.style.display = 'none';
        sheetsList.style.display = 'block';
        
        // Sort by creation date (newest first)
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
        sheetItem.addEventListener('click', () => openSheet(sheet.id));
        
        const sheetInfo = document.createElement('div');
        const displayDate = sheet.createdAt ? formatDateTime(new Date(sheet.createdAt)) : 'Unknown Date';
        
        // Add published indicator
        let publishedIndicator = '';
        if (sheet.published) {
            publishedIndicator = '<span style="color: var(--success-color); font-size: 0.8rem; margin-left: 8px;">📢 Published</span>';
        } else {
            publishedIndicator = '<span style="color: var(--warning-color); font-size: 0.8rem; margin-left: 8px;">🔒 Unpublished</span>';
        }
        
        sheetInfo.innerHTML = `
            <strong>${sheet.name}</strong>
            <div class="sheet-date">Created: ${displayDate} ${publishedIndicator}</div>
        `;
        
        sheetItem.appendChild(sheetInfo);
        return sheetItem;
    }
    
    function filterSheets(filter) {
        // Update active tab
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
                // Filter and show only published sheets
                const publishedSheets = savedSheets.filter(sheet => sheet.published);
                displayFilteredSheets(publishedSheets);
                break;
            case 'unpublished':
                unpublishedSheetsTab.classList.add('active');
                // Filter and show only unpublished sheets
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
    
    // ===== CREATE PAGE FUNCTIONS =====
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
        
        // Create avatar
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
        
        // Check if already exists in default list
        if (defaultParticipants.includes(customName)) {
            alert('This participant already exists in the default list');
            inputElement.value = '';
            return;
        }
        
        // Check if already exists in current list
        const existingParticipants = Array.from(listElement.children).map(item => 
            item.querySelector('.participant-name').textContent
        );
        
        if (existingParticipants.includes(customName)) {
            alert('This participant already exists in the list');
            inputElement.value = '';
            return;
        }
        
        // Add to default participants list
        defaultParticipants.push(customName);
        defaultParticipants.sort(alphabeticalSort);
        saveDefaultParticipants();
        
        // Add to current list
        addParticipantToCreateList(customName);
        inputElement.value = '';
        
        // Update home stats
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
        
        // Sort participants alphabetically
        selectedParticipants.sort(alphabeticalSort);
        
        const now = new Date();
        const dateString = formatDateYYYYMMDD(now);
        
        // Generate sheet name
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
            createdAt: new Date().toISOString()
        };
        
        selectedParticipants.forEach(participant => {
            currentSheetData.expenses[participant] = {
                spent: 0,
                meals: 3,
                toBePaid: 0
            };
        });
        
        // Update UI for sheet view
        mobileSheetName.textContent = sheetNameFinal;
        sheetDate.textContent = `Date: ${dateString}`;
        sheetParticipants.textContent = `Participants: ${selectedParticipants.length}`;
        
        renderExpenseTable();
        resetSummary();
        
        // Show sheet page
        showPage('sheet');
        
        // Show admin controls if logged in
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
    
    // ===== SETTINGS PAGE FUNCTIONS =====
    function updateSettingsUI() {
        if (isAdmin) {
            loginSection.style.display = 'none';
            adminSection.style.display = 'block';
            defaultParticipantsBtn.style.display = 'block';
            deletedSheetsBinSection.style.display = 'block';
        } else {
            loginSection.style.display = 'block';
            adminSection.style.display = 'none';
            defaultParticipantsBtn.style.display = 'block'; // Still show button for viewing
            deletedSheetsBinSection.style.display = 'none';
        }
        
        // Set theme toggle
        const savedTheme = localStorage.getItem('hisaabKitaabTheme') || 'light';
        themeToggle.checked = savedTheme === 'dark';
    }
    
    // ===== SHEET PAGE FUNCTIONS =====
    function renderExpenseTable() {
        tableBody.innerHTML = '';
        
        selectedParticipants.forEach(participant => {
            const row = document.createElement('tr');
            
            // Participant Name with Avatar
            const nameCell = document.createElement('td');
            const nameDiv = document.createElement('div');
            nameDiv.className = 'participant-with-avatar';
            nameDiv.style.alignItems = 'center';
            
            // Create avatar
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
            
            // Spent Amount
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
            
            // Meals - Only show for admin
            const mealsCell = document.createElement('td');
            mealsCell.className = 'meals-cell';
            
            if (isAdmin) {
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
                // Hide meals column for non-admin
                mealsCell.style.display = 'none';
            }
            
            // To Be Paid
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
        
        // REMOVED: Total Row - No longer needed
        
        // Update table header for non-admin
        updateTableHeader();
    }
    
    function updateTableHeader() {
        const tableHeader = document.querySelector('#expenseTable thead tr');
        if (!tableHeader) return;
        
        if (!isAdmin) {
            // For non-admin, only show Participants, Spent, To Be Paid
            tableHeader.innerHTML = `
                <th>Participant</th>
                <th>Spent (SAR)</th>
                <th>To Be Paid (SAR)</th>
            `;
        } else {
            // For admin, show all columns
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
        
        let totalSpentValue = 0;
        let totalMeals = 0;
        
        selectedParticipants.forEach(participant => {
            totalSpentValue += currentSheetData.expenses[participant].spent;
            totalMeals += currentSheetData.expenses[participant].meals;
        });
        
        const costPerMealValue = totalMeals > 0 ? totalSpentValue / totalMeals : 0;
        
        // Update Summary
        totalParticipants.textContent = selectedParticipants.length;
        totalSpent.textContent = totalSpentValue.toFixed(2) + ' SAR';
        costPerMeal.textContent = costPerMealValue.toFixed(2) + ' SAR';
        
        // Calculate To Be Paid
        selectedParticipants.forEach(participant => {
            const spentAmount = currentSheetData.expenses[participant].spent;
            const mealsAttended = currentSheetData.expenses[participant].meals;
            const shareAmount = costPerMealValue * mealsAttended;
            const toBePaid = shareAmount - spentAmount;
            
            currentSheetData.expenses[participant].toBePaid = toBePaid;
            
            const toBePaidCell = document.querySelector(`td[data-participant="${participant}"]`);
            if (toBePaidCell) {
                toBePaidCell.textContent = toBePaid.toFixed(2) + ' SAR';
                if (toBePaid > 0) {
                    toBePaidCell.style.color = 'var(--danger-color)';
                } else if (toBePaid < 0) {
                    toBePaidCell.style.color = 'var(--success-color)';
                } else {
                    toBePaidCell.style.color = 'var(--text-color)';
                }
            }
        });
        
        currentSheetData.totalSpent = totalSpentValue;
        currentSheetData.totalMeals = totalMeals;
        currentSheetData.costPerMeal = costPerMealValue;
        currentSheetData.lastUpdated = formatDateTime(new Date());
        
        generateSettlementSuggestions();
    }
    
    function generateSettlementSuggestions() {
        // Get creditors and debtors
        const creditors = [];
        const debtors = [];
        
        selectedParticipants.forEach(participant => {
            const balance = currentSheetData.expenses[participant].toBePaid;
            if (balance < 0) {
                creditors.push({ 
                    name: participant, 
                    amount: -balance,
                    preferredBank: getPreferredBank(participant)
                });
            } else if (balance > 0) {
                debtors.push({ 
                    name: participant, 
                    amount: balance,
                    preferredBank: getPreferredBank(participant)
                });
            }
        });
        
        // Sort by amount (largest first)
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);
        
        // Get bank accounts for matching
        const bankAccounts = getBankAccountsForAllParticipants();
        
        const settlements = [];
        
        // First pass: Try to match same bank transfers (highest priority)
        for (let i = 0; i < debtors.length; i++) {
            for (let j = 0; j < creditors.length; j++) {
                if (debtors[i].amount < 0.01 || creditors[j].amount < 0.01) continue;
                
                const debtorBanks = bankAccounts[debtors[i].name] || [];
                const creditorBanks = bankAccounts[creditors[j].name] || [];
                
                // Check for same bank match
                const sameBank = findSameBank(debtorBanks, creditorBanks);
                
                if (sameBank) {
                    const settlementAmount = Math.min(debtors[i].amount, creditors[j].amount);
                    
                    if (settlementAmount > 0.01) {
                        const settlementKey = `${debtors[i].name}_to_${creditors[j].name}`;
                        
                        settlements.push({
                            from: debtors[i].name,
                            to: creditors[j].name,
                            amount: settlementAmount.toFixed(2),
                            key: settlementKey,
                            bank: sameBank,
                            bankMatch: true,
                            preferredMatch: false
                        });
                        
                        debtors[i].amount -= settlementAmount;
                        creditors[j].amount -= settlementAmount;
                    }
                }
            }
        }
        
        // Second pass: Try to match preferred banks
        for (let i = 0; i < debtors.length; i++) {
            if (debtors[i].amount < 0.01) continue;
            
            for (let j = 0; j < creditors.length; j++) {
                if (creditors[j].amount < 0.01) continue;
                
                // Check if debtor has a preferred bank that matches creditor's banks
                if (debtors[i].preferredBank) {
                    const creditorBanks = bankAccounts[creditors[j].name] || [];
                    const hasPreferredBank = creditorBanks.some(bank => bank.bank === debtors[i].preferredBank);
                    
                    if (hasPreferredBank) {
                        const settlementAmount = Math.min(debtors[i].amount, creditors[j].amount);
                        
                        if (settlementAmount > 0.01) {
                            const settlementKey = `${debtors[i].name}_to_${creditors[j].name}`;
                            
                            settlements.push({
                                from: debtors[i].name,
                                to: creditors[j].name,
                                amount: settlementAmount.toFixed(2),
                                key: settlementKey,
                                bank: debtors[i].preferredBank,
                                bankMatch: true,
                                preferredMatch: true
                            });
                            
                            debtors[i].amount -= settlementAmount;
                            creditors[j].amount -= settlementAmount;
                        }
                    }
                }
                
                // Also check if creditor has a preferred bank that matches debtor's banks
                if (creditors[j].preferredBank && creditors[j].amount > 0.01 && debtors[i].amount > 0.01) {
                    const debtorBanks = bankAccounts[debtors[i].name] || [];
                    const hasPreferredBank = debtorBanks.some(bank => bank.bank === creditors[j].preferredBank);
                    
                    if (hasPreferredBank) {
                        const settlementAmount = Math.min(debtors[i].amount, creditors[j].amount);
                        
                        if (settlementAmount > 0.01) {
                            const settlementKey = `${debtors[i].name}_to_${creditors[j].name}`;
                            
                            settlements.push({
                                from: debtors[i].name,
                                to: creditors[j].name,
                                amount: settlementAmount.toFixed(2),
                                key: settlementKey,
                                bank: creditors[j].preferredBank,
                                bankMatch: true,
                                preferredMatch: true
                            });
                            
                            debtors[i].amount -= settlementAmount;
                            creditors[j].amount -= settlementAmount;
                        }
                    }
                }
            }
        }
        
        // Third pass: Regular settlement (no bank match)
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
            
            if (settlementAmount > 0.01) {
                const settlementKey = `${debtors[i].name}_to_${creditors[j].name}`;
                
                settlements.push({
                    from: debtors[i].name,
                    to: creditors[j].name,
                    amount: settlementAmount.toFixed(2),
                    key: settlementKey,
                    bank: null,
                    bankMatch: false,
                    preferredMatch: false
                });
                
                debtors[i].amount -= settlementAmount;
                creditors[j].amount -= settlementAmount;
                
                if (debtors[i].amount < 0.01) i++;
                if (creditors[j].amount < 0.01) j++;
            } else {
                if (debtors[i].amount <= creditors[j].amount) i++;
                else j++;
            }
        }
        
        // Store settlements - FIXED: Ensure settlements object exists and copy status from existing settlements
        currentSheetData.settlements = currentSheetData.settlements || {};
        
        settlements.forEach(settlement => {
            // Check if this settlement already exists and has a status
            const existingSettlement = currentSheetData.settlements[settlement.key];
            const status = existingSettlement ? existingSettlement.status : 'not-paid';
            
            currentSheetData.settlements[settlement.key] = {
                from: settlement.from,
                to: settlement.to,
                amount: settlement.amount,
                status: status,
                bank: settlement.bank,
                bankMatch: settlement.bankMatch,
                preferredMatch: settlement.preferredMatch
            };
        });
        
        renderSettlementList();
    }
    
    // Helper function to get preferred bank for a participant
    function getPreferredBank(participantName) {
        if (window.profileManager) {
            const profile = window.profileManager.getProfile(participantName);
            return profile.preferredBank || '';
        }
        return '';
    }
    
    // Helper function to get bank accounts for all participants
    function getBankAccountsForAllParticipants() {
        const bankAccounts = {};
        
        if (window.profileManager) {
            selectedParticipants.forEach(participant => {
                const profile = window.profileManager.getProfile(participant);
                if (profile.bankAccounts) {
                    bankAccounts[participant] = window.profileManager.parseBankAccounts(profile.bankAccounts);
                } else {
                    bankAccounts[participant] = [];
                }
            });
        }
        
        return bankAccounts;
    }
    
    // Helper function to find same bank between two sets of bank accounts
    function findSameBank(debtorBanks, creditorBanks) {
        for (const debtorBank of debtorBanks) {
            for (const creditorBank of creditorBanks) {
                if (debtorBank.bank === creditorBank.bank) {
                    return debtorBank.bank;
                }
            }
        }
        return null;
    }
    
    function renderSettlementList() {
        settlementList.innerHTML = '';
        
        // Get settlements from currentSheetData
        if (!currentSheetData.settlements || Object.keys(currentSheetData.settlements).length === 0) {
            settlementList.innerHTML = '<div class="no-settlements">All balances are settled! 🎉</div>';
            return;
        }
        
        const settlements = Object.values(currentSheetData.settlements);
        
        settlements.forEach(settlement => {
            const settlementItem = document.createElement('div');
            settlementItem.className = 'settlement-item';
            
            // Get status from settlement object
            const isPaid = settlement.status === 'paid';
            const statusClass = isPaid ? 'paid' : 'not-paid';
            const statusText = isPaid ? 'Paid' : 'Not Paid';
            
            if (isAdmin) {
                // Admin view with toggle button
                settlementItem.innerHTML = `
                    <div class="settlement-details">
                        <div class="settlement-first-line">
                            <span class="settlement-from">${settlement.from}</span>
                            <span class="settlement-arrow">→</span>
                            <span class="settlement-to">${settlement.to}</span>
                        </div>
                        <div class="settlement-second-line">
                            <span class="settlement-amount">${settlement.amount} SAR</span>
                            <button class="settlement-toggle-btn ${statusClass}" data-key="${settlement.key || `${settlement.from}_to_${settlement.to}`}">
                                ${statusText}
                            </button>
                        </div>
                        ${settlement.bankMatch ? `<div class="bank-match-indicator" style="font-size: 12px; color: #666; font-style: italic; margin-top: 5px;">Same Bank: ${settlement.bank}${settlement.preferredMatch ? ' (Preferred)' : ''}</div>` : ''}
                    </div>
                `;
                
                const toggleBtn = settlementItem.querySelector('.settlement-toggle-btn');
                toggleBtn.addEventListener('click', function() {
                    let settlementKey = this.dataset.key;
                    if (!currentSheetData.settlements[settlementKey]) {
                        // If settlement doesn't exist by key, find it by from/to
                        const settlement = Object.values(currentSheetData.settlements).find(s => 
                            `${s.from}_to_${s.to}` === settlementKey
                        );
                        if (settlement && settlement.key) {
                            settlementKey = settlement.key;
                        }
                    }
                    
                    const currentStatus = currentSheetData.settlements[settlementKey].status;
                    const newStatus = currentStatus === 'paid' ? 'not-paid' : 'paid';
                    
                    // Update the status
                    currentSheetData.settlements[settlementKey].status = newStatus;
                    
                    // Update button appearance
                    if (newStatus === 'paid') {
                        this.className = 'settlement-toggle-btn paid';
                        this.textContent = 'Paid';
                    } else {
                        this.className = 'settlement-toggle-btn not-paid';
                        this.textContent = 'Not Paid';
                    }
                    
                    // Save the sheet
                    saveSheet();
                });
            } else {
                // Viewer mode - static status
                const staticStatusClass = isPaid ? 'status-paid' : 'status-not-paid';
                settlementItem.innerHTML = `
                    <div class="settlement-details">
                        <div class="settlement-first-line">
                            <span class="settlement-from">${settlement.from}</span>
                            <span class="settlement-arrow">→</span>
                            <span class="settlement-to">${settlement.to}</span>
                        </div>
                        <div class="settlement-second-line">
                            <span class="settlement-amount">${settlement.amount} SAR</span>
                            <span class="settlement-status ${staticStatusClass}">${statusText}</span>
                        </div>
                        ${settlement.bankMatch ? `<div class="bank-match-indicator" style="font-size: 12px; color: #666; font-style: italic; margin-top: 5px;">Same Bank: ${settlement.bank}${settlement.preferredMatch ? ' (Preferred)' : ''}</div>` : ''}
                    </div>
                `;
            }
            
            settlementList.appendChild(settlementItem);
        });
    }
    
    function saveSheet() {
        if (!currentSheetData || !isAdmin) return;
        
        calculateShares();
        
        const existingIndex = savedSheets.findIndex(sheet => sheet.id === currentSheetData.id);
        if (existingIndex !== -1) {
            savedSheets[existingIndex] = currentSheetData;
        } else {
            savedSheets.push(currentSheetData);
        }
        
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        // Sync to Firebase
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        updateHomeStats();
        alert('Sheet saved successfully!');
    }
    
    function togglePublishSheet() {
        if (!currentSheetData || !isAdmin) return;
        
        currentSheetData.published = !currentSheetData.published;
        currentSheetData.lastUpdated = formatDateTime(new Date());
        
        updatePublishButton();
        saveSheet();
        
        const status = currentSheetData.published ? 'published' : 'unpublished';
        alert(`Sheet ${status} successfully!`);
    }
    
    function updatePublishButton() {
        if (!currentSheetData) return;
        
        if (currentSheetData.published) {
            publishIcon.textContent = '🔒';
            togglePublishBtn.classList.remove('btn-success');
            togglePublishBtn.classList.add('btn-warning');
            togglePublishBtn.title = 'Unpublish Sheet';
        } else {
            publishIcon.textContent = '📢';
            togglePublishBtn.classList.remove('btn-warning');
            togglePublishBtn.classList.add('btn-success');
            togglePublishBtn.title = 'Publish Sheet';
        }
    }
    
    function openEditParticipants() {
        if (!isAdmin || !currentSheetData) return;
        
        editParticipantsList.innerHTML = '';
        
        // Sort participants alphabetically
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
        
        // Sort participants alphabetically
        updatedParticipants.sort(alphabeticalSort);
        
        selectedParticipants = updatedParticipants;
        currentSheetData.participants = updatedParticipants;
        
        // Initialize expenses for new participants
        updatedParticipants.forEach(participant => {
            if (!currentSheetData.expenses[participant]) {
                currentSheetData.expenses[participant] = { spent: 0, meals: 3, toBePaid: 0 };
            }
        });
        
        // Remove expenses for deleted participants
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
    
    // ===== OPEN SHEET FUNCTION =====
    function openSheet(sheetId) {
        const sheet = savedSheets.find(s => s.id === sheetId);
        if (!sheet) {
            alert('Sheet not found!');
            return;
        }
        
        currentSheetData = JSON.parse(JSON.stringify(sheet));
        selectedParticipants = currentSheetData.participants.sort(alphabeticalSort);
        
        // Update UI
        mobileSheetName.textContent = currentSheetData.name;
        sheetDate.textContent = `Date: ${currentSheetData.date}`;
        sheetParticipants.textContent = `Participants: ${selectedParticipants.length}`;
        
        renderExpenseTable();
        
        // Calculate and display totals
        let totalSpentValue = 0;
        selectedParticipants.forEach(participant => {
            totalSpentValue += currentSheetData.expenses[participant].spent;
        });
        
        const costPerMealValue = currentSheetData.costPerMeal || 0;
        
        totalParticipants.textContent = selectedParticipants.length;
        totalSpent.textContent = totalSpentValue.toFixed(2) + ' SAR';
        costPerMeal.textContent = costPerMealValue.toFixed(2) + ' SAR';
        
        // Update "To Be Paid" cells
        selectedParticipants.forEach(participant => {
            const toBePaid = currentSheetData.expenses[participant].toBePaid || 0;
            const toBePaidCell = document.querySelector(`td[data-participant="${participant}"]`);
            if (toBePaidCell) {
                toBePaidCell.textContent = toBePaid.toFixed(2) + ' SAR';
                if (toBePaid > 0) {
                    toBePaidCell.style.color = 'var(--danger-color)';
                } else if (toBePaid < 0) {
                    toBePaidCell.style.color = 'var(--success-color)';
                } else {
                    toBePaidCell.style.color = 'var(--text-color)';
                }
            }
        });
        
        // Generate settlements if not present
        if (!currentSheetData.settlements || Object.keys(currentSheetData.settlements).length === 0) {
            generateSettlementSuggestions();
        } else {
            renderSettlementList();
        }
        
        // Show appropriate buttons
        updateSheetAdminControls();
        updatePublishButton();
        showPage('sheet');
    }
    
    // ===== HELPER FUNCTIONS =====
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
        costPerMeal.textContent = '0.00 SAR';
        settlementList.innerHTML = '<div class="no-settlements">Calculate shares to see settlement suggestions</div>';
    }
    
    // ===== USER MANAGEMENT =====
    function updateUIForUserRole() {
        // This function handles showing/hiding admin features based on login status
        updateFilterTabsVisibility();
        updateTableHeader(); // Also update table header when user role changes
        updateCreateButtonVisibility(); // Update create button visibility
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
            
            // If we're viewing a sheet, update the UI
            if (currentSheetData) {
                updateSheetAdminControls();
                updateTableHeader(); // Update table header for admin view
                renderExpenseTable(); // Re-render table with admin features
            }
            
            // Update create button visibility
            updateCreateButtonVisibility();
            
            // Refresh recent sheets and all sheets
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
        
        // If we're viewing a sheet, update the UI
        if (currentSheetData) {
            updateSheetAdminControls();
            updateTableHeader(); // Update table header for non-admin view
            renderExpenseTable(); // Re-render table without admin features
        }
        
        // Update create button visibility
        updateCreateButtonVisibility();
        
        // Refresh recent sheets and all sheets
        loadRecentSheets();
        loadAllSheets();
        
        alert('Logged out successfully.');
    }
    
    // ===== THEME FUNCTIONS =====
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
    
    // ===== SYNC FUNCTIONS =====
    function handleSync() {
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.manualSync();
            alert('Sync initiated!');
        } else {
            alert('Cloud sync not available.');
        }
    }
    
    // ===== DELETE FUNCTIONS =====
    function showDeleteConfirmation() {
        if (!isAdmin) return;
        deleteModal.style.display = 'flex';
    }
    
    function hideDeleteConfirmation() {
        deleteModal.style.display = 'none';
    }
    
    function deleteCurrentSheet() {
        if (!currentSheetData || !isAdmin) return;
        
        // Add deletion date and move to deleted sheets
        currentSheetData.deletedDate = new Date().toISOString();
        deletedSheets.push(currentSheetData);
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(deletedSheets));
        
        // Remove from active sheets
        savedSheets = savedSheets.filter(sheet => sheet.id !== currentSheetData.id);
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        // Sync to Firebase
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        updateHomeStats();
        updateDeletedSheetsBin();
        hideDeleteConfirmation();
        showPage('home');
        alert('Sheet moved to bin!');
    }
    
    // ===== DELETED SHEETS BIN FUNCTIONS =====
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
        
        // Sort by deletion date (newest first)
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
            
            sheetItem.innerHTML = `
                <div>
                    <strong>${sheet.name}</strong>
                    <div class="sheet-date">Deleted: ${formatDateTime(new Date(sheet.deletedDate))}</div>
                </div>
                <div class="sheet-item-actions">
                    <button class="btn btn-small btn-success restore-sheet-btn" data-id="${sheet.id}">Restore</button>
                    <button class="btn btn-small btn-danger permanent-delete-btn" data-id="${sheet.id}">Delete</button>
                </div>
            `;
            
            deletedSheetsList.appendChild(sheetItem);
        });
        
        // Add event listeners for restore and delete buttons
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
        
        // Remove from deleted sheets
        deletedSheets.splice(sheetIndex, 1);
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(deletedSheets));
        
        // Add back to active sheets
        savedSheets.push(sheet);
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
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
        
        // Remove from deleted sheets
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
        
        // Add all deleted sheets back to active sheets
        deletedSheets.forEach(sheet => {
            savedSheets.push(sheet);
        });
        
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        // Clear deleted sheets
        deletedSheets = [];
        localStorage.setItem('hisaabKitaabDeletedSheets', JSON.stringify(deletedSheets));
        
        updateHomeStats();
        updateDeletedSheetsBin();
        alert('All sheets restored successfully!');
    }
    
    // ===== DEFAULT PARTICIPANTS MANAGEMENT =====
    function saveDefaultParticipants() {
        defaultParticipants.sort(alphabeticalSort);
        localStorage.setItem('hisaabKitaabDefaultParticipants', JSON.stringify(defaultParticipants));
        
        // Update home stats
        updateHomeStats();
        
        // Update Default Participants list if open
        updateDefaultParticipantsList();
    }
    
    function updateDefaultParticipantsList() {
        const defaultParticipantsList = document.getElementById('defaultParticipantsList');
        if (!defaultParticipantsList) return;
        
        defaultParticipantsList.innerHTML = '';
        
        // Show/Hide add participant section based on admin status
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
            
            // Create avatar
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
                // For non-admin users, show view-only message
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
        
        // Check if already exists in default list
        if (defaultParticipants.includes(customName)) {
            alert('This participant already exists in the default list');
            newDefaultParticipantInput.value = '';
            return;
        }
        
        // Add to default participants list
        defaultParticipants.push(customName);
        defaultParticipants.sort(alphabeticalSort);
        saveDefaultParticipants();
        
        newDefaultParticipantInput.value = '';
        
        // Update create page if open
        if (createContent.classList.contains('active')) {
            loadCreateParticipants();
        }
        
        alert(`"${customName}" added to default list successfully!`);
    }
    
    // ===== PDF GENERATION =====
    function handlePDFGeneration() {
        if (!currentSheetData) {
            alert('No sheet data available to share');
            return;
        }
        
        // Ensure calculations are done for admin
        if (isAdmin && (!currentSheetData.totalSpent || currentSheetData.totalSpent === 0)) {
            calculateShares();
        }
        
        // Use the PDF generator
        if (window.generateExpensePDF) {
            window.generateExpensePDF(currentSheetData, selectedParticipants, isAdmin);
        } else {
            alert('PDF generator not loaded. Please refresh the page.');
        }
    }
    
    // ===== PWA INSTALL BUTTON IN SETTINGS =====
    function createPWAInstallButton() {
        // Check if we're in a browser that supports PWA installation
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            window.navigator.standalone ||
                            document.referrer.includes('android-app://');
        
        // Only show install button if not already installed
        if (!isStandalone && ('BeforeInstallPromptEvent' in window || 
            window.matchMedia('(display-mode: browser)').matches)) {
            
            // Create install button for settings page
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
                
                // Add event listener
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
    
    // Make functions available globally
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