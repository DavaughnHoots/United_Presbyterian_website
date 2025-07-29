// Admin user management functions

async function toggleAdmin(userId, isCurrentlyAdmin) {
    const action = isCurrentlyAdmin ? 'remove admin privileges from' : 'make';
    if (!confirm(`Are you sure you want to ${action} this user ${isCurrentlyAdmin ? '' : 'an admin'}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/admin/api/users/${userId}/toggle-admin`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin' // Important for session cookies
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Admin toggle successful:', result);
            location.reload();
        } else {
            const error = await response.text();
            console.error('Server response:', error);
            alert('Failed to update user admin status: ' + error);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Error: ' + error.message);
    }
}

async function toggleUserStatus(userId, isCurrentlyActive) {
    if (!confirm(`Are you sure you want to ${isCurrentlyActive ? 'deactivate' : 'activate'} this user?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/admin/api/users/${userId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin' // Important for session cookies
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Status toggle successful:', result);
            location.reload();
        } else {
            const error = await response.text();
            console.error('Server response:', error);
            alert('Failed to update user status: ' + error);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Error: ' + error.message);
    }
}

async function viewUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const details = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-sm font-medium text-gray-600">Name</label>
                    <p class="font-medium">${user.firstName} ${user.lastName}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Church Email</label>
                    <p class="font-medium">${user.email}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Personal Email</label>
                    <p class="font-medium">${user.personalEmail || 'Not provided'}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Status</label>
                    <p class="font-medium">
                        ${user.isActive ? '<span class="text-green-600">Active</span>' : '<span class="text-red-600">Inactive</span>'}
                        ${user.isAdmin ? '<span class="ml-2 text-purple-600">(Admin)</span>' : ''}
                    </p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Joined</label>
                    <p class="font-medium">${new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Last Active</label>
                    <p class="font-medium">${user.lastActiveDate ? new Date(user.lastActiveDate).toLocaleDateString() : 'Never'}</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Current Streak</label>
                    <p class="font-medium">${user.currentStreak} days</p>
                </div>
                <div>
                    <label class="text-sm font-medium text-gray-600">Longest Streak</label>
                    <p class="font-medium">${user.longestStreak} days</p>
                </div>
            </div>
            
            <div>
                <label class="text-sm font-medium text-gray-600">Email Preferences</label>
                <div class="mt-1 space-y-1">
                    <p class="text-sm">
                        <i class="fas ${user.preferences?.emailNotifications ? 'fa-check text-green-600' : 'fa-times text-red-600'} mr-2"></i>
                        Email notifications
                    </p>
                    <p class="text-sm">
                        <i class="fas ${user.preferences?.dailyReminder ? 'fa-check text-green-600' : 'fa-times text-red-600'} mr-2"></i>
                        Daily reminder (${user.preferences?.reminderTime || '08:00'})
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('userDetails').innerHTML = details;
    document.getElementById('userModal').classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

async function exportUsers() {
    try {
        const response = await fetch('/admin/api/users/export', {
            credentials: 'same-origin'
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        alert('Error exporting users: ' + error.message);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin users script loaded');
    console.log('API endpoints ready for user management actions');
});