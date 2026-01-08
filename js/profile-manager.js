// profile-manager.js v2.2 with Preferred Bank Support and Cloud Sync
class ProfileManager {
    constructor() {
        this.profiles = JSON.parse(localStorage.getItem('hisaabKitaabProfiles')) || {};
        this.cropperInstance = null;
        this.currentProfilePhoto = '';
        this.currentProfileParticipant = null;
        this.currentImageFile = null;
    }

    // Initialize Profile Manager
    init() {
        this.loadProfiles();
        this.setupEventListeners();
    }

    // Load profiles from localStorage
    loadProfiles() {
        const storedProfiles = localStorage.getItem('hisaabKitaabProfiles');
        this.profiles = storedProfiles ? JSON.parse(storedProfiles) : {};
        
        // Clean up any invalid photo data
        Object.keys(this.profiles).forEach(participant => {
            if (this.profiles[participant].photo === undefined || 
                this.profiles[participant].photo === null ||
                this.profiles[participant].photo === 'undefined' ||
                this.profiles[participant].photo === 'null') {
                this.profiles[participant].photo = '';
            }
        });
        
        this.saveProfilesLocally();
    }

    // Save profiles to localStorage
    saveProfilesLocally() {
        localStorage.setItem('hisaabKitaabProfiles', JSON.stringify(this.profiles));
    }

    // Save profiles and sync to cloud
    async saveProfilesToCloud() {
        // Save locally first
        this.saveProfilesLocally();
        
        // Then sync to cloud if available
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            try {
                await window.firebaseSync.saveProfilesToCloud(this.profiles);
                console.log('Profiles synced to cloud');
            } catch (error) {
                console.error('Failed to sync profiles to cloud:', error);
            }
        }
    }

    // Setup event listeners for profile-related elements
    setupEventListeners() {
        // Profile modal
        document.getElementById('closeProfileBtn')?.addEventListener('click', () => {
            document.getElementById('profileCardModal').style.display = 'none';
            this.hideEditProfileForm();
        });

        document.getElementById('editProfileBtn')?.addEventListener('click', () => {
            this.showEditProfileForm();
        });

        // Photo upload
        document.getElementById('uploadPhotoBtn')?.addEventListener('click', () => {
            document.getElementById('profileImageUpload').click();
        });

        document.getElementById('profileImageUpload')?.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        document.getElementById('removePhotoBtn')?.addEventListener('click', () => {
            this.removeProfilePhoto();
        });

        // Save profile
        document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
            await this.saveCurrentProfile();
        });

        document.getElementById('cancelEditProfileBtn')?.addEventListener('click', () => {
            this.hideEditProfileForm();
        });

        // Preferred bank dropdown change
        document.getElementById('editPreferredBank')?.addEventListener('change', function() {
            const bankAccountsText = document.getElementById('editBankAccounts').value;
            if (bankAccountsText.trim() && this.value === '') {
                // If user selects "No Preference" but has bank accounts, ask for confirmation
                if (confirm('Are you sure you want to set "No Preference"? This might affect settlement suggestions.')) {
                    return;
                } else {
                    // Restore previous selection
                    setTimeout(() => {
                        const accounts = window.profileManager.parseBankAccounts(bankAccountsText);
                        if (accounts.length > 0) {
                            this.value = accounts[0].bank;
                        }
                    }, 0);
                }
            }
        });

        // Image cropper
        document.getElementById('zoomInBtn')?.addEventListener('click', () => {
            if (this.cropperInstance) {
                this.cropperInstance.zoom(0.1);
            }
        });

        document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
            if (this.cropperInstance) {
                this.cropperInstance.zoom(-0.1);
            }
        });

        document.getElementById('rotateLeftBtn')?.addEventListener('click', () => {
            if (this.cropperInstance) {
                this.cropperInstance.rotate(-90);
            }
        });

        document.getElementById('rotateRightBtn')?.addEventListener('click', () => {
            if (this.cropperInstance) {
                this.cropperInstance.rotate(90);
            }
        });

        document.getElementById('cropImageBtn')?.addEventListener('click', () => {
            this.cropAndSaveImage();
        });

        document.getElementById('cancelCropBtn')?.addEventListener('click', () => {
            this.cancelImageCrop();
        });

        // Close modal when clicking outside
        document.getElementById('imageCropperModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('imageCropperModal')) {
                this.cancelImageCrop();
            }
        });
    }

    // Helper function to generate avatar initials
    generateAvatarInitials(name) {
        if (!name) return '?';
        
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    }

    // Helper function to generate consistent avatar color
    generateAvatarColor(name) {
        const colors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
            '#9b59b6', '#1abc9c', '#d35400', '#34495e',
            '#8e44ad', '#27ae60', '#c0392b', '#16a085'
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

    // Get profile data
    getProfile(participantName) {
        const profile = this.profiles[participantName];
        
        if (profile) {
            return {
                mobile: profile.mobile || '',
                bankAccounts: profile.bankAccounts || '',
                photo: profile.photo || '',
                preferredBank: profile.preferredBank || '',
                lastUpdated: profile.lastUpdated || ''
            };
        }
        
        return {
            mobile: '',
            bankAccounts: '',
            photo: '',
            preferredBank: '',
            lastUpdated: ''
        };
    }

    // Save profile data (locally and to cloud)
    async saveProfile(participantName, profileData) {
        console.log('Saving profile for:', participantName);
        
        // Validate photo data
        let photoData = profileData.photo || '';
        if (photoData === 'undefined' || photoData === 'null') {
            photoData = '';
        }
        
        this.profiles[participantName] = {
            mobile: profileData.mobile || '',
            bankAccounts: profileData.bankAccounts || '',
            photo: photoData,
            preferredBank: profileData.preferredBank || '',
            lastUpdated: new Date().toISOString()
        };
        
        // Save locally
        this.saveProfilesLocally();
        
        // Sync to cloud
        await this.saveProfilesToCloud();
        
        // Verify the save
        const savedProfile = this.getProfile(participantName);
        console.log('Profile saved and synced successfully:', savedProfile);
        
        return savedProfile;
    }

    // Parse bank accounts text
    parseBankAccounts(bankAccountsText) {
        if (!bankAccountsText || !bankAccountsText.trim()) {
            return [];
        }
        
        const accounts = [];
        const lines = bankAccountsText.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            const separatorIndex = trimmedLine.indexOf(' - ');
            if (separatorIndex === -1) {
                accounts.push({
                    bank: 'Unknown Bank',
                    iban: trimmedLine
                });
            } else {
                accounts.push({
                    bank: trimmedLine.substring(0, separatorIndex).trim(),
                    iban: trimmedLine.substring(separatorIndex + 3).trim()
                });
            }
        }
        
        return accounts;
    }

    // Format bank accounts as text
    formatBankAccountsText(accounts) {
        return accounts.map(acc => `${acc.bank} - ${acc.iban}`).join('\n');
    }

    // Create avatar element
    createAvatarElement(name, size = 'small') {
        const profile = this.getProfile(name);
        const avatar = document.createElement('div');
        
        // Set common styles
        avatar.className = size === 'small' ? 'participant-avatar-small' : 'profile-avatar';
        avatar.title = `View ${name}'s profile`;
        avatar.style.cursor = 'pointer';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
        avatar.style.borderRadius = '50%';
        
        // Check if we have a valid photo
        if (profile.photo && 
            profile.photo !== '' && 
            profile.photo !== 'none' && 
            profile.photo !== 'undefined' && 
            profile.photo !== 'null' &&
            profile.photo.startsWith('data:image')) {
            
            // Use profile photo
            avatar.style.backgroundImage = `url("${profile.photo}")`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
            avatar.style.backgroundColor = 'transparent';
            avatar.textContent = '';
        } else {
            // Use initials with color
            const initials = this.generateAvatarInitials(name);
            const color = this.generateAvatarColor(name);
            
            avatar.style.backgroundImage = '';
            avatar.style.backgroundColor = color;
            avatar.textContent = initials;
            avatar.style.color = 'white';
            avatar.style.fontWeight = 'bold';
            avatar.style.fontSize = size === 'small' ? '0.9rem' : '2.5rem';
        }
        
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openProfileCard(name);
        });
        
        return avatar;
    }

    // Open profile card
    openProfileCard(participantName) {
        this.currentProfileParticipant = participantName;
        const profile = this.getProfile(participantName);
        
        // Update profile card
        document.getElementById('profileName').textContent = participantName;
        
        // Set avatar
        const profileAvatar = document.getElementById('profileAvatar');
        profileAvatar.innerHTML = '';
        const avatar = this.createAvatarElement(participantName, 'large');
        profileAvatar.appendChild(avatar);
        
        // Set mobile
        document.getElementById('profileMobile').textContent = profile.mobile || 'Not provided';
        
        // Parse and display bank accounts
        const bankAccounts = this.parseBankAccounts(profile.bankAccounts);
        const container = document.getElementById('profileBankAccountsContainer');
        container.innerHTML = '';
        
        if (bankAccounts.length > 0) {
            const bankNames = [...new Set(bankAccounts.map(acc => acc.bank))];
            let banksText = bankNames.join(', ');
            
            // Add preferred bank indicator
            if (profile.preferredBank && profile.preferredBank !== '') {
                banksText += ` (Preferred: ${profile.preferredBank})`;
            }
            
            document.getElementById('profileBanks').textContent = banksText || 'Not provided';
            
            bankAccounts.forEach(account => {
                const accountItem = document.createElement('div');
                accountItem.className = 'bank-account-item';
                
                // Add preferred badge if this is the preferred bank
                if (account.bank === profile.preferredBank) {
                    accountItem.style.borderLeft = '3px solid var(--success-color)';
                    accountItem.style.backgroundColor = 'color-mix(in srgb, var(--success-color) 10%, transparent)';
                }
                
                const accountInfo = document.createElement('div');
                accountInfo.className = 'bank-account-info';
                
                const bankLabel = document.createElement('div');
                bankLabel.className = 'bank-label';
                bankLabel.textContent = account.bank;
                
                // Add preferred badge to label
                if (account.bank === profile.preferredBank) {
                    const preferredBadge = document.createElement('span');
                    preferredBadge.textContent = ' ★ Preferred';
                    preferredBadge.style.color = 'var(--success-color)';
                    preferredBadge.style.fontSize = '0.8rem';
                    preferredBadge.style.marginLeft = '8px';
                    preferredBadge.style.fontWeight = 'bold';
                    bankLabel.appendChild(preferredBadge);
                }
                
                const bankIban = document.createElement('div');
                bankIban.className = 'bank-iban';
                bankIban.textContent = account.iban;
                
                accountInfo.appendChild(bankLabel);
                accountInfo.appendChild(bankIban);
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'bank-copy-btn';
                copyBtn.innerHTML = '⎘';
                copyBtn.title = 'Copy IBAN';
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(account.iban).then(() => {
                        alert('IBAN copied to clipboard!');
                    });
                });
                
                accountItem.appendChild(accountInfo);
                accountItem.appendChild(copyBtn);
                container.appendChild(accountItem);
            });
        } else {
            document.getElementById('profileBanks').textContent = 'Not provided';
            const noData = document.createElement('div');
            noData.className = 'no-data';
            noData.textContent = 'Not provided';
            container.appendChild(noData);
        }
        
        // Show edit button for admin
        const isAdmin = localStorage.getItem('hisaabKitaabAdmin') === 'true';
        document.getElementById('editProfileBtn').style.display = isAdmin ? 'inline-block' : 'none';
        
        document.getElementById('profileCardModal').style.display = 'flex';
    }

    // Show edit profile form
    showEditProfileForm() {
        const profile = this.getProfile(this.currentProfileParticipant);
        const bankAccounts = this.parseBankAccounts(profile.bankAccounts);
        
        document.getElementById('editProfileParticipant').value = this.currentProfileParticipant;
        document.getElementById('editMobile').value = profile.mobile || '';
        document.getElementById('editBankAccounts').value = this.formatBankAccountsText(bankAccounts);
        
        // Store the current photo
        this.currentProfilePhoto = profile.photo || '';
        
        // Update profile image preview
        this.updateProfileImagePreview(profile.photo);
        
        // Update preferred bank dropdown
        this.updatePreferredBankDropdown(bankAccounts, profile.preferredBank);
        
        document.getElementById('editProfileForm').style.display = 'block';
        document.getElementById('editProfileBtn').style.display = 'none';
    }

    // Update preferred bank dropdown
    updatePreferredBankDropdown(bankAccounts, currentPreferredBank) {
        const dropdown = document.getElementById('editPreferredBank');
        if (!dropdown) {
            // Create dropdown if it doesn't exist
            this.createPreferredBankDropdown();
            return;
        }
        
        dropdown.innerHTML = '';
        
        // Add "No Preference" option
        const noPreferenceOption = document.createElement('option');
        noPreferenceOption.value = '';
        noPreferenceOption.textContent = 'No Preference (Use any available bank)';
        dropdown.appendChild(noPreferenceOption);
        
        // Add bank options
        const uniqueBanks = [...new Set(bankAccounts.map(acc => acc.bank))];
        uniqueBanks.forEach(bank => {
            const option = document.createElement('option');
            option.value = bank;
            option.textContent = bank;
            dropdown.appendChild(option);
        });
        
        // Set current preferred bank
        if (currentPreferredBank && uniqueBanks.includes(currentPreferredBank)) {
            dropdown.value = currentPreferredBank;
        } else if (uniqueBanks.length > 0) {
            // Default to first bank if no preference set
            dropdown.value = uniqueBanks[0];
        }
    }

    // Create preferred bank dropdown element
    createPreferredBankDropdown() {
        const form = document.getElementById('editProfileForm');
        if (!form) return;
        
        // Find the bank accounts textarea
        const bankAccountsTextarea = document.getElementById('editBankAccounts');
        if (!bankAccountsTextarea) return;
        
        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'form-group';
        
        // Create label
        const label = document.createElement('label');
        label.textContent = 'Preferred Bank for Settlements:';
        label.htmlFor = 'editPreferredBank';
        dropdownContainer.appendChild(label);
        
        // Create dropdown
        const dropdown = document.createElement('select');
        dropdown.id = 'editPreferredBank';
        dropdown.className = 'form-input';
        dropdownContainer.appendChild(dropdown);
        
        // Create help text
        const helpText = document.createElement('small');
        helpText.textContent = 'Select your preferred bank for settlements. This helps prioritize same-bank transfers.';
        helpText.style.display = 'block';
        helpText.style.marginTop = '5px';
        helpText.style.color = 'var(--secondary-color)';
        dropdownContainer.appendChild(helpText);
        
        // Insert after bank accounts textarea
        bankAccountsTextarea.parentNode.insertBefore(dropdownContainer, bankAccountsTextarea.nextSibling);
        
        // Add event listener for dropdown change
        dropdown.addEventListener('change', function() {
            const bankAccountsText = document.getElementById('editBankAccounts').value;
            if (bankAccountsText.trim() && this.value === '') {
                // If user selects "No Preference" but has bank accounts, ask for confirmation
                if (confirm('Are you sure you want to set "No Preference"? This might affect settlement suggestions.')) {
                    return;
                } else {
                    // Restore previous selection
                    setTimeout(() => {
                        const accounts = window.profileManager.parseBankAccounts(bankAccountsText);
                        if (accounts.length > 0) {
                            this.value = accounts[0].bank;
                        }
                    }, 0);
                }
            }
        });
    }

    // Hide edit profile form
    hideEditProfileForm() {
        document.getElementById('editProfileForm').style.display = 'none';
        
        const isAdmin = localStorage.getItem('hisaabKitaabAdmin') === 'true';
        if (isAdmin && this.currentProfileParticipant) {
            document.getElementById('editProfileBtn').style.display = 'inline-block';
        }
    }

    // Update profile image preview
    updateProfileImagePreview(photoUrl) {
        const currentProfileImage = document.getElementById('currentProfileImage');
        currentProfileImage.innerHTML = '';
        
        if (photoUrl && 
            photoUrl !== '' && 
            photoUrl !== 'none' && 
            photoUrl !== 'undefined' && 
            photoUrl !== 'null' &&
            photoUrl.startsWith('data:image')) {
            
            // Has a valid photo - show it
            currentProfileImage.style.backgroundImage = `url("${photoUrl}")`;
            currentProfileImage.style.backgroundSize = 'cover';
            currentProfileImage.style.backgroundPosition = 'center';
            currentProfileImage.style.backgroundColor = 'transparent';
            currentProfileImage.style.backgroundRepeat = 'no-repeat';
            currentProfileImage.textContent = '';
            document.getElementById('removePhotoBtn').style.display = 'inline-block';
        } else {
            // No photo - show initials with color
            document.getElementById('removePhotoBtn').style.display = 'none';
            const initials = this.generateAvatarInitials(this.currentProfileParticipant);
            const color = this.generateAvatarColor(this.currentProfileParticipant);
            
            currentProfileImage.style.backgroundImage = '';
            currentProfileImage.style.backgroundColor = color;
            currentProfileImage.style.background = color;
            currentProfileImage.textContent = initials;
            currentProfileImage.style.display = 'flex';
            currentProfileImage.style.alignItems = 'center';
            currentProfileImage.style.justifyContent = 'center';
            currentProfileImage.style.fontSize = '3rem';
            currentProfileImage.style.color = 'white';
            currentProfileImage.style.fontWeight = 'bold';
            currentProfileImage.style.backgroundRepeat = 'no-repeat';
        }
    }

    // Handle image upload
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }
        
        this.currentImageFile = file;
        
        // Show image in cropper
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('cropperImage').src = e.target.result;
            document.getElementById('imageCropperModal').style.display = 'flex';
            
            // Initialize cropper
            setTimeout(() => {
                if (this.cropperInstance) {
                    this.cropperInstance.destroy();
                }
                
                this.cropperInstance = new Cropper(document.getElementById('cropperImage'), {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 0.8,
                    responsive: true,
                    restore: false,
                    guides: true,
                    center: true,
                    highlight: false,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    toggleDragModeOnDblclick: false,
                    zoomOnWheel: false
                });
            }, 100);
        };
        reader.readAsDataURL(file);
        
        // Reset file input
        event.target.value = '';
    }

    // Crop and save image
    cropAndSaveImage() {
        if (!this.cropperInstance) return;
        
        // Get cropped canvas
        const canvas = this.cropperInstance.getCroppedCanvas({
            width: 400,
            height: 400,
            fillColor: '#fff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });
        
        // Convert to blob and compress
        canvas.toBlob((blob) => {
            this.compressImage(blob, 200, (compressedBlob) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Update the photo in our state variable
                    this.currentProfilePhoto = e.target.result;
                    
                    // Update preview
                    this.updateProfileImagePreview(e.target.result);
                    
                    // Clean up
                    if (this.cropperInstance) {
                        this.cropperInstance.destroy();
                        this.cropperInstance = null;
                    }
                    document.getElementById('imageCropperModal').style.display = 'none';
                    this.currentImageFile = null;
                    
                    alert('Profile photo updated! Click "Save Profile" to save changes.');
                };
                reader.readAsDataURL(compressedBlob);
            });
        }, 'image/jpeg', 0.9);
    }

    // Compress image
    compressImage(blob, maxSizeKB, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;
                const maxDimension = 800;
                
                if (width > height && width > maxDimension) {
                    height = Math.round(height * maxDimension / width);
                    width = maxDimension;
                } else if (height > maxDimension) {
                    width = Math.round(width * maxDimension / height);
                    height = maxDimension;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                let quality = 0.9;
                
                canvas.toBlob((compressedBlob) => {
                    const sizeKB = compressedBlob.size / 1024;
                    
                    if (sizeKB <= maxSizeKB || quality <= 0.5) {
                        callback(compressedBlob);
                    } else {
                        quality -= 0.1;
                        // Recursive call with lower quality
                        this.compressImage(compressedBlob, maxSizeKB, callback);
                    }
                }, 'image/jpeg', quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(blob);
    }

    // Cancel image crop
    cancelImageCrop() {
        if (this.cropperInstance) {
            this.cropperInstance.destroy();
            this.cropperInstance = null;
        }
        document.getElementById('imageCropperModal').style.display = 'none';
        this.currentImageFile = null;
    }

    // Remove profile photo
    removeProfilePhoto() {
        if (confirm('Remove profile photo?')) {
            // Clear the photo from our state variable
            this.currentProfilePhoto = '';
            
            // Update preview to show initials
            this.updateProfileImagePreview('');
            
            alert('Profile photo removed! Click "Save Profile" to save changes.');
        }
    }

    // Save current profile (with cloud sync)
    async saveCurrentProfile() {
        const participant = document.getElementById('editProfileParticipant').value;
        
        console.log('Saving profile for:', participant);
        
        const profileData = {
            mobile: document.getElementById('editMobile').value.trim(),
            bankAccounts: document.getElementById('editBankAccounts').value.trim(),
            photo: this.currentProfilePhoto || '',
            preferredBank: document.getElementById('editPreferredBank') ? 
                          document.getElementById('editPreferredBank').value : ''
        };
        
        // Save the profile (this will also sync to cloud)
        await this.saveProfile(participant, profileData);
        
        // Clear the state variable
        this.currentProfilePhoto = '';
        
        this.hideEditProfileForm();
        
        // Force a fresh load of the profile card
        setTimeout(() => {
            this.openProfileCard(participant);
        }, 100);
        
        alert('Profile saved and synced to cloud!');
        
        // Update any UI that shows this participant's avatar
        this.updateParticipantAvatars(participant);
    }

    // Update all avatars for a participant
    updateParticipantAvatars(participantName) {
        // Update avatars in participants list
        const avatarElements = document.querySelectorAll(`[data-participant="${participantName}"] .participant-avatar-small, 
                                                         [data-participant="${participantName}"] .profile-avatar`);
        
        avatarElements.forEach(avatar => {
            const newAvatar = this.createAvatarElement(participantName, 
                avatar.classList.contains('participant-avatar-small') ? 'small' : 'large');
            avatar.parentNode.replaceChild(newAvatar, avatar);
        });
    }
}

// Create global instance
window.profileManager = new ProfileManager();