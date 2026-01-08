// script.js - Updated v2.2 (with Profile Sync Fix)
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements (keeping only essential ones)
    const userStatus = document.getElementById('userStatus');
    const logoutBtn = document.getElementById('logoutBtn');
    const viewerTab = document.getElementById('viewerTab');
    const adminTab = document.getElementById('adminTab');
    const viewerContent = document.getElementById('viewerContent');
    const adminContent = document.getElementById('adminContent');
    const loginSection = document.getElementById('loginSection');
    const adminLoginModal = document.getElementById('adminLoginModal');
    const adminSections = document.getElementById('adminSections');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const confirmAdminLoginBtn = document.getElementById('confirmAdminLoginBtn');
    const cancelAdminLoginBtn = document.getElementById('cancelAdminLoginBtn');
    const loginAsAdminBtn = document.getElementById('loginAsAdminBtn');
    
    const createBtn = document.getElementById('createBtn');
    const participantsSection = document.getElementById('participantsSection');
    const sheetSection = document.getElementById('sheetSection');
    const editParticipantsSection = document.getElementById('editParticipantsSection');
    const sheetName = document.getElementById('sheetName');
    const participantsList = document.getElementById('participantsList');
    const createSheetBtn = document.getElementById('createSheetBtn');
    const tableBody = document.getElementById('tableBody');
    const calculateBtn = document.getElementById('calculateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const sharePdfBtn = document.getElementById('sharePdfBtn');
    const closeSheetBtn = document.getElementById('closeSheetBtn');
    const deleteSheetBtn = document.getElementById('deleteSheetBtn');
    const editParticipantsBtn = document.getElementById('editParticipantsBtn');
    const updateParticipantsBtn = document.getElementById('updateParticipantsBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const adminSheetActions = document.getElementById('adminSheetActions');
    
    const totalParticipantsElement = document.getElementById('totalParticipants');
    const totalSpentElement = document.getElementById('totalSpent');
    const totalMealsElement = document.getElementById('totalMeals');
    const costPerMealElement = document.getElementById('costPerMeal');
    const oneMealCountElement = document.getElementById('oneMealCount');
    const twoMealsCountElement = document.getElementById('twoMealsCount');
    const threeMealsCountElement = document.getElementById('threeMealsCount');
    const settlementList = document.getElementById('settlementList');
    const sheetsList = document.getElementById('sheetsList');
    const adminSheetsList = document.getElementById('adminSheetsList');
    const noSheetsMessage = document.getElementById('noSheetsMessage');
    const adminNoSheetsMessage = document.getElementById('adminNoSheetsMessage');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const customParticipantInput = document.getElementById('customParticipantInput');
    const addCustomParticipantBtn = document.getElementById('addCustomParticipantBtn');
    const editCustomParticipantInput = document.getElementById('editCustomParticipantInput');
    const editAddCustomParticipantBtn = document.getElementById('editAddCustomParticipantBtn');
    const editParticipantsList = document.getElementById('editParticipantsList');
    const totalMealsSummary = document.getElementById('totalMealsSummary');
    
    // New Elements for v2.2
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = document.querySelector('.theme-icon');
    const controlPanelBtn = document.getElementById('controlPanelBtn');
    
    // Control Panel Elements (keep only default participants part)
    const controlPanelModal = document.getElementById('controlPanelModal');
    const closeControlPanelBtn = document.getElementById('closeControlPanelBtn');
    const newDefaultParticipantInput = document.getElementById('newDefaultParticipantInput');
    const addDefaultParticipantBtn = document.getElementById('addDefaultParticipantBtn');
    const defaultParticipantsList = document.getElementById('defaultParticipantsList');
    
    // Application State
    let selectedParticipants = [];
    let currentSheetData = null;
    let savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
    let isAdmin = false;
    let currentMode = 'viewer';
    const ADMIN_PASSWORD = "226622";
    
    // Default participants - now will be sorted alphabetically
    let defaultParticipants = JSON.parse(localStorage.getItem('hisaabKitaabDefaultParticipants')) || [
        "Rizwan", "Aarif", "Abdul Razzaq", "Haris", "Mauzam", 
        "Masif", "Mudassar", "Shahid", "Mansoor Kotawdekar", 
        "Mansoor Wasta", "Mohsin", "Ubedulla", "Abdul Alim", "Sabir", "Aftab"
    ];
    
    // Sort default participants alphabetically on initialization
    defaultParticipants.sort(alphabeticalSort);
    
    // Flag to track if Firebase is initialized
    let isFirebaseInitialized = false;
    
    // Initialize Application
    initApp();
    
    function initApp() {
        loadSavedSheets();
        setupEventListeners();
        checkAdminStatus();
        applyTheme();
        
        // Initialize Profile Manager FIRST (with local data)
        if (window.profileManager) {
            window.profileManager.init();
            console.log('Profile Manager initialized with local data');
        }
        
        // Initialize Firebase sync - this will load cloud data and override local
        setTimeout(() => {
            if (window.firebaseSync) {
                window.firebaseSync.initialize();
                isFirebaseInitialized = true;
                console.log('Firebase Sync initialized');
                
                // After Firebase initializes, we need to refresh Profile Manager
                // to ensure it has the latest data from cloud
                setTimeout(() => {
                    if (window.profileManager) {
                        window.profileManager.loadProfiles();
                        console.log('Profile Manager refreshed after Firebase sync');
                        
                        // Update UI elements that show profiles
                        updateCreateParticipantsList();
                        updateDefaultParticipantsList();
                    }
                }, 2000); // Give Firebase time to load data
            }
        }, 1000);
    }
    
    function setupEventListeners() {
        // Mode Tabs
        viewerTab.addEventListener('click', () => switchMode('viewer'));
        adminTab.addEventListener('click', () => switchMode('admin'));

        // User Management
        loginAsAdminBtn.addEventListener('click', showAdminLoginModal);
        confirmAdminLoginBtn.addEventListener('click', handleAdminLogin);
        cancelAdminLoginBtn.addEventListener('click', hideAdminLoginModal);
        logoutBtn.addEventListener('click', handleLogout);
        
        // Theme Toggle
        themeToggleBtn.addEventListener('click', toggleTheme);

        // Sync button - now syncs BOTH sheets and profiles
        document.getElementById('manualSyncBtn')?.addEventListener('click', () => {
            if (window.firebaseSync) {
                window.firebaseSync.manualSync();
                
                // Refresh Profile Manager after sync
                setTimeout(() => {
                    if (window.profileManager) {
                        window.profileManager.loadProfiles();
                        updateCreateParticipantsList();
                        updateDefaultParticipantsList();
                    }
                }, 1000);
            }
        });
        
        // Control Panel
        controlPanelBtn.addEventListener('click', () => {
            controlPanelModal.style.display = 'flex';
            updateDefaultParticipantsList();
        });
        
        closeControlPanelBtn.addEventListener('click', () => {
            controlPanelModal.style.display = 'none';
        });
        
        // Default Participants Management
        addDefaultParticipantBtn.addEventListener('click', () => {
            const newName = newDefaultParticipantInput.value.trim();
            if (!newName) {
                alert('Please enter a participant name');
                return;
            }
            
            if (defaultParticipants.includes(newName)) {
                alert('This participant already exists in the default list');
                newDefaultParticipantInput.value = '';
                return;
            }
            
            defaultParticipants.push(newName);
            defaultParticipants.sort(alphabeticalSort); // Sort after adding
            saveDefaultParticipants();
            updateDefaultParticipantsList();
            updateCreateParticipantsList();
            newDefaultParticipantInput.value = '';
            
            alert(`"${newName}" added to default list!`);
        });
        
        newDefaultParticipantInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addDefaultParticipantBtn.click();
            }
        });
        
        // Sheet Management
        createBtn.addEventListener('click', showParticipantsSection);
        createSheetBtn.addEventListener('click', createNewSheet);
        calculateBtn.addEventListener('click', calculateShares);
        saveBtn.addEventListener('click', saveSheet);
        sharePdfBtn.addEventListener('click', handlePDFGeneration);
        closeSheetBtn.addEventListener('click', closeSheet);
        deleteSheetBtn.addEventListener('click', showDeleteConfirmation);
        confirmDeleteBtn.addEventListener('click', deleteCurrentSheet);
        cancelDeleteBtn.addEventListener('click', hideDeleteConfirmation);
        
        // Participants Management
        addCustomParticipantBtn.addEventListener('click', () => addCustomParticipant(customParticipantInput, participantsList));
        customParticipantInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addCustomParticipant(customParticipantInput, participantsList);
        });
        editAddCustomParticipantBtn.addEventListener('click', () => addCustomParticipantToEdit(editCustomParticipantInput, editParticipantsList));
        editCustomParticipantInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addCustomParticipantToEdit(editCustomParticipantInput, editParticipantsList);
        });
        
        // Edit Participants
        editParticipantsBtn.addEventListener('click', openEditParticipants);
        updateParticipantsBtn.addEventListener('click', updateParticipants);
        cancelEditBtn.addEventListener('click', cancelEditParticipants);
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === controlPanelModal) {
                controlPanelModal.style.display = 'none';
            }
            if (e.target === adminLoginModal) {
                hideAdminLoginModal();
            }
            if (e.target === deleteModal) {
                hideDeleteConfirmation();
            }
        });
    }
    
    // Helper function for alphabetical sorting
    function alphabeticalSort(a, b) {
        return a.localeCompare(b, 'en', { sensitivity: 'base' });
    }
    
    // Theme Functions
    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('hisaabKitaabTheme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    }
    
    function applyTheme() {
        const savedTheme = localStorage.getItem('hisaabKitaabTheme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateThemeIcon(true);
        } else {
            document.body.classList.remove('dark-mode');
            updateThemeIcon(false);
        }
    }
    
    function updateThemeIcon(isDark) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        themeToggleBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
    
    // Mode Switching Functions
    function switchMode(mode) {
        currentMode = mode;
        if (mode === 'viewer') {
            viewerTab.classList.add('active');
            adminTab.classList.remove('active');
            viewerContent.classList.add('active');
            adminContent.classList.remove('active');
            updateUIForViewer();
        } else if (mode === 'admin') {
            viewerTab.classList.remove('active');
            adminTab.classList.add('active');
            viewerContent.classList.remove('active');
            adminContent.classList.add('active');
            if (isAdmin) {
                updateUIForAdmin();
            } else {
                updateUIForAdminLogin();
            }
        }
        
        // Refresh settlement list to show correct status display
        if (currentSheetData && currentSheetData.settlements) {
            generateSettlementSuggestions();
        }
    }
    
    // User Management Functions
    function checkAdminStatus() {
        const savedAdminStatus = localStorage.getItem('hisaabKitaabAdmin');
        if (savedAdminStatus === 'true') {
            isAdmin = true;
            userStatus.style.display = 'flex';
            controlPanelBtn.style.display = 'inline-flex';
            updateUIForAdmin();
        } else {
            isAdmin = false;
            userStatus.style.display = 'none';
            controlPanelBtn.style.display = 'none';
            updateUIForViewer();
        }
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
            userStatus.style.display = 'flex';
            controlPanelBtn.style.display = 'inline-flex';
            updateUIForAdmin();
            hideAdminLoginModal();
            alert('Admin login successful!');
        } else {
            alert('Incorrect password. Please try again.');
            adminPasswordInput.value = '';
            adminPasswordInput.focus();
        }
    }
    
    function handleLogout() {
        isAdmin = false;
        localStorage.removeItem('hisaabKitaabAdmin');
        userStatus.style.display = 'none';
        controlPanelBtn.style.display = 'none';
        updateUIForAdminLogin();
        closeSheet();
        alert('Logged out successfully.');
    }
    
    function updateUIForAdmin() {
        loginSection.style.display = 'none';
        adminSections.style.display = 'block';
        calculateBtn.style.display = 'inline-block';
        saveBtn.style.display = 'inline-block';
        sharePdfBtn.style.display = 'inline-block';
        adminSheetActions.style.display = 'flex';
        closeSheetBtn.style.display = 'inline-block';
        totalMealsSummary.style.display = 'flex';
        loadSavedSheets();
    }
    
    function updateUIForViewer() {
        calculateBtn.style.display = 'none';
        saveBtn.style.display = 'none';
        sharePdfBtn.style.display = 'inline-block';
        adminSheetActions.style.display = 'none';
        participantsSection.style.display = 'none';
        editParticipantsSection.style.display = 'none';
        closeSheetBtn.style.display = 'inline-block';
        totalMealsSummary.style.display = 'none';
        loadSavedSheets();
    }
    
    function updateUIForAdminLogin() {
        loginSection.style.display = 'block';
        adminSections.style.display = 'none';
        calculateBtn.style.display = 'none';
        saveBtn.style.display = 'none';
        sharePdfBtn.style.display = 'none';
        adminSheetActions.style.display = 'none';
        participantsSection.style.display = 'none';
        editParticipantsSection.style.display = 'none';
        closeSheetBtn.style.display = 'none';
        totalMealsSummary.style.display = 'none';
    }
    
    // Default Participants Management
    function saveDefaultParticipants() {
        defaultParticipants.sort(alphabeticalSort); // Sort before saving
        localStorage.setItem('hisaabKitaabDefaultParticipants', JSON.stringify(defaultParticipants));
    }
    
    function updateDefaultParticipantsList() {
        defaultParticipantsList.innerHTML = '';
        
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
            
            // Create avatar using ProfileManager
            let avatar;
            if (window.profileManager) {
                avatar = window.profileManager.createAvatarElement(participantName);
            } else {
                // Fallback if ProfileManager is not available
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
                            if (window.profileManager.showEditProfileForm) {
                                window.profileManager.showEditProfileForm();
                            }
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
                        updateDefaultParticipantsList();
                        updateCreateParticipantsList();
                    }
                });
                actionsDiv.appendChild(deleteBtn);
            }
            
            participantItem.appendChild(participantInfo);
            participantItem.appendChild(actionsDiv);
            defaultParticipantsList.appendChild(participantItem);
        });
    }
    
    function updateCreateParticipantsList() {
        participantsList.innerHTML = '';
        defaultParticipants.forEach(participantName => {
            addParticipantToList(participantName);
        });
    }
    
    // Sheet Management Functions
    function showParticipantsSection() {
        if (!isAdmin) return;
        
        participantsList.innerHTML = '';
        defaultParticipants.forEach(participantName => {
            addParticipantToList(participantName);
        });
        
        customParticipantInput.value = '';
        participantsSection.style.display = 'block';
        participantsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    function addParticipantToList(participantName) {
        const participantItem = document.createElement('li');
        participantItem.className = 'participant';
        participantItem.style.borderLeft = '3px solid var(--primary-color)';
        
        const participantWithAvatar = document.createElement('div');
        participantWithAvatar.className = 'participant-with-avatar';
        
        // Create avatar using ProfileManager
        let avatar;
        if (window.profileManager) {
            avatar = window.profileManager.createAvatarElement(participantName);
        } else {
            // Fallback
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
        participantsList.appendChild(participantItem);
    }
    
    function createNewSheet() {
        if (!isAdmin) return;
        
        selectedParticipants = [];
        const checkboxes = document.querySelectorAll('#participantsList input[type="checkbox"]:checked');
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
        const dateString = now.toLocaleDateString();
        
        // Generate sheet name with duplicate detection
        let sheetNameBase = `Hisaab-${dateString}`;
        let sheetNameFinal = sheetNameBase;
        let counter = 1;
        
        while (savedSheets.some(sheet => sheet.name === sheetNameFinal)) {
            counter++;
            sheetNameFinal = `${sheetNameBase}(${counter})`;
        }
        
        const sheetId = 'sheet_' + Date.now();
        
        sheetName.textContent = sheetNameFinal;
        
        currentSheetData = {
            id: sheetId,
            name: sheetNameFinal,
            date: dateString,
            lastUpdated: formatDateTime(new Date()),
            participants: selectedParticipants,
            expenses: {},
            settlements: {},
            createdAt: new Date().toISOString()
        };
        
        selectedParticipants.forEach(participant => {
            currentSheetData.expenses[participant] = {
                spent: 0,
                meals: 3,
                toBePaid: 0
            };
        });
        
        renderExpenseTable();
        participantsSection.style.display = 'none';
        sheetSection.style.display = 'block';
        resetSummary();
        sheetSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    function renderExpenseTable() {
        tableBody.innerHTML = '';
        
        selectedParticipants.forEach(participant => {
            const row = document.createElement('tr');
            
            // Participant Name with Avatar
            const nameCell = document.createElement('td');
            const nameDiv = document.createElement('div');
            nameDiv.className = 'participant-with-avatar';
            nameDiv.style.alignItems = 'center';
            
            // Create avatar using ProfileManager
            let avatar;
            if (window.profileManager) {
                avatar = window.profileManager.createAvatarElement(participant);
            } else {
                // Fallback
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
            
            if (isAdmin && currentMode === 'admin') {
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
            
            // Meals
            const mealsCell = document.createElement('td');
            mealsCell.className = 'meals-cell';
            
            if (isAdmin && currentMode === 'admin') {
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
                const mealsValue = currentSheetData.expenses[participant].meals;
                mealsCell.textContent = mealsValue === 3 ? 'All Meals' : mealsValue + ' Meal' + (mealsValue > 1 ? 's' : '');
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
        
        // Total Row
        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.innerHTML = `
            <td>Total</td>
            <td class="amount-cell" id="totalSpentCell">0.00 SAR</td>
            <td></td>
            <td></td>
        `;
        tableBody.appendChild(totalRow);
    }
    
    function calculateShares() {
        if (!isAdmin) return;
        
        let totalSpent = 0;
        let totalMeals = 0;
        let oneMealCount = 0, twoMealsCount = 0, threeMealsCount = 0;
        
        selectedParticipants.forEach(participant => {
            totalSpent += currentSheetData.expenses[participant].spent;
            totalMeals += currentSheetData.expenses[participant].meals;
            
            switch(currentSheetData.expenses[participant].meals) {
                case 1: oneMealCount++; break;
                case 2: twoMealsCount++; break;
                case 3: threeMealsCount++; break;
            }
        });
        
        const costPerMeal = totalMeals > 0 ? totalSpent / totalMeals : 0;
        
        // Update Summary
        totalParticipantsElement.textContent = selectedParticipants.length;
        document.getElementById('totalSpentCell').textContent = totalSpent.toFixed(2) + ' SAR';
        totalSpentElement.textContent = totalSpent.toFixed(2) + ' SAR';
        totalMealsElement.textContent = totalMeals;
        costPerMealElement.textContent = costPerMeal.toFixed(2) + ' SAR';
        oneMealCountElement.textContent = oneMealCount;
        twoMealsCountElement.textContent = twoMealsCount;
        threeMealsCountElement.textContent = threeMealsCount;
        
        // Calculate To Be Paid with CSS variable colors
        selectedParticipants.forEach(participant => {
            const spentAmount = currentSheetData.expenses[participant].spent;
            const mealsAttended = currentSheetData.expenses[participant].meals;
            const shareAmount = costPerMeal * mealsAttended;
            const toBePaid = shareAmount - spentAmount;
            
            currentSheetData.expenses[participant].toBePaid = toBePaid;
            
            const toBePaidCell = document.querySelector(`td[data-participant="${participant}"]`);
            if (toBePaidCell) {
                toBePaidCell.textContent = toBePaid.toFixed(2) + ' SAR';
                // Use CSS variables instead of hardcoded colors
                if (toBePaid > 0) {
                    toBePaidCell.style.color = 'var(--danger-color)';
                } else if (toBePaid < 0) {
                    toBePaidCell.style.color = 'var(--success-color)';
                } else {
                    toBePaidCell.style.color = 'var(--text-color)';
                }
            }
        });
        
        currentSheetData.totalSpent = totalSpent;
        currentSheetData.totalMeals = totalMeals;
        currentSheetData.costPerMeal = costPerMeal;
        currentSheetData.lastUpdated = formatDateTime(new Date());
        
        generateSettlementSuggestions();
    }
    
    // New function to get participant's banks with preferred bank first
    function getParticipantBanks(participantName) {
        if (!window.profileManager) return [];
        
        const profile = window.profileManager.getProfile(participantName);
        if (!profile.bankAccounts || !profile.bankAccounts.trim()) {
            return [];
        }
        
        const bankAccounts = window.profileManager.parseBankAccounts(profile.bankAccounts);
        const banks = [...new Set(bankAccounts.map(acc => acc.bank))];
        
        // Put preferred bank first if it exists
        if (profile.preferredBank && profile.preferredBank !== '' && banks.includes(profile.preferredBank)) {
            const preferredIndex = banks.indexOf(profile.preferredBank);
            if (preferredIndex > 0) {
                banks.splice(preferredIndex, 1);
                banks.unshift(profile.preferredBank);
            }
        }
        
        return banks;
    }
    
    // Enhanced settlement algorithm with bank prioritization and preferred banks
    function generateSettlementSuggestions() {
        const creditors = [];
        const debtors = [];
        
        selectedParticipants.forEach(participant => {
            const balance = currentSheetData.expenses[participant].toBePaid;
            if (balance < 0) {
                // Creditors (should receive money)
                creditors.push({ 
                    name: participant, 
                    amount: -balance,
                    banks: getParticipantBanks(participant),
                    preferredBank: window.profileManager ? 
                                  window.profileManager.getProfile(participant).preferredBank || '' : '',
                    bankCount: getParticipantBanks(participant).length
                });
            } else if (balance > 0) {
                // Debtors (should pay money)
                debtors.push({ 
                    name: participant, 
                    amount: balance,
                    banks: getParticipantBanks(participant),
                    preferredBank: window.profileManager ? 
                                  window.profileManager.getProfile(participant).preferredBank || '' : '',
                    bankCount: getParticipantBanks(participant).length
                });
            }
        });
        
        // Sort creditors and debtors by priority:
        // 1. Single-bank participants with preferred bank
        // 2. Single-bank participants without preferred bank
        // 3. Multi-bank participants with preferred bank
        // 4. Multi-bank participants without preferred bank
        creditors.sort((a, b) => {
            if (a.bankCount === 1 && b.bankCount > 1) return -1;
            if (a.bankCount > 1 && b.bankCount === 1) return 1;
            if (a.preferredBank && !b.preferredBank) return -1;
            if (!a.preferredBank && b.preferredBank) return 1;
            return b.amount - a.amount;
        });
        
        debtors.sort((a, b) => {
            if (a.bankCount === 1 && b.bankCount > 1) return -1;
            if (a.bankCount > 1 && b.bankCount === 1) return 1;
            if (a.preferredBank && !b.preferredBank) return -1;
            if (!a.preferredBank && b.preferredBank) return 1;
            return b.amount - a.amount;
        });
        
        const settlements = [];
        
        // Create working copies
        const workingCreditors = JSON.parse(JSON.stringify(creditors));
        const workingDebtors = JSON.parse(JSON.stringify(debtors));
        
        // PHASE 1: Match single-bank participants with preferred bank first
        for (let i = 0; i < workingDebtors.length; i++) {
            const debtor = workingDebtors[i];
            if (debtor.amount < 0.01) continue;
            
            // For single-bank debtors, try to match with same-bank creditors
            if (debtor.bankCount === 1) {
                const debtorBank = debtor.banks[0];
                
                // First, try to match with creditors who have the same preferred bank
                for (let j = 0; j < workingCreditors.length; j++) {
                    const creditor = workingCreditors[j];
                    if (creditor.amount < 0.01) continue;
                    
                    // Check if creditor has the same preferred bank
                    if (creditor.preferredBank === debtorBank) {
                        const settlementAmount = Math.min(debtor.amount, creditor.amount);
                        
                        if (settlementAmount > 0.01) {
                            const settlementKey = `${debtor.name}_to_${creditor.name}`;
                            
                            settlements.push({
                                from: debtor.name,
                                to: creditor.name,
                                amount: settlementAmount.toFixed(2),
                                key: settlementKey,
                                status: currentSheetData.settlements && currentSheetData.settlements[settlementKey] 
                                       ? currentSheetData.settlements[settlementKey].status 
                                       : 'not-paid',
                                bankMatch: true,
                                bank: debtorBank,
                                priority: 'single-bank-preferred-match',
                                preferredMatch: true
                            });
                            
                            debtor.amount -= settlementAmount;
                            creditor.amount -= settlementAmount;
                            
                            if (debtor.amount < 0.01) {
                                workingDebtors.splice(i, 1);
                                i--;
                                break;
                            }
                            
                            if (creditor.amount < 0.01) {
                                workingCreditors.splice(j, 1);
                                j--;
                            }
                        }
                    }
                }
                
                // If debtor still has amount, try with any creditor having the same bank
                if (debtor.amount > 0.01) {
                    for (let j = 0; j < workingCreditors.length; j++) {
                        const creditor = workingCreditors[j];
                        if (creditor.amount < 0.01) continue;
                        
                        // Check if creditor has the same bank (not necessarily preferred)
                        if (creditor.banks.includes(debtorBank)) {
                            const settlementAmount = Math.min(debtor.amount, creditor.amount);
                            
                            if (settlementAmount > 0.01) {
                                const settlementKey = `${debtor.name}_to_${creditor.name}`;
                                
                                settlements.push({
                                    from: debtor.name,
                                    to: creditor.name,
                                    amount: settlementAmount.toFixed(2),
                                    key: settlementKey,
                                    status: currentSheetData.settlements && currentSheetData.settlements[settlementKey] 
                                           ? currentSheetData.settlements[settlementKey].status 
                                           : 'not-paid',
                                    bankMatch: true,
                                    bank: debtorBank,
                                    priority: 'single-bank-any-match',
                                    preferredMatch: false
                                });
                                
                                debtor.amount -= settlementAmount;
                                creditor.amount -= settlementAmount;
                                
                                if (debtor.amount < 0.01) {
                                    workingDebtors.splice(i, 1);
                                    i--;
                                    break;
                                }
                                
                                if (creditor.amount < 0.01) {
                                    workingCreditors.splice(j, 1);
                                    j--;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // PHASE 2: Match multi-bank participants with preferred banks first
        for (let i = 0; i < workingDebtors.length; i++) {
            const debtor = workingDebtors[i];
            if (debtor.amount < 0.01) continue;
            
            // For multi-bank debtors, try preferred bank first
            if (debtor.preferredBank) {
                const preferredBank = debtor.preferredBank;
                
                for (let j = 0; j < workingCreditors.length; j++) {
                    const creditor = workingCreditors[j];
                    if (creditor.amount < 0.01) continue;
                    
                    // Check if creditor has the same preferred bank
                    if (creditor.banks.includes(preferredBank)) {
                        const settlementAmount = Math.min(debtor.amount, creditor.amount);
                        
                        if (settlementAmount > 0.01) {
                            const settlementKey = `${debtor.name}_to_${creditor.name}`;
                            
                            settlements.push({
                                from: debtor.name,
                                to: creditor.name,
                                amount: settlementAmount.toFixed(2),
                                key: settlementKey,
                                status: currentSheetData.settlements && currentSheetData.settlements[settlementKey] 
                                       ? currentSheetData.settlements[settlementKey].status 
                                       : 'not-paid',
                                bankMatch: true,
                                bank: preferredBank,
                                priority: 'multi-bank-preferred-match',
                                preferredMatch: true
                            });
                            
                            debtor.amount -= settlementAmount;
                            creditor.amount -= settlementAmount;
                            
                            if (debtor.amount < 0.01) {
                                workingDebtors.splice(i, 1);
                                i--;
                                break;
                            }
                            
                            if (creditor.amount < 0.01) {
                                workingCreditors.splice(j, 1);
                                j--;
                            }
                            
                            break; // Move to next debtor
                        }
                    }
                }
            }
            
            // If debtor still has amount or no preferred bank, try all banks
            if (debtor.amount > 0.01) {
                for (const debtorBank of debtor.banks) {
                    for (let j = 0; j < workingCreditors.length; j++) {
                        const creditor = workingCreditors[j];
                        if (creditor.amount < 0.01) continue;
                        
                        // Check if creditor has the same bank
                        if (creditor.banks.includes(debtorBank)) {
                            const settlementAmount = Math.min(debtor.amount, creditor.amount);
                            
                            if (settlementAmount > 0.01) {
                                const settlementKey = `${debtor.name}_to_${creditor.name}`;
                                
                                settlements.push({
                                    from: debtor.name,
                                    to: creditor.name,
                                    amount: settlementAmount.toFixed(2),
                                    key: settlementKey,
                                    status: currentSheetData.settlements && currentSheetData.settlements[settlementKey] 
                                           ? currentSheetData.settlements[settlementKey].status 
                                           : 'not-paid',
                                    bankMatch: true,
                                    bank: debtorBank,
                                    priority: 'multi-bank-any-match',
                                    preferredMatch: false
                                });
                                
                                debtor.amount -= settlementAmount;
                                creditor.amount -= settlementAmount;
                                
                                if (debtor.amount < 0.01) {
                                    workingDebtors.splice(i, 1);
                                    i--;
                                    break;
                                }
                                
                                if (creditor.amount < 0.01) {
                                    workingCreditors.splice(j, 1);
                                    j--;
                                }
                                
                                break; // Move to next debtor bank
                            }
                        }
                    }
                    
                    if (debtor.amount < 0.01) break;
                }
            }
        }
        
        // PHASE 3: Match remaining amounts (no bank match required)
        let i = 0, j = 0;
        while (i < workingDebtors.length && j < workingCreditors.length) {
            const debtor = workingDebtors[i];
            const creditor = workingCreditors[j];
            
            if (debtor.amount < 0.01) {
                i++;
                continue;
            }
            
            if (creditor.amount < 0.01) {
                j++;
                continue;
            }
            
            const settlementAmount = Math.min(debtor.amount, creditor.amount);
            
            if (settlementAmount > 0.01) {
                const settlementKey = `${debtor.name}_to_${creditor.name}`;
                
                settlements.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: settlementAmount.toFixed(2),
                    key: settlementKey,
                    status: currentSheetData.settlements && currentSheetData.settlements[settlementKey] 
                           ? currentSheetData.settlements[settlementKey].status 
                           : 'not-paid',
                    bankMatch: false,
                    bank: null,
                    priority: 'no-bank-match',
                    preferredMatch: false
                });
                
                debtor.amount -= settlementAmount;
                creditor.amount -= settlementAmount;
                
                if (debtor.amount < 0.01) i++;
                if (creditor.amount < 0.01) j++;
            } else {
                if (debtor.amount <= creditor.amount) i++;
                else j++;
            }
        }
        
        // Sort settlements by priority
        settlements.sort((a, b) => {
            const priorityOrder = {
                'single-bank-preferred-match': 1,
                'single-bank-any-match': 2,
                'multi-bank-preferred-match': 3,
                'multi-bank-any-match': 4,
                'no-bank-match': 5
            };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        // Store settlements in currentSheetData
        currentSheetData.settlements = {};
        settlements.forEach(settlement => {
            currentSheetData.settlements[settlement.key] = {
                from: settlement.from,
                to: settlement.to,
                amount: settlement.amount,
                status: settlement.status,
                bankMatch: settlement.bankMatch,
                bank: settlement.bank,
                preferredMatch: settlement.preferredMatch
            };
        });
        
        renderSettlementList(settlements);
    }
    
    function renderSettlementList(settlements) {
        settlementList.innerHTML = '';
        if (settlements.length === 0) {
            settlementList.innerHTML = '<div class="no-settlements">All balances are settled! 🎉</div>';
        } else {
            settlements.forEach(settlement => {
                const settlementItem = document.createElement('div');
                settlementItem.className = 'settlement-item';
                
                // Check if we're in admin mode AND the user is logged in as admin
                const showAdminControls = isAdmin && currentMode === 'admin';
                
                // Create bank match indicator if applicable
                let bankInfo = '';
                if (settlement.bankMatch && settlement.bank) {
                    let preferredText = '';
                    if (settlement.preferredMatch) {
                        preferredText = ' (Preferred)';
                    }
                    bankInfo = `
                        <div class="settlement-bank-info">
                            <div class="bank-match-indicator">
                                <span>Same Bank: ${settlement.bank}${preferredText}</span>
                            </div>
                        </div>
                    `;
                }
                
                if (showAdminControls) {
                    // Admin mode with toggle button
                    const isPaid = settlement.status === 'paid';
                    const statusClass = isPaid ? 'paid' : 'not-paid';
                    const statusText = isPaid ? 'Paid' : 'Not Paid';
                    
                    settlementItem.innerHTML = `
                        <div class="settlement-details">
                            <div class="settlement-first-line">
                                <span class="settlement-from" style="font-weight: 600;">${settlement.from}</span>
                                <span class="settlement-arrow">→</span>
                                <span class="settlement-to" style="font-weight: 600;">${settlement.to}</span>
                            </div>
                            <div class="settlement-second-line">
                                <span class="settlement-amount">${settlement.amount} SAR</span>
                                <button class="settlement-toggle-btn ${statusClass}" data-key="${settlement.key}">
                                    ${statusText}
                                </button>
                            </div>
                            ${bankInfo}
                        </div>
                    `;
                    
                    const toggleBtn = settlementItem.querySelector('.settlement-toggle-btn');
                    toggleBtn.addEventListener('click', function() {
                        const newStatus = currentSheetData.settlements[this.dataset.key].status === 'paid' ? 'not-paid' : 'paid';
                        currentSheetData.settlements[this.dataset.key].status = newStatus;
                        
                        // Update button appearance
                        if (newStatus === 'paid') {
                            this.className = 'settlement-toggle-btn paid';
                            this.textContent = 'Paid';
                        } else {
                            this.className = 'settlement-toggle-btn not-paid';
                            this.textContent = 'Not Paid';
                        }
                        
                        saveSheet();
                    });
                } else {
                    // Viewer mode or admin in viewer tab - show static status
                    const statusClass = settlement.status === 'paid' ? 'status-paid' : 'status-not-paid';
                    const statusText = settlement.status === 'paid' ? 'Paid' : 'Not Paid';
                    
                    settlementItem.innerHTML = `
                        <div class="settlement-details">
                            <div class="settlement-first-line">
                                <span class="settlement-from" style="font-weight: 600;">${settlement.from}</span>
                                <span class="settlement-arrow">→</span>
                                <span class="settlement-to" style="font-weight: 600;">${settlement.to}</span>
                            </div>
                            <div class="settlement-second-line">
                                <span class="settlement-amount">${settlement.amount} SAR</span>
                                <span class="settlement-status ${statusClass}">${statusText}</span>
                            </div>
                            ${bankInfo}
                        </div>
                    `;
                }
                
                settlementList.appendChild(settlementItem);
            });
        }
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
        loadSavedSheets();
        
        // Auto-sync to cloud
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        alert('Sheet saved successfully!');
    }
    
    function closeSheet() {
        sheetSection.style.display = 'none';
        participantsSection.style.display = 'none';
        editParticipantsSection.style.display = 'none';
        currentSheetData = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function showDeleteConfirmation() {
        if (!isAdmin) return;
        deleteModal.style.display = 'flex';
    }
    
    function hideDeleteConfirmation() {
        deleteModal.style.display = 'none';
    }
    
    function deleteCurrentSheet() {
        if (!currentSheetData || !isAdmin) return;
        
        savedSheets = savedSheets.filter(sheet => sheet.id !== currentSheetData.id);
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        loadSavedSheets();
        closeSheet();
        hideDeleteConfirmation();
        alert('Sheet deleted successfully!');
    }
    
    // Participants Management Functions
    function addCustomParticipant(inputElement, listElement) {
        if (!isAdmin) return;
        
        const customName = inputElement.value.trim();
        if (!customName) {
            alert('Please enter a participant name');
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
        
        // Add new participant
        const participantItem = document.createElement('li');
        participantItem.className = 'participant custom-participant';
        participantItem.style.borderLeft = '3px solid var(--primary-color)';
        
        const participantWithAvatar = document.createElement('div');
        participantWithAvatar.className = 'participant-with-avatar';
        
        // Create avatar using ProfileManager
        let avatar;
        if (window.profileManager) {
            avatar = window.profileManager.createAvatarElement(customName);
        } else {
            // Fallback
            avatar = document.createElement('div');
            avatar.className = 'participant-avatar-small';
            avatar.style.backgroundColor = '#3498db';
            avatar.style.color = 'white';
            avatar.textContent = customName.charAt(0).toUpperCase();
        }
        
        participantWithAvatar.appendChild(avatar);
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'participant-name';
        nameSpan.textContent = customName;
        nameSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.profileManager) {
                window.profileManager.openProfileCard(customName);
            }
        });
        participantWithAvatar.appendChild(nameSpan);
        
        participantItem.appendChild(participantWithAvatar);
        
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';
        checkboxContainer.innerHTML = `<input type="checkbox" id="custom_${Date.now()}" value="${customName}" checked>`;
        
        participantItem.appendChild(checkboxContainer);
        listElement.appendChild(participantItem);
        
        inputElement.value = '';
        alert(`Participant "${customName}" added successfully!`);
    }
    
    function addCustomParticipantToEdit(inputElement, listElement) {
        if (!isAdmin) return;
        
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
    
    function openEditParticipants() {
        if (!isAdmin || !currentSheetData) return;
        
        editParticipantsList.innerHTML = '';
        
        // Sort participants alphabetically for display
        const sortedParticipants = [...selectedParticipants].sort(alphabeticalSort);
        
        sortedParticipants.forEach(participant => {
            addParticipantToEditList(participant);
        });
        
        editCustomParticipantInput.value = '';
        editParticipantsSection.style.display = 'block';
        sheetSection.style.display = 'none';
        editParticipantsSection.scrollIntoView({ behavior: 'smooth' });
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
        editParticipantsSection.style.display = 'none';
        sheetSection.style.display = 'block';
        alert('Participants updated successfully!');
    }
    
    function cancelEditParticipants() {
        editParticipantsSection.style.display = 'none';
        sheetSection.style.display = 'block';
    }
    
    function resetSummary() {
        totalParticipantsElement.textContent = '0';
        totalSpentElement.textContent = '0.00 SAR';
        totalMealsElement.textContent = '0';
        costPerMealElement.textContent = '0.00 SAR';
        oneMealCountElement.textContent = '0';
        twoMealsCountElement.textContent = '0';
        threeMealsCountElement.textContent = '0';
        settlementList.innerHTML = '<div class="no-settlements">Calculate shares to see settlement suggestions</div>';
    }
    
    function loadSavedSheets() {
        // Update viewer sheets list
        if (savedSheets.length === 0) {
            noSheetsMessage.style.display = 'block';
            sheetsList.style.display = 'none';
            if (adminNoSheetsMessage) adminNoSheetsMessage.style.display = 'block';
            if (adminSheetsList) adminSheetsList.style.display = 'none';
            return;
        }
        
        noSheetsMessage.style.display = 'none';
        sheetsList.style.display = 'block';
        sheetsList.innerHTML = '';
        
        if (adminNoSheetsMessage) adminNoSheetsMessage.style.display = 'none';
        if (adminSheetsList) {
            adminSheetsList.style.display = 'block';
            adminSheetsList.innerHTML = '';
        }
        
        // Sort sheets by creation date (newest first)
        savedSheets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        savedSheets.forEach(sheet => {
            // For viewer mode
            const sheetItem = createSheetListItem(sheet, false);
            sheetsList.appendChild(sheetItem);
            
            // For admin mode
            if (adminSheetsList) {
                const adminSheetItem = createSheetListItem(sheet, true);
                adminSheetsList.appendChild(adminSheetItem);
            }
        });
    }
    
    function createSheetListItem(sheet, isAdminList) {
        const sheetItem = document.createElement('li');
        sheetItem.className = 'sheet-item';
        
        const sheetInfo = document.createElement('div');
        const displayDate = sheet.lastUpdated ? formatDateTime(new Date(sheet.lastUpdated)) : 
                          sheet.date ? formatDateTime(new Date(sheet.date)) : 
                          formatDateTime(new Date(sheet.createdAt));
        
        sheetInfo.innerHTML = `
            <strong>${sheet.name}</strong>
            <div class="sheet-date">Updated: ${displayDate}</div>
        `;
        
        const sheetActions = document.createElement('div');
        sheetActions.className = 'sheet-item-actions';
        
        if (isAdmin && isAdminList && currentMode === 'admin') {
            const renameBtn = document.createElement('button');
            renameBtn.className = 'rename-sheet-btn';
            renameBtn.innerHTML = '✏️';
            renameBtn.title = 'Rename Sheet';
            renameBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                renameSheet(sheet.id);
            });
            sheetActions.appendChild(renameBtn);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-sheet-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete Sheet';
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${sheet.name}"?`)) {
                    deleteSheet(sheet.id);
                }
            });
            sheetActions.appendChild(deleteBtn);
        }
        
        sheetItem.appendChild(sheetInfo);
        sheetItem.appendChild(sheetActions);
        
        sheetItem.addEventListener('click', function() {
            openSheet(sheet.id);
        });
        
        return sheetItem;
    }
    
    function renameSheet(sheetId) {
        if (!isAdmin) return;
        
        const sheet = savedSheets.find(s => s.id === sheetId);
        if (!sheet) {
            alert('Sheet not found!');
            return;
        }
        
        const newName = prompt('Enter new name for the sheet:', sheet.name);
        if (newName && newName.trim() !== '') {
            const trimmedName = newName.trim();
            
            // Update the sheet name
            sheet.name = trimmedName;
            sheet.lastUpdated = formatDateTime(new Date());
            
            // Save to localStorage
            localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
            
            // Force sync to Firebase
            if (window.firebaseSync && window.firebaseSync.isInitialized) {
                window.firebaseSync.saveSheetsToCloud(savedSheets);
            }
            
            // Update UI
            loadSavedSheets();
            
            // Update current sheet if it's open
            if (currentSheetData && currentSheetData.id === sheetId) {
                currentSheetData.name = trimmedName;
                sheetName.textContent = trimmedName;
            }
            
            alert('Sheet renamed successfully!');
        }
    }
    
    function deleteSheet(sheetId) {
        if (!isAdmin) return;
        
        savedSheets = savedSheets.filter(sheet => sheet.id !== sheetId);
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(savedSheets));
        
        // Sync to Firebase after deletion
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveSheetsToCloud(savedSheets);
        }
        
        loadSavedSheets();
        
        if (currentSheetData && currentSheetData.id === sheetId) {
            closeSheet();
        }
        
        alert('Sheet deleted successfully!');
    }
    
    function openSheet(sheetId) {
        const sheet = savedSheets.find(s => s.id === sheetId);
        if (!sheet) {
            alert('Sheet not found!');
            return;
        }
        
        currentSheetData = JSON.parse(JSON.stringify(sheet));
        
        // Sort participants alphabetically when opening sheet
        currentSheetData.participants.sort(alphabeticalSort);
        selectedParticipants = currentSheetData.participants;
        
        sheetName.textContent = currentSheetData.name;
        
        renderExpenseTable();
        
        let totalSpent = 0;
        let totalMeals = 0;
        let oneMealCount = 0, twoMealsCount = 0, threeMealsCount = 0;
        
        selectedParticipants.forEach(participant => {
            totalSpent += currentSheetData.expenses[participant].spent;
            totalMeals += currentSheetData.expenses[participant].meals;
            
            switch(currentSheetData.expenses[participant].meals) {
                case 1: oneMealCount++; break;
                case 2: twoMealsCount++; break;
                case 3: threeMealsCount++; break;
            }
        });
        
        const costPerMeal = totalMeals > 0 ? totalSpent / totalMeals : 0;
        
        totalParticipantsElement.textContent = selectedParticipants.length;
        document.getElementById('totalSpentCell').textContent = totalSpent.toFixed(2) + ' SAR';
        totalSpentElement.textContent = totalSpent.toFixed(2) + ' SAR';
        totalMealsElement.textContent = totalMeals;
        costPerMealElement.textContent = costPerMeal.toFixed(2) + ' SAR';
        oneMealCountElement.textContent = oneMealCount;
        twoMealsCountElement.textContent = twoMealsCount;
        threeMealsCountElement.textContent = threeMealsCount;
        
        selectedParticipants.forEach(participant => {
            const spentAmount = currentSheetData.expenses[participant].spent;
            const mealsAttended = currentSheetData.expenses[participant].meals;
            const shareAmount = costPerMeal * mealsAttended;
            const toBePaid = shareAmount - spentAmount;
            currentSheetData.expenses[participant].toBePaid = toBePaid;
            
            const toBePaidCell = document.querySelector(`td[data-participant="${participant}"]`);
            if (toBePaidCell) {
                toBePaidCell.textContent = toBePaid.toFixed(2) + ' SAR';
                // Use CSS variables instead of hardcoded colors
                if (toBePaid > 0) {
                    toBePaidCell.style.color = 'var(--danger-color)';
                } else if (toBePaid < 0) {
                    toBePaidCell.style.color = 'var(--success-color)';
                } else {
                    toBePaidCell.style.color = 'var(--text-color)';
                }
            }
        });
        
        generateSettlementSuggestions();
        
        sheetSection.style.display = 'block';
        participantsSection.style.display = 'none';
        editParticipantsSection.style.display = 'none';
        sheetSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Utility function to format date and time
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
    
    // PDF Generation Handler
    function handlePDFGeneration() {
        if (!currentSheetData) {
            alert('No sheet data available to share');
            return;
        }
        
        // Ensure calculations are done
        if (isAdmin && (!currentSheetData.totalSpent || currentSheetData.totalSpent === 0)) {
            calculateShares();
        }
        
        // Use the PDF generator
        if (window.generateExpensePDF) {
            window.generateExpensePDF(currentSheetData, selectedParticipants, isAdmin && currentMode === 'admin');
        } else {
            alert('PDF generator not loaded. Please refresh the page.');
        }
    }
    
    // Loading functions for PDF
    function showPDFLoading() {
        const loadingOverlay = document.getElementById('pdfLoadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }
    
    function hidePDFLoading() {
        const loadingOverlay = document.getElementById('pdfLoadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    
    // Make functions available globally for PDF generator
    window.showPDFLoading = showPDFLoading;
    window.hidePDFLoading = hidePDFLoading;
    window.loadSavedSheets = loadSavedSheets;
    window.renderExpenseTable = renderExpenseTable; // Added for Firebase sync
    window.currentSheetData = currentSheetData; // Make it accessible globally
});