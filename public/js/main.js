// Main JavaScript file for United Presbyterian Church

// Install prompt handling
let deferredPrompt;
const installButton = document.getElementById('installButton');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show install button if it exists
    if (installButton) {
        installButton.style.display = 'block';
        
        installButton.addEventListener('click', async () => {
            // Hide the button
            installButton.style.display = 'none';
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // Clear the deferred prompt
            deferredPrompt = null;
        });
    }
});

// App installed event
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // Hide the app provided install promotion
    if (installButton) {
        installButton.style.display = 'none';
    }
});

// Offline detection
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
    const condition = navigator.onLine ? 'online' : 'offline';
    console.log('Status:', condition);
    
    // Show/hide offline indicator
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {
        if (condition === 'offline') {
            offlineIndicator.classList.remove('hidden');
        } else {
            offlineIndicator.classList.add('hidden');
        }
    }
}

// Background sync for submissions
if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const forms = document.querySelectorAll('form[data-sync]');
    
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Store in IndexedDB for offline
            if (!navigator.onLine) {
                await storeSubmissionOffline(data);
                showNotification('Your submission will be sent when you\'re back online');
                form.reset();
                return;
            }
            
            // Normal submission if online
            form.submit();
        });
    });
}

// Store submissions offline
async function storeSubmissionOffline(data) {
    // Open IndexedDB
    const db = await openDB();
    const tx = db.transaction(['submissions'], 'readwrite');
    const store = tx.objectStore('submissions');
    
    await store.add({
        ...data,
        timestamp: Date.now(),
        synced: false
    });
    
    // Register background sync
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-submissions');
}

// Open IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('upc-db', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('submissions')) {
                db.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-20 left-4 right-4 bg-sky-blue text-white p-4 rounded-lg shadow-lg z-50 animate-slide-up';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-up {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    .animate-slide-up {
        animation: slide-up 0.3s ease-out;
    }
`;
document.head.appendChild(style);

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    updateOnlineStatus();
});