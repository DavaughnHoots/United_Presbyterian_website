/**
 * Journey Day Manager Module
 * Handles CRUD operations for journey days
 */

window.JourneyEditor = window.JourneyEditor || {};

(function(JourneyEditor) {
  'use strict';

  // Private variables
  let currentEditingDay = null;

  /**
   * Add a new day to the journey
   */
  JourneyEditor.addDay = async function() {
    const days = JourneyEditor.getDays();
    const newDayNumber = days.length + 1;
    const dayData = {
      dayNumber: newDayNumber,
      title: `Day ${newDayNumber}`,
      description: '',
      contents: []
    };
    
    try {
      const response = await fetch(`/admin/api/journeys/${JourneyEditor.getJourneyId()}/days`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dayData)
      });
      
      if (response.ok) {
        JourneyEditor.showMessage('Day added successfully!', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add day');
      }
    } catch (error) {
      console.error('Error adding day:', error);
      JourneyEditor.showMessage('Failed to add day: ' + error.message, 'error');
    }
  };

  /**
   * Edit a specific day
   * @param {string} dayId - Day ID to edit
   */
  JourneyEditor.editDay = function(dayId) {
    if (!dayId) {
      JourneyEditor.showMessage('Please save the journey first to edit days', 'warning');
      return;
    }
    
    const day = JourneyEditor.getDay(dayId);
    if (!day) {
      JourneyEditor.showMessage('Day not found', 'error');
      return;
    }
    
    currentEditingDay = day;
    
    // Populate modal fields
    document.getElementById('modalDayId').value = dayId;
    document.getElementById('modalDayNumber').textContent = day.day_number;
    document.getElementById('modalDayTitle').value = day.title || '';
    document.getElementById('modalDayDescription').value = day.description || '';
    
    // Load contents
    renderDayContents(day);
    
    // Show modal
    document.getElementById('dayModal').style.display = 'flex';
  };

  /**
   * Close the day editor modal
   */
  JourneyEditor.closeDayModal = function() {
    document.getElementById('dayModal').style.display = 'none';
    currentEditingDay = null;
  };

  /**
   * Save changes to the current day
   */
  JourneyEditor.saveDayChanges = async function() {
    if (!currentEditingDay) return;
    
    const dayId = document.getElementById('modalDayId').value;
    const day = JourneyEditor.getDay(dayId);
    
    // Update the day object with new values
    day.title = document.getElementById('modalDayTitle').value;
    day.description = document.getElementById('modalDayDescription').value;
    
    const dayData = {
      dayId: dayId,
      dayNumber: day.day_number,
      title: day.title,
      description: day.description,
      contents: day.contents || []
    };
    
    try {
      const response = await fetch(`/admin/api/journeys/${JourneyEditor.getJourneyId()}/days`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dayData)
      });
      
      if (response.ok) {
        JourneyEditor.showMessage('Day saved successfully!', 'success');
        JourneyEditor.closeDayModal();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save day');
      }
    } catch (error) {
      console.error('Error saving day:', error);
      JourneyEditor.showMessage('Failed to save day: ' + error.message, 'error');
    }
  };

  /**
   * Delete a day from the journey
   * @param {string} dayId - Day ID to delete
   * @param {number} dayNumber - Day number for confirmation
   */
  JourneyEditor.deleteDay = async function(dayId, dayNumber) {
    if (!dayId) {
      JourneyEditor.showMessage('Cannot delete unsaved day. Please reload the page.', 'error');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete Day ${dayNumber}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/admin/api/journeys/${JourneyEditor.getJourneyId()}/days/${dayId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        JourneyEditor.showMessage('Day deleted successfully!', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete day');
      }
    } catch (error) {
      console.error('Error deleting day:', error);
      JourneyEditor.showMessage('Failed to delete day: ' + error.message, 'error');
    }
  };

  /**
   * Remove a content item from the current day
   * @param {number} index - Content index to remove
   */
  JourneyEditor.removeContentItem = function(index) {
    if (!currentEditingDay) return;
    
    if (currentEditingDay.contents) {
      currentEditingDay.contents.splice(index, 1);
      renderDayContents(currentEditingDay);
      JourneyEditor.markDirty();
    }
  };

  /**
   * Render day contents in the modal
   * @param {Object} day - Day object
   */
  function renderDayContents(day) {
    const contentsDiv = document.getElementById('modalDayContents');
    
    if (!day.contents || day.contents.length === 0) {
      contentsDiv.innerHTML = '<p class="text-muted">No content items yet</p>';
      return;
    }
    
    contentsDiv.innerHTML = day.contents.map((content, index) => {
      // Get title from metadata or direct property
      const title = content.metadata?.title || content.title || 'Untitled';
      const type = content.type || content.content_type || 'unknown';
      
      // Create display-friendly type name
      const typeDisplay = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      return `
        <div class="content-item">
          <div>
            <strong>${typeDisplay}</strong>: ${title}
            <span class="text-muted ml-2">${content.duration_minutes || 5} minutes</span>
          </div>
          <div>
            <button class="btn btn-sm btn-outline-primary mr-1" onclick="JourneyEditor.ContentPicker.editContentItem(${index})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="JourneyEditor.removeContentItem(${index})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Add content item to current day
   */
  JourneyEditor.addContentItem = function() {
    if (!currentEditingDay) {
      JourneyEditor.showMessage('No day selected', 'error');
      return;
    }
    
    // Open content picker (will be handled by content picker module)
    if (JourneyEditor.ContentPicker) {
      JourneyEditor.ContentPicker.open(currentEditingDay);
    } else {
      console.error('Content picker module not loaded');
      JourneyEditor.showMessage('Content picker not available', 'error');
    }
  };

  /**
   * Get current editing day
   * @returns {Object|null} Current day being edited
   */
  JourneyEditor.getCurrentEditingDay = function() {
    return currentEditingDay;
  };

  /**
   * Refresh current day display
   */
  JourneyEditor.refreshDayDisplay = function() {
    if (currentEditingDay) {
      renderDayContents(currentEditingDay);
    }
  };

})(window.JourneyEditor);