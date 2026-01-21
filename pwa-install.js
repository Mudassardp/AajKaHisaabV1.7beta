// PWA Install Handler - Simple Version
class PWAInstaller {
  constructor() {
    this.installPrompt = null;
    this.installButton = null;
  }

  init() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e;
      this.showInstallButton();
    });

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      console.log('App installed successfully');
      this.hideInstallButton();
    });

    // Create install button
    this.createInstallButton();
  }

  createInstallButton() {
    // Remove existing button if any
    const oldBtn = document.getElementById('pwaInstallBtn');
    if (oldBtn) oldBtn.remove();

    // Create new button
    const installBtn = document.createElement('button');
    installBtn.id = 'pwaInstallBtn';
    installBtn.innerHTML = '📱 Install App';
    installBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #3498db;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 10000;
      display: none;
      font-size: 14px;
    `;
    
    installBtn.onclick = () => this.installApp();
    document.body.appendChild(installBtn);
    this.installButton = installBtn;
  }

  showInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'block';
      
      // Auto-hide after 15 seconds
      setTimeout(() => {
        this.hideInstallButton();
      }, 15000);
    }
  }

  hideInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  async installApp() {
    if (!this.installPrompt) return;
    
    this.installPrompt.prompt();
    const result = await this.installPrompt.userChoice;
    
    if (result.outcome === 'accepted') {
      console.log('User accepted install');
      this.hideInstallButton();
    } else {
      console.log('User declined install');
    }
    
    this.installPrompt = null;
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.pwaInstaller = new PWAInstaller();
    window.pwaInstaller.init();
  }, 2000);
});