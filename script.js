// A-1 Dashboard PWA JavaScript (UPDATED for Option A local customer page)

class A1Dashboard {
  constructor() {
    this.init();
  }

  init() {
    this.setupServiceWorker();
    this.setupInstallPrompt();
    this.setupOnlineStatus();
    this.setupDashboardFeatures();
    console.log("A-1APSVC Dashboard PWA initialized");
  }

  // Service Worker Setup
  setupServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                this.showUpdateNotification();
              }
            });
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }

  // PWA Install Prompt
  setupInstallPrompt() {
    let deferredPrompt;
    const installPrompt = document.getElementById("install-prompt");
    const installButton = document.getElementById("install-button");
    const dismissButton = document.getElementById("dismiss-button");

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installPrompt) {
        installPrompt.style.display = "block";
      }
    });

    if (installButton) {
      installButton.addEventListener("click", async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`Install prompt outcome: ${outcome}`);
          deferredPrompt = null;
          if (installPrompt) {
            installPrompt.style.display = "none";
          }
        }
      });
    }

    if (dismissButton) {
      dismissButton.addEventListener("click", () => {
        if (installPrompt) {
          installPrompt.style.display = "none";
        }
      });
    }

    // Hide install prompt if already installed
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed");
      if (installPrompt) {
        installPrompt.style.display = "none";
      }
    });
  }

  // Online/Offline Status
  setupOnlineStatus() {
    const statusElement = document.getElementById("connection-status");
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");

    const updateStatus = () => {
      if (navigator.onLine) {
        if (statusDot) statusDot.className = "status-dot online";
        if (statusText) statusText.textContent = "Online";
        if (statusElement) statusElement.className = "status-indicator online";
      } else {
        if (statusDot) statusDot.className = "status-dot offline";
        if (statusText) statusText.textContent = "Offline";
        if (statusElement) statusElement.className = "status-indicator offline";
        this.showOfflineNotification();
      }
    };

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    updateStatus(); // Initial check
  }

  // Dashboard Features
  setupDashboardFeatures() {
    // Add click handlers for dashboard cards (generic)
    const dashboardCards = document.querySelectorAll(".dashboard-card");
    dashboardCards.forEach((card) => {
      card.addEventListener("click", () => {
        const cardTitle = card.querySelector("h3, h5")?.textContent;
        this.handleCardClick(cardTitle);
      });
    });

    // Add keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModals();
      }
    });
  }

  handleCardClick(cardTitle) {
    console.log(`Dashboard card clicked: ${cardTitle}`);
    // This is just generic feedback. Real navigation is handled in DashboardIntegration below.
    this.showNotification(`Opening ${cardTitle}...`, "info");
  }

  // Notification System
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === "error"
          ? "#f44336"
          : type === "success"
          ? "#4CAF50"
          : type === "warning"
          ? "#f59e0b"
          : "#007ACC"
      };
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      max-width: 340px;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(notification);
    }, 5000);

    // Close button handler
    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => {
      this.removeNotification(notification);
    });
  }

  removeNotification(notification) {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      if (notification.parentNode) notification.parentNode.removeChild(notification);
    }, 300);
  }

  showUpdateNotification() {
    this.showNotification("A new version is available! Refresh to update.", "info");
  }

  showOfflineNotification() {
    this.showNotification("You are now offline. Some features may be limited.", "warning");
  }

  closeModals() {
    const modals = document.querySelectorAll(".modal, .overlay");
    modals.forEach((modal) => {
      modal.style.display = "none";
    });
  }

  // Utility Methods
  static formatDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0);   opacity: 1; }
    to   { transform: translateX(100%); opacity: 0; }
  }
  .notification-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  .notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .notification-close:hover { opacity: 0.85; }
`;
document.head.appendChild(style);

// -----------------------------
// Enhanced Dashboard Integration
// -----------------------------
class DashboardIntegration {
  constructor() {
    // ✅ Option A: Local customers page inside THIS repo
    this.customerSystemUrl = "./customers.html";
    this.init();
  }

  init() {
    this.setupDashboardCards();
    this.setupQuickActions();
    this.checkSystemStatus();
  }

  setupDashboardCards() {
    // ✅ Reliable selector: use the ID you add in index.html
    const customerCard = document.getElementById("customer-card");

    if (customerCard) {
      customerCard.classList.add("active");

      // Override click to open customers.html
      customerCard.addEventListener("click", (e) => {
        e.preventDefault();
        this.openCustomerSystem();
      });

      // Keyboard support
      customerCard.setAttribute("tabindex", "0");
      customerCard.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.openCustomerSystem();
        }
      });
    } else {
      console.warn(
        "Customer card not found. Add id='customer-card' to your Customer Management card in index.html."
      );
    }

    // Coming soon handlers for other cards (do not block real links if you have them)
    const comingSoonCards = document.querySelectorAll(".dashboard-card:not(.active)");
    comingSoonCards.forEach((card) => {
      // If the card already has an href/onclick you want to keep, remove this block.
      card.classList.add("coming-soon");
      card.addEventListener("click", (e) => {
        // Only intercept if it’s not the customer card
        if (card.id === "customer-card") return;

        e.preventDefault();
        const cardTitle = card.querySelector("h5, h3")?.textContent || "Feature";
        this.showComingSoonMessage(cardTitle);
      });
    });
  }

  openCustomerSystem() {
    // Show loading feedback
    this.showNotification("Opening Customer Management...", "info");

    // Visual feedback
    const customerCard = document.getElementById("customer-card");
    if (customerCard) {
      customerCard.style.transform = "scale(0.98)";
      setTimeout(() => {
        customerCard.style.transform = "";
      }, 150);
    }

    // ✅ Open in same tab (no popup blocker problems)
    window.location.href = this.customerSystemUrl;
  }

  showComingSoonMessage(featureName) {
    const cleanName = featureName.replace(/[^\w\s]/gi, "").trim();
    this.showNotification(
      `${cleanName} is coming soon! Currently available: Customer Management`,
      "info"
    );
  }

  setupQuickActions() {
    const quickAccessDiv =
      document.querySelector(".quick-access") ||
      document.querySelector('[style*="background-color: #e7f3ff"]');

    if (quickAccessDiv) {
      const actionsHTML = `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
          <h5 style="margin: 0 0 15px 0; color: #007ACC;">Quick Actions</h5>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="quick-action-btn" onclick="dashboardIntegration.openCustomerSystem()"
              style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9em;">
              Open Customer System
            </button>
            <button class="quick-action-btn" onclick="dashboardIntegration.showSystemStatus()"
              style="padding: 8px 16px; background: #007ACC; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9em;">
              System Status
            </button>
            <button class="quick-action-btn" onclick="dashboardIntegration.showHelp()"
              style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9em;">
              Help
            </button>
          </div>
        </div>
      `;
      quickAccessDiv.insertAdjacentHTML("beforeend", actionsHTML);

      const quickBtns = quickAccessDiv.querySelectorAll(".quick-action-btn");
      quickBtns.forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          btn.style.transform = "translateY(-1px)";
          btn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.transform = "";
          btn.style.boxShadow = "";
        });
      });
    }
  }

  async checkSystemStatus() {
    // For static GH Pages, we can “check” by trying to fetch customers.json
    try {
      await fetch("./data/customers.json", { cache: "no-store" });
      this.updateSystemStatus("Customer Management", "online");
    } catch (error) {
      this.updateSystemStatus("Customer Management", "offline");
    }
  }

  updateSystemStatus(systemName, status) {
    const statusElement = document.querySelector(`[data-system="${systemName}"]`);
    if (statusElement) {
      statusElement.textContent = status === "online" ? "✅ Online" : "❌ Offline";
      statusElement.style.color = status === "online" ? "#28a745" : "#dc3545";
    }
  }

  showSystemStatus() {
    const statusInfo = `
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <h4 style="margin: 0 0 15px 0; color: #007ACC;">A-1APSVC System Status</h4>
        <div style="margin: 10px 0;">
          <strong>Main Dashboard PWA:</strong> <span style="color: #28a745;">✅ Active</span>
        </div>
        <div style="margin: 10px 0;">
          <strong>Customer Management:</strong> <span style="color: #28a745;">✅ Active</span>
        </div>
        <div style="margin: 10px 0;">
          <strong>Service Requests:</strong> <span style="color: #6c757d;">⏳ Coming Soon</span>
        </div>
        <div style="margin: 10px 0;">
          <strong>Scheduling:</strong> <span style="color: #6c757d;">⏳ Coming Soon</span>
        </div>
        <div style="margin: 10px 0;">
          <strong>Reports:</strong> <span style="color: #6c757d;">⏳ Coming Soon</span>
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-size: 0.9em; color: #666;">
          Last updated: ${new Date().toLocaleString()}
        </div>
      </div>
    `;
    this.showNotification(statusInfo, "info");
  }

  showHelp() {
    const helpInfo = `
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 420px;">
        <h4 style="margin: 0 0 15px 0; color: #007ACC;">A-1APSVC Dashboard Help</h4>
        <div style="margin: 10px 0;">
          <strong>Customer Management:</strong><br>
          Click the Customer Management card to view your customer list.
        </div>
        <div style="margin: 10px 0;">
          <strong>PWA Features:</strong><br>
          • Install as app on your device<br>
          • Works offline (cached pages)<br>
          • Fast loading
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
          <strong>Support:</strong> 469-900-5194<br>
          <strong>Email:</strong> johnniesue@a-1apsvc.com
        </div>
      </div>
    `;
    this.showNotification(helpInfo, "info");
  }

  showNotification(message, type = "info") {
    if (window.a1Dashboard && window.a1Dashboard.showNotification) {
      window.a1Dashboard.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.a1Dashboard = new A1Dashboard();
  window.dashboardIntegration = new DashboardIntegration();
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = A1Dashboard;
}
