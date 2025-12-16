// export-manager.js - FINAL FIXED VERSION v1.8.3
class ExportManager {
    constructor() {
        this.selectedFormat = 'excel';
        this.exportType = 'single';
        this.currentSheet = null;
        this.importStep = 1;
        this.importData = null;
    }

    // Initialize export functionality
    initialize() {
        console.log('Export Manager initialized v1.8.3');
        
        // Setup event listeners
        setTimeout(() => {
            this.setupEventListeners();
        }, 500);
    }

    // Setup event listeners for export buttons
    setupEventListeners() {
        console.log('Setting up export event listeners...');
        
        // Event delegation for all export buttons
        document.addEventListener('click', (e) => {
            // Export All Sheets button in Control Panel
            if (e.target.id === 'exportAllSheetsBtn' || e.target.closest('#exportAllSheetsBtn')) {
                e.preventDefault();
                e.stopPropagation();
                this.showExportModal('all');
            }
            
            // Backup All Data button in Control Panel
            else if (e.target.id === 'backupAllDataBtn' || e.target.closest('#backupAllDataBtn')) {
                e.preventDefault();
                e.stopPropagation();
                this.createCompleteBackup();
            }
            
            // Import Data button in Control Panel
            else if (e.target.id === 'importDataBtn' || e.target.closest('#importDataBtn')) {
                e.preventDefault();
                e.stopPropagation();
                this.showImportModal();
            }
            
            // Start Export button in modal
            else if (e.target.id === 'startExportBtn' || e.target.closest('#startExportBtn')) {
                e.preventDefault();
                e.stopPropagation();
                this.startExport();
            }
        });

        // Export modal cancel button
        document.getElementById('cancelExportBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideExportModal();
        });

        // Import modal buttons
        const cancelImportBtn = document.getElementById('cancelImportBtn');
        if (cancelImportBtn) {
            cancelImportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideImportModal();
            });
        }

        document.getElementById('browseImportFileBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput')?.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        document.getElementById('nextImportStepBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.nextImportStep();
        });

        document.getElementById('prevImportStepBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.prevImportStep();
        });

        document.getElementById('confirmImportBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.confirmImport();
        });

        // Drag and drop for import
        const fileDropArea = document.getElementById('fileDropArea');
        if (fileDropArea) {
            fileDropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileDropArea.classList.add('drag-over');
            });

            fileDropArea.addEventListener('dragleave', () => {
                fileDropArea.classList.remove('drag-over');
            });

            fileDropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileDropArea.classList.remove('drag-over');
                if (e.dataTransfer.files.length) {
                    this.handleFileSelect(e.dataTransfer.files[0]);
                }
            });
        }
        
        console.log('Event listeners setup completed');
    }

    // Show export modal
    showExportModal(type = 'single', sheet = null) {
        console.log(`Showing export modal for type: ${type}`);
        
        this.exportType = type;
        this.currentSheet = sheet || window.currentSheetData;
        
        if (type === 'all') {
            const savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
            if (savedSheets.length === 0) {
                alert('No sheets available to export');
                return;
            }
        } else if (!this.currentSheet) {
            alert('No sheet data available to export');
            return;
        }
        
        const modalContent = document.getElementById('exportModalContent');
        if (!modalContent) {
            alert('Export modal not found. Please refresh the page.');
            return;
        }
        
        modalContent.innerHTML = this.getExportModalContent();
        
        // Set up format selection
        setTimeout(() => {
            document.querySelectorAll('.format-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    document.querySelectorAll('.format-option').forEach(o => o.classList.remove('selected'));
                    e.currentTarget.classList.add('selected');
                    this.selectedFormat = e.currentTarget.dataset.format;
                    
                    // Update format display
                    const formatDisplay = document.getElementById('formatDisplay');
                    const sizeEstimate = document.getElementById('sizeEstimate');
                    
                    if (formatDisplay) {
                        formatDisplay.textContent = this.getFormatDisplayName(this.selectedFormat);
                    }
                    
                    if (sizeEstimate) {
                        sizeEstimate.textContent = this.getSizeEstimate();
                    }
                });
            });
        }, 100);
        
        document.getElementById('exportModal').style.display = 'flex';
    }

    // Get export modal content - REMOVED CSV OPTION
    getExportModalContent() {
        const isSingle = this.exportType === 'single';
        let sheetName = '';
        
        if (isSingle) {
            sheetName = this.currentSheet?.name || 'Current Sheet';
        } else {
            const savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
            sheetName = savedSheets.length === 1 ? '1_Sheet' : `${savedSheets.length}_Sheets`;
        }
        
        const timestamp = this.getTimestamp();
        const defaultFileName = `HisaabKitaab_${this.sanitizeFileName(sheetName)}_${timestamp}`;
        
        return `
            <div class="export-format-options">
                <div class="format-option selected" data-format="excel">
                    <span class="format-icon">📊</span>
                    <h4>Excel (.xlsx)</h4>
                    <p>Best for sharing & analysis</p>
                </div>
                <div class="format-option" data-format="json">
                    <span class="format-icon">🔧</span>
                    <h4>JSON (.json)</h4>
                    <p>For data backup</p>
                </div>
            </div>
            
            <div class="export-details">
                <h4>Export Details</h4>
                <div class="file-name-preview">
                    <span>📁</span>
                    <input type="text" id="exportFileName" value="${defaultFileName}" class="file-name-input">
                    <button type="button" class="btn btn-small" onclick="this.previousElementSibling.select(); document.execCommand('copy'); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000);">Copy</button>
                </div>
                <div style="margin-top: 10px;">
                    <strong>Exporting:</strong> ${isSingle ? '1 sheet' : 'All sheets'} <br>
                    <strong>Format:</strong> <span id="formatDisplay">${this.getFormatDisplayName('excel')}</span> <br>
                    <strong>Estimated size:</strong> <span id="sizeEstimate">${this.getSizeEstimate()}</span>
                </div>
            </div>
            
            <div class="modal-buttons" style="margin-top: 20px;">
                <button type="button" id="startExportBtn" class="btn btn-success">Start Export</button>
            </div>
        `;
    }

    // Sanitize file name for Excel
    sanitizeFileName(name) {
        // Remove invalid Excel characters
        return name.replace(/[:\\\/?*[\]]/g, '_')
                   .replace(/\s+/g, '_')
                   .substring(0, 50);
    }

    // Sanitize Excel sheet name (max 31 chars, no invalid chars)
    sanitizeSheetName(name) {
        return name.replace(/[:\\\/?*[\]]/g, '_')
                   .substring(0, 31);
    }

    // Get format display name
    getFormatDisplayName(format) {
        switch(format) {
            case 'excel': return 'Excel (.xlsx)';
            case 'json': return 'JSON (.json)';
            default: return 'Excel (.xlsx)';
        }
    }

    // Get size estimate
    getSizeEstimate() {
        if (this.exportType === 'single') {
            return '~50KB';
        } else {
            const savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
            const sheetCount = savedSheets.length;
            const size = sheetCount * 50;
            return size < 1000 ? `~${size}KB` : `~${(size/1000).toFixed(1)}MB`;
        }
    }

    // Hide export modal
    hideExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Start export process
    async startExport() {
        console.log(`Starting ${this.selectedFormat} export for ${this.exportType}`);
        this.showExportLoading();
        
        try {
            let data, fileName;
            
            if (this.exportType === 'single') {
                data = this.currentSheet;
                if (!data) throw new Error('No sheet data available');
                fileName = document.getElementById('exportFileName')?.value || 
                          `HisaabKitaab_${this.sanitizeFileName(data.name)}_${this.getTimestamp()}`;
            } else {
                const savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
                if (savedSheets.length === 0) throw new Error('No sheets available to export');
                data = savedSheets;
                fileName = document.getElementById('exportFileName')?.value || 
                          `HisaabKitaab_AllSheets_${this.getTimestamp()}`;
            }
            
            // Update progress
            this.updateExportProgress(30);
            
            let fileContent, fileExtension, mimeType;
            
            switch (this.selectedFormat) {
                case 'excel':
                    fileContent = this.generateExcel(data);
                    fileExtension = 'xlsx';
                    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    break;
                case 'json':
                    fileContent = JSON.stringify(data, null, 2);
                    fileExtension = 'json';
                    mimeType = 'application/json';
                    break;
                default:
                    throw new Error('Unsupported export format');
            }
            
            this.updateExportProgress(80);
            
            // Download file
            this.downloadFile(fileContent, `${fileName}.${fileExtension}`, mimeType);
            
            this.updateExportProgress(100);
            
            setTimeout(() => {
                this.hideExportLoading();
                this.hideExportModal();
                this.showExportSuccess();
            }, 500);
            
        } catch (error) {
            console.error('Export failed:', error);
            this.hideExportLoading();
            this.showExportError(error.message);
        }
    }

    // Generate Excel file
    generateExcel(data) {
        const isSingle = this.exportType === 'single';
        
        if (isSingle) {
            return this.generateSingleSheetExcel(data);
        } else {
            return this.generateAllSheetsExcel(data);
        }
    }

    // Generate Excel for single sheet
    generateSingleSheetExcel(sheetData) {
        try {
            const wb = XLSX.utils.book_new();
            
            // Main data sheet
            const participants = sheetData.participants || [];
            const expenses = sheetData.expenses || {};
            
            const mainData = [
                ['HisaabKitaab - Expense Sheet', '', '', ''],
                [`Sheet Name: ${sheetData.name}`, '', '', ''],
                [`Date: ${sheetData.date || sheetData.lastUpdated || ''}`, '', '', ''],
                [`Version: ${sheetData.version || '1.8'}`, '', '', ''],
                ['', '', '', ''],
                ['Participant', 'Spent (SAR)', 'Meals', 'To Be Paid (SAR)']
            ];
            
            let totalSpent = 0;
            let totalMeals = 0;
            
            participants.forEach(participant => {
                const expense = expenses[participant] || { spent: 0, meals: 3, toBePaid: 0 };
                mainData.push([
                    participant,
                    expense.spent,
                    expense.meals === 3 ? 'All Meals' : `${expense.meals} Meal${expense.meals > 1 ? 's' : ''}`,
                    expense.toBePaid
                ]);
                
                totalSpent += expense.spent;
                totalMeals += expense.meals;
            });
            
            mainData.push(['', '', '', '']);
            mainData.push(['Total', totalSpent, totalMeals, '']);
            mainData.push(['Cost Per Meal', totalMeals > 0 ? (totalSpent / totalMeals).toFixed(2) : 0, '', '']);
            
            const ws = XLSX.utils.aoa_to_sheet(mainData);
            
            // Style range (bold headers)
            ws['!merges'] = [
                XLSX.utils.decode_range("A1:D1"),
                XLSX.utils.decode_range("A2:D2"),
                XLSX.utils.decode_range("A3:D3"),
                XLSX.utils.decode_range("A4:D4")
            ];
            
            XLSX.utils.book_append_sheet(wb, ws, this.sanitizeSheetName('Expense Data'));
            
            return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        } catch (error) {
            console.error('Error generating Excel:', error);
            throw new Error(`Failed to generate Excel: ${error.message}`);
        }
    }

    // Generate Excel for all sheets
    generateAllSheetsExcel(allSheets) {
        try {
            const wb = XLSX.utils.book_new();
            
            // Summary sheet
            const summaryData = [
                ['HisaabKitaab - All Sheets Export', '', '', '', ''],
                ['Export Date', new Date().toLocaleString(), '', '', ''],
                ['Total Sheets', allSheets.length, '', '', ''],
                ['', '', '', '', ''],
                ['Sheet Name', 'Date', 'Participants', 'Total Spent (SAR)', 'Version']
            ];
            
            allSheets.forEach((sheet, index) => {
                const participants = sheet.participants?.length || 0;
                const totalSpent = Object.values(sheet.expenses || {}).reduce((sum, exp) => sum + (exp.spent || 0), 0);
                
                summaryData.push([
                    sheet.name || `Sheet ${index + 1}`,
                    sheet.date || sheet.lastUpdated || '',
                    participants,
                    totalSpent.toFixed(2),
                    sheet.version || '1.6'
                ]);
            });
            
            const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
            ws1['!merges'] = [
                XLSX.utils.decode_range("A1:E1"),
                XLSX.utils.decode_range("A2:E2"),
                XLSX.utils.decode_range("A3:E3")
            ];
            XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
            
            // Individual sheets (limit to 20 sheets to avoid browser issues)
            const sheetsToExport = allSheets.slice(0, 20);
            
            sheetsToExport.forEach((sheet, index) => {
                if (sheet.participants && sheet.participants.length > 0) {
                    const sheetName = this.sanitizeSheetName(sheet.name || `Sheet${index + 1}`);
                    
                    // Create sheet data
                    const participants = sheet.participants || [];
                    const expenses = sheet.expenses || {};
                    
                    const sheetData = [
                        [`${sheet.name} - Expense Details`, '', '', ''],
                        ['Participant', 'Spent (SAR)', 'Meals', 'To Be Paid (SAR)']
                    ];
                    
                    participants.forEach(participant => {
                        const expense = expenses[participant] || { spent: 0, meals: 3, toBePaid: 0 };
                        sheetData.push([
                            participant,
                            expense.spent,
                            expense.meals === 3 ? 'All Meals' : `${expense.meals} Meal${expense.meals > 1 ? 's' : ''}`,
                            expense.toBePaid
                        ]);
                    });
                    
                    const ws = XLSX.utils.aoa_to_sheet(sheetData);
                    XLSX.utils.book_append_sheet(wb, ws, sheetName);
                }
            });
            
            return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        } catch (error) {
            console.error('Error generating all sheets Excel:', error);
            throw new Error(`Failed to generate Excel for all sheets: ${error.message}`);
        }
    }

    // Create complete backup
    async createCompleteBackup() {
        console.log('Creating complete backup...');
        this.showExportLoading('Creating backup...');
        
        try {
            const savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
            const defaultParticipants = JSON.parse(localStorage.getItem('hisaabKitaabDefaultParticipants')) || [];
            const profiles = window.profileManager?.getAllProfiles() || {};
            
            if (savedSheets.length === 0) {
                throw new Error('No sheets available to backup');
            }
            
            const backupData = {
                version: '1.8',
                exportDate: new Date().toISOString(),
                sheets: savedSheets,
                defaultParticipants: defaultParticipants,
                profiles: profiles,
                metadata: {
                    totalSheets: savedSheets.length,
                    totalParticipants: defaultParticipants.length,
                    totalProfiles: Object.keys(profiles).length,
                    appVersion: '1.8'
                }
            };
            
            this.updateExportProgress(50);
            
            // Create JSON backup
            const jsonContent = JSON.stringify(backupData, null, 2);
            const timestamp = this.getTimestamp();
            
            this.updateExportProgress(90);
            
            // Offer JSON download
            this.hideExportLoading();
            
            if (confirm('✅ Backup created!\n\nDownload backup file now?\n\nFile will contain:\n• All expense sheets\n• Default participants\n• Profile data')) {
                this.downloadFile(jsonContent, `HisaabKitaab_Backup_${timestamp}.json`, 'application/json');
                this.showExportSuccess('Backup downloaded successfully!');
            }
            
        } catch (error) {
            console.error('Backup failed:', error);
            this.hideExportLoading();
            this.showExportError(error.message);
        }
    }

    // Show import modal
    showImportModal() {
        console.log('Showing import modal...');
        
        this.importStep = 1;
        this.importData = null;
        
        // Reset modal
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const step3 = document.getElementById('step3');
        
        if (step1) step1.style.display = 'block';
        if (step2) step2.style.display = 'none';
        if (step3) step3.style.display = 'none';
        
        if (step1) step1.classList.add('active');
        if (step2) step2.classList.remove('active');
        if (step3) step3.classList.remove('active');
        
        const prevBtn = document.getElementById('prevImportStepBtn');
        const nextBtn = document.getElementById('nextImportStepBtn');
        const confirmBtn = document.getElementById('confirmImportBtn');
        
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'inline-block';
        if (confirmBtn) confirmBtn.style.display = 'none';
        
        // Clear file input
        const fileInput = document.getElementById('importFileInput');
        if (fileInput) fileInput.value = '';
        
        // Clear preview
        const preview = document.getElementById('importPreview');
        if (preview) preview.innerHTML = '';
        
        const modal = document.getElementById('importModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Hide import modal - FIXED
    hideImportModal() {
        const modal = document.getElementById('importModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Handle file selection for import
    async handleFileSelect(file) {
        if (!file) return;
        
        const fileType = file.name.split('.').pop().toLowerCase();
        
        if (!['xlsx', 'csv', 'json', 'txt'].includes(fileType)) {
            alert('Please select a valid file (.xlsx, .csv, .json)');
            return;
        }
        
        try {
            this.showExportLoading('Reading file...');
            
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    let data;
                    
                    if (fileType === 'xlsx') {
                        data = await this.parseExcelFile(e.target.result);
                    } else if (fileType === 'csv') {
                        data = this.parseCSVFile(e.target.result);
                    } else if (fileType === 'json') {
                        data = JSON.parse(e.target.result);
                        // Handle backup file format
                        if (data.sheets) {
                            data = data.sheets;
                        }
                    }
                    
                    if (!data || (Array.isArray(data) && data.length === 0)) {
                        throw new Error('No valid data found in file');
                    }
                    
                    this.importData = data;
                    this.hideExportLoading();
                    this.nextImportStep();
                    
                } catch (error) {
                    this.hideExportLoading();
                    alert(`Error parsing file: ${error.message}`);
                }
            };
            
            reader.onerror = () => {
                this.hideExportLoading();
                alert('Error reading file');
            };
            
            if (fileType === 'xlsx') {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
            
        } catch (error) {
            this.hideExportLoading();
            alert(`Error: ${error.message}`);
        }
    }

    // Parse Excel file
    async parseExcelFile(arrayBuffer) {
        try {
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheets = [];
            
            workbook.SheetNames.forEach(sheetName => {
                if (sheetName.toLowerCase() !== 'summary') {
                    const worksheet = workbook.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    // Parse sheet data
                    if (data.length > 5 && data[0][0] && typeof data[0][0] === 'string' && data[0][0].includes('HisaabKitaab')) {
                        const sheet = this.parseSheetFromData(data, sheetName);
                        if (sheet) sheets.push(sheet);
                    }
                }
            });
            
            return sheets;
        } catch (error) {
            console.error('Error parsing Excel file:', error);
            throw new Error('Failed to parse Excel file');
        }
    }

    // Parse sheet from data
    parseSheetFromData(data, sheetName) {
        try {
            // Extract header info
            let sheetNameFromData = sheetName;
            let sheetDate = new Date().toLocaleDateString();
            
            for (let i = 0; i < Math.min(5, data.length); i++) {
                if (data[i] && data[i][0] && typeof data[i][0] === 'string') {
                    if (data[i][0].includes('Sheet Name:')) {
                        const match = data[i][0].match(/Sheet Name:\s*(.+)/);
                        if (match) sheetNameFromData = match[1].trim();
                    } else if (data[i][0].includes('Date:')) {
                        const match = data[i][0].match(/Date:\s*(.+)/);
                        if (match) sheetDate = match[1].trim();
                    }
                }
            }
            
            const sheet = {
                name: sheetNameFromData,
                date: sheetDate,
                version: '1.8',
                participants: [],
                expenses: {},
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            
            // Find data start (skip headers)
            let dataStartIndex = 0;
            for (let i = 0; i < data.length; i++) {
                if (data[i] && data[i][0] === 'Participant') {
                    dataStartIndex = i + 1;
                    break;
                }
            }
            
            // Parse participant data
            for (let i = dataStartIndex; i < data.length; i++) {
                const row = data[i];
                if (!row || !row[0] || row[0] === '' || row[0] === 'Total') break;
                
                const participant = row[0];
                const spent = parseFloat(row[1]) || 0;
                const mealsText = row[2]?.toString() || '3';
                const meals = mealsText.toString().toLowerCase().includes('all') ? 3 : parseInt(mealsText) || 3;
                const toBePaid = parseFloat(row[3]) || 0;
                
                sheet.participants.push(participant);
                sheet.expenses[participant] = {
                    spent: spent,
                    meals: meals,
                    toBePaid: toBePaid
                };
            }
            
            return sheet.participants.length > 0 ? sheet : null;
            
        } catch (error) {
            console.error('Error parsing sheet:', error);
            return null;
        }
    }

    // Parse CSV file
    parseCSVFile(text) {
        try {
            const lines = text.split('\n');
            const sheets = [];
            let currentSheet = null;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line.startsWith('===') && line.includes('Sheet')) {
                    // New sheet
                    if (currentSheet && currentSheet.participants.length > 0) {
                        sheets.push(currentSheet);
                    }
                    
                    const nameMatch = line.match(/Sheet \d+:\s*(.+?)===/);
                    currentSheet = {
                        name: nameMatch ? nameMatch[1].trim() : `Sheet ${sheets.length + 1}`,
                        date: '',
                        version: '1.8',
                        participants: [],
                        expenses: {},
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    };
                } else if (line.startsWith('Date,')) {
                    // Date line
                    const date = line.split(',')[1];
                    if (currentSheet) currentSheet.date = date;
                } else if (line === 'Participant,Spent (SAR),Meals,To Be Paid (SAR)') {
                    // Data header - next lines are data
                    i++; // Skip to first data line
                    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('===')) {
                        const dataLine = lines[i].trim();
                        if (dataLine && currentSheet) {
                            const [participant, spentStr, mealsStr, toBePaidStr] = dataLine.split(',');
                            if (participant && participant !== 'Total') {
                                const spent = parseFloat(spentStr) || 0;
                                const mealsText = mealsStr?.toString() || '3';
                                const meals = mealsText.toLowerCase().includes('all') ? 3 : parseInt(mealsText) || 3;
                                const toBePaid = parseFloat(toBePaidStr) || 0;
                                
                                currentSheet.participants.push(participant);
                                currentSheet.expenses[participant] = {
                                    spent: spent,
                                    meals: meals,
                                    toBePaid: toBePaid
                                };
                            }
                        }
                        i++;
                    }
                    i--; // Adjust for loop increment
                }
            }
            
            // Add last sheet
            if (currentSheet && currentSheet.participants.length > 0) {
                sheets.push(currentSheet);
            }
            
            return sheets;
        } catch (error) {
            console.error('Error parsing CSV file:', error);
            throw new Error('Failed to parse CSV file');
        }
    }

    // Next import step
    nextImportStep() {
        const currentStep = document.getElementById(`step${this.importStep}`);
        if (currentStep) {
            currentStep.style.display = 'none';
            currentStep.classList.remove('active');
        }
        
        this.importStep++;
        const nextStep = document.getElementById(`step${this.importStep}`);
        
        if (nextStep) {
            nextStep.style.display = 'block';
            nextStep.classList.add('active');
            
            // Update UI based on step
            if (this.importStep === 2) {
                this.showImportPreview();
            } else if (this.importStep === 3) {
                this.showImportConflicts();
            }
            
            // Update button visibility
            const prevBtn = document.getElementById('prevImportStepBtn');
            const nextBtn = document.getElementById('nextImportStepBtn');
            const confirmBtn = document.getElementById('confirmImportBtn');
            
            if (prevBtn) prevBtn.style.display = this.importStep > 1 ? 'inline-block' : 'none';
            if (nextBtn) nextBtn.style.display = this.importStep < 3 ? 'inline-block' : 'none';
            if (confirmBtn) confirmBtn.style.display = this.importStep === 3 ? 'inline-block' : 'none';
        }
    }

    // Previous import step
    prevImportStep() {
        if (this.importStep <= 1) return;
        
        const currentStep = document.getElementById(`step${this.importStep}`);
        if (currentStep) {
            currentStep.style.display = 'none';
            currentStep.classList.remove('active');
        }
        
        this.importStep--;
        const prevStep = document.getElementById(`step${this.importStep}`);
        
        if (prevStep) {
            prevStep.style.display = 'block';
            prevStep.classList.add('active');
            
            // Update button visibility
            const prevBtn = document.getElementById('prevImportStepBtn');
            const nextBtn = document.getElementById('nextImportStepBtn');
            const confirmBtn = document.getElementById('confirmImportBtn');
            
            if (prevBtn) prevBtn.style.display = this.importStep > 1 ? 'inline-block' : 'none';
            if (nextBtn) nextBtn.style.display = 'inline-block';
            if (confirmBtn) confirmBtn.style.display = 'none';
        }
    }

    // Show import preview
    showImportPreview() {
        const previewDiv = document.getElementById('importPreview');
        const statsDiv = document.getElementById('importStats');
        
        if (!this.importData || !Array.isArray(this.importData)) {
            if (previewDiv) {
                previewDiv.innerHTML = '<p style="color: var(--danger-color); text-align: center;">No valid data found in file</p>';
            }
            if (statsDiv) {
                statsDiv.style.display = 'none';
            }
            return;
        }
        
        let html = '<table class="import-preview-table">';
        html += '<tr><th>Sheet Name</th><th>Date</th><th>Participants</th><th>Total Spent</th><th>Version</th></tr>';
        
        let totalSheets = 0;
        let totalParticipants = 0;
        let totalAmount = 0;
        
        this.importData.slice(0, 10).forEach((sheet, index) => {
            const participants = sheet.participants?.length || 0;
            const totalSpent = Object.values(sheet.expenses || {}).reduce((sum, exp) => sum + (exp.spent || 0), 0);
            
            html += `<tr>
                <td>${sheet.name || `Sheet ${index + 1}`}</td>
                <td>${sheet.date || ''}</td>
                <td>${participants}</td>
                <td>${totalSpent.toFixed(2)} SAR</td>
                <td>${sheet.version || 'Unknown'}</td>
            </tr>`;
            
            totalSheets++;
            totalParticipants += participants;
            totalAmount += totalSpent;
        });
        
        if (this.importData.length > 10) {
            html += `<tr><td colspan="5" style="text-align: center; color: var(--secondary-color);">... and ${this.importData.length - 10} more sheets</td></tr>`;
        }
        
        html += '</table>';
        
        if (previewDiv) {
            previewDiv.innerHTML = html;
        }
        
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div style="background-color: var(--hover-bg); padding: 10px; border-radius: 5px; margin-top: 15px;">
                    <div style="display: flex; justify-content: space-around; text-align: center;">
                        <div>
                            <div style="font-size: 1.5rem; color: var(--primary-color);">${totalSheets}</div>
                            <div style="font-size: 0.9rem;">Sheets</div>
                        </div>
                        <div>
                            <div style="font-size: 1.5rem; color: var(--success-color);">${totalParticipants}</div>
                            <div style="font-size: 0.9rem;">Participants</div>
                        </div>
                        <div>
                            <div style="font-size: 1.5rem; color: var(--info-color);">${totalAmount.toFixed(2)}</div>
                            <div style="font-size: 0.9rem;">Total SAR</div>
                        </div>
                    </div>
                </div>
            `;
            statsDiv.style.display = 'block';
        }
    }

    // Show import conflicts
    showImportConflicts() {
        const conflictsDiv = document.getElementById('importConflicts');
        const conflictList = document.getElementById('conflictList');
        
        if (!this.importData || !Array.isArray(this.importData)) {
            if (conflictsDiv) conflictsDiv.style.display = 'none';
            return;
        }
        
        const savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
        const existingNames = new Set(savedSheets.map(sheet => sheet.name));
        const importNames = new Set(this.importData.map(sheet => sheet.name));
        
        const conflicts = [...existingNames].filter(name => importNames.has(name));
        
        if (conflicts.length > 0) {
            if (conflictList) {
                conflictList.innerHTML = conflicts.map(name => 
                    `<div class="conflict-item">• ${name}</div>`
                ).join('');
            }
            if (conflictsDiv) conflictsDiv.style.display = 'block';
        } else {
            if (conflictsDiv) conflictsDiv.style.display = 'none';
        }
    }

    // Confirm import
    confirmImport() {
        if (!this.importData || !Array.isArray(this.importData)) {
            alert('No data to import');
            return;
        }
        
        const selectedOption = document.querySelector('input[name="importOption"]:checked');
        if (!selectedOption) {
            alert('Please select an import option');
            return;
        }
        
        const importOption = selectedOption.value;
        const savedSheets = JSON.parse(localStorage.getItem('hisaabKitaabSheets')) || [];
        let newSheets = [...savedSheets];
        let addedCount = 0;
        let updatedCount = 0;
        
        switch (importOption) {
            case 'merge':
                // Merge: Add all, but update existing ones
                this.importData.forEach(importSheet => {
                    const existingIndex = newSheets.findIndex(s => s.name === importSheet.name);
                    if (existingIndex >= 0) {
                        // Update existing sheet
                        newSheets[existingIndex] = {
                            ...newSheets[existingIndex],
                            ...importSheet,
                            lastUpdated: new Date().toISOString()
                        };
                        updatedCount++;
                    } else {
                        // Add new sheet
                        newSheets.push(importSheet);
                        addedCount++;
                    }
                });
                break;
                
            case 'replace':
                // Replace: Use imported data only
                newSheets = [...this.importData];
                addedCount = this.importData.length;
                break;
                
            case 'skip':
                // Skip duplicates: Only add new sheets
                this.importData.forEach(importSheet => {
                    if (!newSheets.some(s => s.name === importSheet.name)) {
                        newSheets.push(importSheet);
                        addedCount++;
                    }
                });
                break;
        }
        
        // Save to localStorage
        localStorage.setItem('hisaabKitaabSheets', JSON.stringify(newSheets));
        
        // Sync to Firebase if available
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveToCloud(newSheets);
        }
        
        // Refresh UI
        if (window.loadSavedSheets) {
            window.loadSavedSheets();
        }
        
        // Close modal
        this.hideImportModal();
        
        // Show success message
        let message = 'Import completed successfully!';
        if (addedCount > 0) message += `\n• Added ${addedCount} new sheets`;
        if (updatedCount > 0) message += `\n• Updated ${updatedCount} existing sheets`;
        if (addedCount === 0 && updatedCount === 0) message += '\n• No changes were made';
        
        alert(`✅ ${message}`);
    }

    // Download file
    downloadFile(content, fileName, mimeType) {
        try {
            // Create blob
            const blob = new Blob([content], { type: mimeType });
            
            // Create download link
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            
            // Add to document and click
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log('File download initiated:', fileName);
            
        } catch (error) {
            console.error('Download error:', error);
            throw new Error('Failed to download file');
        }
    }

    // Show export loading
    showExportLoading(message = 'Generating Export...') {
        let overlay = document.getElementById('exportLoadingOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'exportLoadingOverlay';
            overlay.className = 'export-loading';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                z-index: 2000;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                color: white;
            `;
            
            overlay.innerHTML = `
                <div style="width: 50px; height: 50px; border: 4px solid #ccc; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
                <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 10px;">${message}</div>
                <div style="width: 200px; height: 4px; background-color: #ccc; border-radius: 2px; margin-top: 20px; overflow: hidden;">
                    <div class="export-progress-bar" style="height: 100%; background-color: #3498db; width: 0%; transition: width 0.3s ease;"></div>
                </div>
            `;
            
            document.body.appendChild(overlay);
        } else {
            const text = overlay.querySelector('div:nth-child(2)');
            if (text) text.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    // Hide export loading
    hideExportLoading() {
        const overlay = document.getElementById('exportLoadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Update export progress
    updateExportProgress(percent) {
        const progressBar = document.querySelector('.export-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
    }

    // Show export success
    showExportSuccess(message = 'Export completed successfully!') {
        setTimeout(() => {
            alert(`✅ ${message}\n\nFile has been downloaded to your device.`);
        }, 300);
    }

    // Show export error
    showExportError(message = 'Export failed. Please try again.') {
        setTimeout(() => {
            alert(`❌ ${message}`);
        }, 300);
    }

    // Get timestamp for filename
    getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}${month}${day}_${hours}${minutes}`;
    }
}

// Create global instance
window.exportManager = new ExportManager();