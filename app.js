/**
 * Main Application Logic
 */

// Global State
const AppState = {
    fingerprint: null,
    employeeName: null,
    currentView: 'dashboard'
};

// ==========================================================================
// Initialization & Utility
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Check for identifying data
    loadUserInfo();
    
    // 2. Setup Routing based on hash
    window.addEventListener('hashchange', handleRouteChange);
    
    // Handle initial route
    if (!window.location.hash) {
        window.location.hash = 'dashboard';
    } else {
        handleRouteChange();
    }

    // 3. Attach Listeners
    setupEventListeners();
}

/**
 * Load or generate the device fingerprint and user name.
 */
function loadUserInfo() {
    let fp = localStorage.getItem('device_fingerprint');
    const name = localStorage.getItem('employee_name');
    
    if (!fp) {
        fp = generateFingerprint();
        localStorage.setItem('device_fingerprint', fp);
    }
    
    AppState.fingerprint = fp;
    
    if (name) {
        AppState.employeeName = name;
        document.getElementById('header-user-name').textContent = name;
    } else {
        // Force setup view
        window.location.hash = 'setup';
    }
}

/**
 * Unchangeable Device Fingerprint generation.
 * This is a basic implementation combining the user agent, screen resolution, and a random UUID.
 * Since it is stored in localStorage, it will persist unless cleared by the user.
 */
function generateFingerprint() {
    const randomHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    const uuid = `${randomHex()}${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}${randomHex()}${randomHex()}`;
    const ua = navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20); // snippet
    const screenInfo = `${screen.width}x${screen.height}`;
    
    // Simple hash function for the screen+ua info
    let hash = 0, i, chr;
    const str = ua + screenInfo;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    
    return `DEV_${Math.abs(hash)}_${uuid}`;
}

// ==========================================================================
// Routing & Navigation
// ==========================================================================
function handleRouteChange() {
    let hash = window.location.hash.replace('#', '') || 'dashboard';
    
    // Guard: Enforce setup if name is missing
    if (!AppState.employeeName && hash !== 'setup') {
        window.location.hash = 'setup';
        return;
    }
    
    // If setup is complete and user tries to go to setup, redirect to dashboard
    if (AppState.employeeName && hash === 'setup') {
        window.location.hash = 'dashboard';
        return;
    }

    // Update views
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    const targetView = document.getElementById(`view-${hash}`);
    if (targetView) {
        targetView.classList.remove('hidden');
    } else {
        // Fallback
        document.getElementById('view-dashboard').classList.remove('hidden');
        hash = 'dashboard';
    }

    // Update bottom nav UI
    document.querySelectorAll('.bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`.bottom-nav .nav-item[href="#${hash}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Update Page Title
    const titleMap = {
        'dashboard': 'Dashboard',
        'sales-visit': 'Sales Visit',
        'expense-entry': 'Expense Entry',
        'history': 'History',
        'general-attendance': 'General Attendance',
        'service-attendance': 'Service Attendance',
        'setup': 'Profile Setup'
    };
    
    document.getElementById('page-title').textContent = titleMap[hash] || 'App';
    AppState.currentView = hash;
}

// ==========================================================================
// Event Handlers
// ==========================================================================
function setupEventListeners() {
    // Setup Profile Form
    const setupForm = document.getElementById('setup-form');
    if (setupForm) {
        setupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('setup-name').value.trim();
            if (name) {
                localStorage.setItem('employee_name', name);
                AppState.employeeName = name;
                document.getElementById('header-user-name').textContent = name;
                window.location.hash = 'dashboard';
                prefillForms(); // Fill names into forms
            }
        });
    }

    // Prefill names if already loaded
    if (AppState.employeeName) {
        prefillForms();
    }

    // Image previews
    setupImagePreview('ga-selfie', 'ga-selfie-preview');
    setupImagePreview('sv-selfie', 'sv-selfie-preview');
    setupImagePreview('sa-selfie', 'sa-selfie-preview');
    setupImagePreview('sa-labour-photo', 'sa-labour-preview');
    setupFilePreview('ex-attachment', 'ex-attachment-name');

    // Dynamic Selects & Inputs
    const svPurpose = document.getElementById('sv-purpose');
    const svOtherContainer = document.getElementById('sv-other-purpose-container');
    const svOtherInput = document.getElementById('sv-other-purpose');
    if (svPurpose) {
        svPurpose.addEventListener('change', (e) => {
            if (e.target.value === 'Others') {
                svOtherContainer.classList.remove('hidden');
                svOtherInput.required = true;
            } else {
                svOtherContainer.classList.add('hidden');
                svOtherInput.required = false;
            }
        });
    }

    const saLabour = document.getElementById('sa-labour');
    const saLabourPhotoCont = document.getElementById('sa-labour-photo-container');
    const saLabourPhotoInput = document.getElementById('sa-labour-photo');
    if (saLabour) {
        saLabour.addEventListener('input', (e) => {
            if (parseInt(e.target.value) > 0) {
                saLabourPhotoCont.classList.remove('hidden');
                saLabourPhotoInput.required = true;
            } else {
                saLabourPhotoCont.classList.add('hidden');
                saLabourPhotoInput.required = false;
            }
        });
    }

    const exCategory = document.getElementById('ex-category');
    const exPaymentMethodCont = document.getElementById('ex-payment-method-container');
    const exPaymentMethodInput = document.getElementById('ex-payment-method');
    if (exCategory) {
        exCategory.addEventListener('change', (e) => {
            if (e.target.value === 'Advance Received') {
                exPaymentMethodCont.classList.remove('hidden');
                exPaymentMethodInput.required = true;
            } else {
                exPaymentMethodCont.classList.add('hidden');
                exPaymentMethodInput.required = false;
            }
        });
        
        // Auto set Date to today
        document.getElementById('ex-date').value = Utils.getDateTime().date;
    }

    // Form Submissions
    document.getElementById('form-general').addEventListener('submit', handleGeneralAttendance);
    document.getElementById('form-sales').addEventListener('submit', handleSalesVisit);
    document.getElementById('form-service').addEventListener('submit', handleServiceAttendance);
    document.getElementById('form-expense').addEventListener('submit', handleExpenseEntry);
}

function prefillForms() {
    ['ga-name', 'sv-name', 'sa-name', 'ex-name'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = AppState.employeeName;
    });
}

function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
}

function setupFilePreview(inputId, textId) {
    const input = document.getElementById(inputId);
    const text = document.getElementById(textId);
    if (!input || !text) return;

    input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            text.textContent = e.target.files[0].name;
        }
    });
}

// ==========================================================================
// Form Submission Handlers
// ==========================================================================

async function gatherAutoFields() {
    UI.showLoader();
    try {
        const { date, time } = Utils.getDateTime();
        const fp = AppState.fingerprint;
        
        // Parallel fetch for speed
        const [location, ip, battery] = await Promise.allSettled([
            Utils.getLocation(),
            Utils.getIPAddress(),
            Utils.getBattery()
        ]);
        
        let lat = 0, lng = 0, address = "Unknown Array";
        if (location.status === 'fulfilled') {
            lat = location.value.lat;
            lng = location.value.lng;
            address = await Utils.getAddress(lat, lng);
        }

        return {
            date, time, fingerprint: fp,
            lat, lng, address,
            ip: ip.status === 'fulfilled' ? ip.value : "Unknown",
            battery: battery.status === 'fulfilled' ? battery.value : "Unknown"
        };
    } catch (e) {
        throw e;
    } finally {
        UI.hideLoader();
    }
}

async function handleGeneralAttendance(e) {
    e.preventDefault();
    try {
        const auto = await gatherAutoFields();
        UI.showLoader();
        
        const file = document.getElementById('ga-selfie').files[0];
        const compressedImage = await Utils.compressImage(file);
        
        const payload = {
            ...auto,
            employeeName: AppState.employeeName,
            location: document.getElementById('ga-location').value,
            purpose: document.getElementById('ga-purpose').value,
            selfie: compressedImage
        };
        
        const res = await ApiService.post('submitAttendance', payload);
        alert('Attendance Submitted Successfully!');
        e.target.reset();
        document.getElementById('ga-selfie-preview').classList.add('hidden');
        prefillForms();
        window.location.hash = 'dashboard';
        
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        UI.hideLoader();
    }
}

async function handleSalesVisit(e) {
    e.preventDefault();
    try {
        const auto = await gatherAutoFields();
        UI.showLoader();
        
        const file = document.getElementById('sv-selfie').files[0];
        const compressedImage = await Utils.compressImage(file);
        
        const purposeSelect = document.getElementById('sv-purpose').value;
        const purpose = purposeSelect === 'Others' ? document.getElementById('sv-other-purpose').value : purposeSelect;
        
        const payload = {
            ...auto,
            employeeName: AppState.employeeName,
            company: document.getElementById('sv-company').value,
            contactPerson: document.getElementById('sv-contact').value,
            visitAddress: document.getElementById('sv-address').value,
            visitPurpose: purpose,
            selfie: compressedImage
        };
        
        const res = await ApiService.post('submitVisit', payload);
        alert('Visit Submitted Successfully!');
        e.target.reset();
        document.getElementById('sv-selfie-preview').classList.add('hidden');
        document.getElementById('sv-other-purpose-container').classList.add('hidden');
        prefillForms();
        window.location.hash = 'dashboard';
        
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        UI.hideLoader();
    }
}

async function handleServiceAttendance(e) {
    e.preventDefault();
    try {
        const auto = await gatherAutoFields();
        UI.showLoader();
        
        const selfieFile = document.getElementById('sa-selfie').files[0];
        const compressedSelfie = await Utils.compressImage(selfieFile);
        
        const numLabour = parseInt(document.getElementById('sa-labour').value) || 0;
        let compressedLabourPhoto = null;
        
        if (numLabour > 0) {
            const labourFile = document.getElementById('sa-labour-photo').files[0];
            compressedLabourPhoto = await Utils.compressImage(labourFile);
        }
        
        const payload = {
            ...auto,
            employeeName: AppState.employeeName,
            siteName: document.getElementById('sa-site').value,
            numberOfLabour: numLabour,
            selfie: compressedSelfie,
            labourPhoto: compressedLabourPhoto
        };
        
        const res = await ApiService.post('submitServiceAttendance', payload);
        alert('Service Attendance Submitted Successfully!');
        e.target.reset();
        document.getElementById('sa-selfie-preview').classList.add('hidden');
        document.getElementById('sa-labour-preview').classList.add('hidden');
        document.getElementById('sa-labour-photo-container').classList.add('hidden');
        prefillForms();
        window.location.hash = 'dashboard';
        
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        UI.hideLoader();
    }
}

async function handleExpenseEntry(e) {
    e.preventDefault();
    try {
        // No auto geolocation strictly needed for expense, but fingerprint and name are
        UI.showLoader();
        
        const file = document.getElementById('ex-attachment').files[0];
        let attachmentBase64 = null;
        
        if (file) {
            if (file.type.startsWith('image/')) {
                attachmentBase64 = await Utils.compressImage(file, 1200, 1200, 0.8); // Higher quality for receipts
            } else {
                // Read PDF as base64
                attachmentBase64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
            }
        }
        
        const { time } = Utils.getDateTime();
        
        const payload = {
            fingerprint: AppState.fingerprint,
            employeeName: AppState.employeeName,
            date: document.getElementById('ex-date').value,
            time: time,
            category: document.getElementById('ex-category').value,
            subCategory: document.getElementById('ex-sub-category').value,
            paymentMethod: document.getElementById('ex-payment-method').value,
            amount: parseFloat(document.getElementById('ex-amount').value),
            description: document.getElementById('ex-description').value,
            attachment: attachmentBase64
        };
        
        const res = await ApiService.post('submitExpense', payload);
        alert('Expense Submitted Successfully!');
        e.target.reset();
        document.getElementById('ex-attachment-name').textContent = '';
        document.getElementById('ex-payment-method-container').classList.add('hidden');
        document.getElementById('ex-date').value = Utils.getDateTime().date;
        prefillForms();
        window.location.hash = 'dashboard';
        
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        UI.hideLoader();
    }
}

// ==========================================================================
// Dashboard & History Logic
// ==========================================================================

let historyData = [];
let currentHistoryType = 'visits';

document.addEventListener('DOMContentLoaded', () => {
    // History Tab Listeners
    document.querySelectorAll('.hist-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.hist-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentHistoryType = e.target.getAttribute('data-type');
            loadHistory(currentHistoryType);
        });
    });

    // Filter/Search Listeners
    const histSearch = document.getElementById('hist-search');
    const histFilter = document.getElementById('hist-filter');
    if (histSearch) histSearch.addEventListener('input', renderHistory);
    if (histFilter) histFilter.addEventListener('change', renderHistory);
    
    // Auto load dashboard when routing to it
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        if (hash === 'dashboard') loadDashboardStats();
        if (hash === 'history') loadHistory(currentHistoryType);
    });
});

async function loadDashboardStats() {
    if (!AppState.fingerprint) return;
    try {
        // Fetch abbreviated stats from a generic dashboard endpoint or calculate from getVisits/getAttendance
        const res = await ApiService.get('getDashboardStats', { fingerprint: AppState.fingerprint });
        document.getElementById('dash-visits-count').textContent = res.data?.visitsThisMonth || 0;
        document.getElementById('dash-attendance-count').textContent = res.data?.attendanceThisMonth || 0;
    } catch (e) {
        console.error("Could not load dashboard stats", e);
    }
}

async function loadHistory(type) {
    if (!AppState.fingerprint) return;
    UI.showLoader();
    const listEl = document.getElementById('history-list');
    listEl.innerHTML = '<p class="text-center text-muted">Loading...</p>';
    
    try {
        // action matches the backend endpoints: getVisits, getGeneral, getService, getExpenses
        let action = 'getVisits';
        if (type === 'general') action = 'getAttendance';
        if (type === 'service') action = 'getService';
        if (type === 'expenses') action = 'getExpenses';

        const res = await ApiService.get(action, { fingerprint: AppState.fingerprint });
        historyData = res.data || [];
        renderHistory();
    } catch (e) {
        listEl.innerHTML = `<p class="text-center text-danger">Error: ${e.message}</p>`;
    } finally {
        UI.hideLoader();
    }
}

function renderHistory() {
    const listEl = document.getElementById('history-list');
    const search = document.getElementById('hist-search').value.toLowerCase();
    const filter = document.getElementById('hist-filter').value;
    
    // Filter data
    const filtered = historyData.filter(item => {
        // Basic match across values
        const matchesSearch = Object.values(item).some(val => 
            val && String(val).toLowerCase().includes(search)
        );
        
        let matchesDate = true;
        if (filter !== 'all' && item.date) {
            const itemDate = new Date(item.date);
            const now = new Date();
            if (filter === 'today') {
                matchesDate = itemDate.toDateString() === now.toDateString();
            } else if (filter === 'week') {
                const diff = (now - itemDate) / (1000 * 60 * 60 * 24);
                matchesDate = diff <= 7;
            } else if (filter === 'month') {
                matchesDate = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
            }
        }
        
        return matchesSearch && matchesDate;
    });

    // Render Stats
    const statsContainer = document.getElementById('hist-stats-container');
    if (historyData.length > 0) {
        statsContainer.classList.remove('hidden');
        document.getElementById('hist-stat-total').textContent = historyData.length;
        document.getElementById('hist-stat-filtered').textContent = filtered.length;
    } else {
        statsContainer.classList.add('hidden');
    }

    // Empty state
    if (filtered.length === 0) {
        listEl.innerHTML = '<p class="text-center text-muted margin-top-md">No records found.</p>';
        return;
    }

    // Build HTML
    let html = '';
    filtered.forEach(item => {
        let title = '', detail = '', badge = '';
        
        if (currentHistoryType === 'visits') {
            title = item.company || 'Unknown Company';
            detail = `${item.date} • ${item.visitPurpose}`;
        } else if (currentHistoryType === 'general') {
            title = item.location || 'Unknown Location';
            detail = `${item.date} • ${item.purpose}`;
        } else if (currentHistoryType === 'service') {
            title = item.siteName || 'Unknown Site';
            detail = `${item.date} • Labour: ${item.numberOfLabour}`;
        } else if (currentHistoryType === 'expenses') {
            title = `${item.category}`;
            detail = `${item.date} • ₹${item.amount}`;
            if (item.category === 'Expense') badge = '<span class="status-badge expense">Expense</span>';
            if (item.category === 'Advance Received') badge = '<span class="status-badge advance">Advance</span>';
        }

        html += `
            <div class="history-card">
                <div class="history-card-header">
                    <span>${item.date} ${item.time || ''}</span>
                    ${badge}
                </div>
                <div class="history-card-title">${title}</div>
                <div class="history-card-detail">${detail}</div>
            </div>
        `;
    });
    
    listEl.innerHTML = html;
}

// ==========================================================================
// Utilities
// ==========================================================================
const UI = {
    showLoader: () => document.getElementById('app-loader').classList.remove('hidden'),
    hideLoader: () => document.getElementById('app-loader').classList.add('hidden'),
    showAlert: (msg) => alert(msg) // Placeholder for better UI notification system
};

const Utils = {
    /**
     * Get current location Promise wrapper
     * @returns {Promise<{lat: number, lng: number}>}
     */
    getLocation: () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }),
                    (err) => reject(err),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            }
        });
    },

    /**
     * Get reverse geocoded address using free Nominatim API
     * @param {number} lat 
     * @param {number} lng 
     * @returns {Promise<string>}
     */
    getAddress: async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            return data.display_name || "Address not found";
        } catch (error) {
            console.error("Reverse Geocoding Failed:", error);
            return `${lat}, ${lng}`; // Fallback to coordinates
        }
    },

    /**
     * Compress an image file using Canvas.
     * @param {File} file 
     * @param {number} maxWidth 
     * @param {number} maxHeight 
     * @param {number} quality (0.0 to 1.0)
     * @returns {Promise<string>} Base64 data URL
     */
    compressImage: (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height *= maxWidth / width));
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width *= maxHeight / height));
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataUrl);
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    },
    
    /**
     * Get current Date and Time strings
     * @returns {{date: string, time: string}}
     */
    getDateTime: () => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        
        // Format time to HH:MM:SS local
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const time = `${hours}:${minutes}:${seconds}`;
        
        return { date, time };
    },

    /**
     * Get IP address (using a free API)
     * @returns {Promise<string>}
     */
    getIPAddress: async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (e) {
            return "Unknown IP";
        }
    },

    /**
     * Get Battery Level
     * @returns {Promise<string>}
     */
    getBattery: async () => {
        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                return `${Math.round(battery.level * 100)}%`;
            } catch (e) {
                return "Unknown Battery";
            }
        }
        return "Not supported";
    }
};
