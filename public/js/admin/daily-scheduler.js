/**
 * Daily Content Scheduler
 * Manages the calendar interface for scheduling daily spiritual content
 */

const DailyScheduler = (function() {
    'use strict';
    
    let currentMonth = serverData.currentMonth;
    let currentYear = serverData.currentYear;
    let contentByDate = serverData.contentByDate || {};
    let selectedDate = null;
    let selectedContentType = null;
    let pendingSchedule = [];
    
    /**
     * Initialize the scheduler
     */
    function init() {
        // Set up event listeners
        document.getElementById('prevMonth').addEventListener('click', previousMonth);
        document.getElementById('nextMonth').addEventListener('click', nextMonth);
        document.getElementById('generateContentBtn').addEventListener('click', showGenerateModal);
        document.getElementById('contentSearch').addEventListener('input', filterContent);
        
        // Render initial calendar
        renderCalendar();
        updateMonthDisplay();
    }
    
    /**
     * Render the calendar grid
     */
    function renderCalendar() {
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';
        
        const firstDay = new Date(currentYear, currentMonth - 1, 1);
        const lastDay = new Date(currentYear, currentMonth, 0);
        const prevLastDay = new Date(currentYear, currentMonth - 1, 0);
        
        const firstDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        const daysInPrevMonth = prevLastDay.getDate();
        
        // Previous month's trailing days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const date = new Date(currentYear, currentMonth - 2, day);
            calendarDays.appendChild(createDayElement(date, true));
        }
        
        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth - 1, day);
            calendarDays.appendChild(createDayElement(date, false));
        }
        
        // Next month's leading days
        const totalCells = calendarDays.children.length;
        const remainingCells = 35 - totalCells; // 5 rows x 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(currentYear, currentMonth, day);
            calendarDays.appendChild(createDayElement(date, true));
        }
    }
    
    /**
     * Create a calendar day element
     */
    function createDayElement(date, isOtherMonth) {
        const dayDiv = document.createElement('div');
        const dateStr = formatDateForDB(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isToday = date.getTime() === today.getTime();
        
        dayDiv.className = 'calendar-day';
        if (isOtherMonth) dayDiv.classList.add('other-month');
        if (isToday) dayDiv.classList.add('today');
        
        const dayContent = contentByDate[dateStr];
        if (dayContent && dayContent.length > 0) {
            dayDiv.classList.add('has-content');
        }
        
        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'font-semibold mb-1';
        dayNumber.textContent = date.getDate();
        dayDiv.appendChild(dayNumber);
        
        // Content indicators
        if (dayContent && dayContent.length > 0) {
            const indicators = document.createElement('div');
            indicators.className = 'flex flex-wrap gap-1';
            
            dayContent.forEach(item => {
                const indicator = document.createElement('span');
                indicator.className = `content-indicator content-type-${item.contentType}`;
                indicator.title = getContentTypeName(item.contentType);
                indicators.appendChild(indicator);
            });
            
            dayDiv.appendChild(indicators);
        }
        
        // Click handler
        dayDiv.addEventListener('click', () => openScheduleModal(date));
        
        return dayDiv;
    }
    
    /**
     * Format date for database storage
     */
    function formatDateForDB(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Format date for display
     */
    function formatDateForDisplay(date) {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    /**
     * Get content type name
     */
    function getContentTypeName(type) {
        const typeConfig = Object.values(serverData.contentTypes).find(t => t.dbType === type);
        return typeConfig ? typeConfig.name : type;
    }
    
    /**
     * Navigate to previous month
     */
    function previousMonth() {
        currentMonth--;
        if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
        }
        updateCalendar();
    }
    
    /**
     * Navigate to next month
     */
    function nextMonth() {
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
        updateCalendar();
    }
    
    /**
     * Update calendar display
     */
    async function updateCalendar() {
        // Fetch content for new month
        try {
            const response = await fetch(`/api/admin/daily-schedule/${currentYear}/${currentMonth}`);
            if (response.ok) {
                contentByDate = await response.json();
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
        }
        
        renderCalendar();
        updateMonthDisplay();
    }
    
    /**
     * Update month display
     */
    function updateMonthDisplay() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('currentMonthYear').textContent = 
            `${monthNames[currentMonth - 1]} ${currentYear}`;
    }
    
    /**
     * Open schedule modal for a specific date
     */
    function openScheduleModal(date) {
        selectedDate = date;
        const dateStr = formatDateForDB(date);
        
        document.getElementById('selectedDate').textContent = formatDateForDisplay(date);
        
        // Show current content
        const scheduledItems = document.getElementById('scheduledItems');
        scheduledItems.innerHTML = '';
        
        const dayContent = contentByDate[dateStr] || [];
        if (dayContent.length === 0) {
            scheduledItems.innerHTML = '<p class="text-gray-500">No content scheduled for this day</p>';
        } else {
            dayContent.forEach(item => {
                const itemDiv = createScheduledItemElement(item);
                scheduledItems.appendChild(itemDiv);
            });
        }
        
        // Reset pending schedule
        pendingSchedule = [...dayContent];
        
        document.getElementById('scheduleModal').classList.remove('hidden');
    }
    
    /**
     * Create scheduled item element
     */
    function createScheduledItemElement(item) {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        
        const info = document.createElement('div');
        info.className = 'flex items-center gap-2';
        
        const typeConfig = Object.values(serverData.contentTypes).find(t => t.dbType === item.contentType);
        if (typeConfig) {
            const icon = document.createElement('i');
            icon.className = `fas ${typeConfig.icon} text-${typeConfig.color}-600`;
            info.appendChild(icon);
        }
        
        const title = document.createElement('span');
        title.textContent = item.content ? item.content.title : getContentTypeName(item.contentType);
        info.appendChild(title);
        
        div.appendChild(info);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'text-red-600 hover:text-red-800';
        removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
        removeBtn.onclick = () => removeScheduledItem(item.id);
        div.appendChild(removeBtn);
        
        return div;
    }
    
    /**
     * Close schedule modal
     */
    function closeModal() {
        document.getElementById('scheduleModal').classList.add('hidden');
        selectedDate = null;
        pendingSchedule = [];
    }
    
    /**
     * Select content type to add
     */
    async function selectContent(contentType) {
        selectedContentType = contentType;
        const typeConfig = Object.values(serverData.contentTypes).find(t => t.dbType === contentType);
        
        document.getElementById('contentTypeName').textContent = typeConfig ? typeConfig.name : contentType;
        
        // Fetch available content
        try {
            const response = await fetch(`/api/content/${contentType}`);
            if (response.ok) {
                const content = await response.json();
                displayContentList(content);
            }
        } catch (error) {
            console.error('Error fetching content:', error);
        }
        
        document.getElementById('contentSelectionModal').classList.remove('hidden');
    }
    
    /**
     * Display content list for selection
     */
    function displayContentList(content) {
        const contentList = document.getElementById('contentList');
        contentList.innerHTML = '';
        
        if (content.length === 0) {
            contentList.innerHTML = '<p class="text-gray-500 text-center py-4">No content available</p>';
            return;
        }
        
        content.forEach(item => {
            const div = document.createElement('div');
            div.className = 'p-3 border rounded-lg cursor-pointer hover:bg-gray-50';
            div.onclick = () => addContentToSchedule(item);
            
            const title = document.createElement('h4');
            title.className = 'font-semibold';
            title.textContent = item.title;
            div.appendChild(title);
            
            if (item.author || item.artist) {
                const author = document.createElement('p');
                author.className = 'text-sm text-gray-600';
                author.textContent = item.author || item.artist;
                div.appendChild(author);
            }
            
            contentList.appendChild(div);
        });
    }
    
    /**
     * Filter content list
     */
    function filterContent(event) {
        const searchTerm = event.target.value.toLowerCase();
        const items = document.querySelectorAll('#contentList > div');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }
    
    /**
     * Add content to schedule
     */
    function addContentToSchedule(content) {
        const scheduleItem = {
            id: `pending_${Date.now()}`,
            contentId: content.id,
            contentType: selectedContentType,
            content: content,
            date: formatDateForDB(selectedDate)
        };
        
        pendingSchedule.push(scheduleItem);
        
        // Update UI
        const scheduledItems = document.getElementById('scheduledItems');
        if (scheduledItems.querySelector('.text-gray-500')) {
            scheduledItems.innerHTML = '';
        }
        scheduledItems.appendChild(createScheduledItemElement(scheduleItem));
        
        closeContentSelection();
    }
    
    /**
     * Close content selection modal
     */
    function closeContentSelection() {
        document.getElementById('contentSelectionModal').classList.add('hidden');
        selectedContentType = null;
    }
    
    /**
     * Remove scheduled item
     */
    async function removeScheduledItem(itemId) {
        if (itemId.startsWith('pending_')) {
            // Remove from pending schedule
            pendingSchedule = pendingSchedule.filter(item => item.id !== itemId);
        } else {
            // Remove from database
            try {
                const response = await fetch(`/api/admin/daily-schedule/${itemId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to remove item');
                }
                
                // Remove from local data
                const dateStr = formatDateForDB(selectedDate);
                if (contentByDate[dateStr]) {
                    contentByDate[dateStr] = contentByDate[dateStr].filter(item => item.id !== itemId);
                }
            } catch (error) {
                console.error('Error removing item:', error);
                showToast('Failed to remove item', 'error');
                return;
            }
        }
        
        // Update UI
        openScheduleModal(selectedDate);
        renderCalendar();
    }
    
    /**
     * Save schedule
     */
    async function saveSchedule() {
        const dateStr = formatDateForDB(selectedDate);
        const newItems = pendingSchedule.filter(item => item.id.startsWith('pending_'));
        
        if (newItems.length === 0) {
            closeModal();
            return;
        }
        
        try {
            const response = await fetch('/api/admin/daily-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: dateStr,
                    items: newItems.map(item => ({
                        contentId: item.contentId,
                        contentType: item.contentType
                    }))
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save schedule');
            }
            
            const savedItems = await response.json();
            
            // Update local data
            if (!contentByDate[dateStr]) {
                contentByDate[dateStr] = [];
            }
            contentByDate[dateStr].push(...savedItems);
            
            showToast('Schedule saved successfully');
            closeModal();
            renderCalendar();
        } catch (error) {
            console.error('Error saving schedule:', error);
            showToast('Failed to save schedule', 'error');
        }
    }
    
    /**
     * Show generate modal
     */
    function showGenerateModal() {
        // Set default dates
        const today = new Date();
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);
        
        document.getElementById('generateStartDate').value = formatDateForDB(startDate);
        document.getElementById('generateEndDate').value = formatDateForDB(endDate);
        
        document.getElementById('generateModal').classList.remove('hidden');
    }
    
    /**
     * Close generate modal
     */
    function closeGenerateModal() {
        document.getElementById('generateModal').classList.add('hidden');
    }
    
    /**
     * Generate content for date range
     */
    async function generateContent() {
        const startDate = document.getElementById('generateStartDate').value;
        const endDate = document.getElementById('generateEndDate').value;
        const overwrite = document.getElementById('overwriteExisting').checked;
        const avoidRepeats = document.getElementById('avoidRepeats').checked;
        
        if (!startDate || !endDate) {
            showToast('Please select date range', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/admin/daily-schedule/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    overwrite,
                    avoidRepeats
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate content');
            }
            
            const result = await response.json();
            
            showToast(`Generated content for ${result.daysGenerated} days`);
            closeGenerateModal();
            updateCalendar();
        } catch (error) {
            console.error('Error generating content:', error);
            showToast('Failed to generate content', 'error');
        }
    }
    
    /**
     * Show toast notification
     */
    function showToast(message, type = 'success') {
        // This would integrate with your existing toast system
        console.log(`${type}: ${message}`);
        
        // Simple implementation
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${
            type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    // Public API
    return {
        init,
        closeModal,
        selectContent,
        closeContentSelection,
        saveSchedule,
        closeGenerateModal,
        generateContent
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', DailyScheduler.init);