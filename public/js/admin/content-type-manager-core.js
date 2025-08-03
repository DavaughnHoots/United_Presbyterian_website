/**
 * Content Type Manager Core Module
 * Handles state management and core functionality for generic content types
 */

const ContentTypeManager = (function() {
  'use strict';

  // Private state
  let items = [];
  let contentType = null;
  let apiEndpoint = '';

  /**
   * Initialize the manager with data and configuration
   */
  function init(initialItems, typeConfig) {
    items = initialItems || [];
    contentType = typeConfig;
    
    // Set API endpoint based on content type
    apiEndpoint = `/admin/api/content/${contentType.dbType}`;
    
    console.log(`Content Type Manager initialized for ${contentType.name}`);
    updateStats();
  }

  /**
   * Get all items
   */
  function getAllItems() {
    return items;
  }

  /**
   * Get item by ID
   */
  function getItemById(id) {
    return items.find(item => item.id === id);
  }

  /**
   * Get content type configuration
   */
  function getContentType() {
    return contentType;
  }

  /**
   * Update statistics display
   */
  function updateStats() {
    const totalCount = items.length;
    const activeCount = items.filter(item => item.is_active).length;
    const categories = [...new Set(items.map(item => item.category))];
    
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('activeCount').textContent = activeCount;
    document.getElementById('categoryCount').textContent = categories.length;
    
    // Update filtered count (will be called by filter manager)
    const visibleItems = document.querySelectorAll('.item-card:not([style*="display: none"])').length;
    document.getElementById('filteredCount').textContent = visibleItems;
  }

  /**
   * Toggle item active status
   */
  async function toggleItemStatus(itemId, currentStatus) {
    try {
      const response = await fetch(`${apiEndpoint}/${itemId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to toggle status');

      const updatedItem = await response.json();
      
      // Update local state
      const index = items.findIndex(item => item.id === itemId);
      if (index !== -1) {
        items[index] = { ...items[index], ...updatedItem };
        
        // Update UI
        const itemElement = document.querySelector(`[data-id="${itemId}"]`);
        if (itemElement) {
          const button = itemElement.querySelector('[data-action="toggle"]');
          const newStatus = !currentStatus;
          
          // Update button appearance
          button.dataset.isActive = newStatus;
          button.className = newStatus ? 'text-yellow-600 hover:bg-yellow-50 p-2 rounded' : 'text-green-600 hover:bg-green-50 p-2 rounded';
          button.title = newStatus ? 'Deactivate' : 'Activate';
          button.innerHTML = `<i class="fas ${newStatus ? 'fa-pause' : 'fa-play'}"></i>`;
          
          // Update status badge
          const statusBadge = itemElement.querySelector('.bg-red-100');
          if (newStatus && statusBadge) {
            statusBadge.remove();
          } else if (!newStatus && !statusBadge) {
            const badge = document.createElement('span');
            badge.className = 'ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded';
            badge.textContent = 'Inactive';
            itemElement.querySelector('.category-badge').parentElement.appendChild(badge);
          }
          
          itemElement.dataset.active = newStatus;
        }
        
        updateStats();
        showToast(`${contentType.name} ${newStatus ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Error toggling item status:', error);
      showToast('Failed to update status. Please try again.', 'error');
    }
  }

  /**
   * Delete item
   */
  async function deleteItem(itemId) {
    const item = getItemById(itemId);
    if (!item) return;

    const confirmDelete = confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${apiEndpoint}/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete item');

      // Remove from local state
      items = items.filter(item => item.id !== itemId);
      
      // Remove from DOM
      const itemElement = document.querySelector(`[data-id="${itemId}"]`);
      if (itemElement) {
        itemElement.remove();
      }
      
      updateStats();
      showToast(`${contentType.name} deleted successfully`);
      
      // Show empty state if no items left
      if (items.length === 0) {
        location.reload();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('Failed to delete item. Please try again.', 'error');
    }
  }

  /**
   * Save item (create or update)
   */
  async function saveItem(itemData) {
    const isUpdate = !!itemData.id;
    const url = isUpdate ? `${apiEndpoint}/${itemData.id}` : apiEndpoint;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        const error = new Error(errorData.details || errorData.error || 'Failed to save item');
        error.response = response;
        error.data = errorData;
        throw error;
      }

      const savedItem = await response.json();
      
      if (isUpdate) {
        // Update in local state
        const index = items.findIndex(item => item.id === savedItem.id);
        if (index !== -1) {
          items[index] = savedItem;
        }
      } else {
        // Add to local state
        items.push(savedItem);
      }
      
      showToast(`${contentType.name} ${isUpdate ? 'updated' : 'created'} successfully`);
      
      // Reload to show updated data
      setTimeout(() => location.reload(), 1000);
      
      return savedItem;
    } catch (error) {
      console.error('Error saving item:', error);
      
      // Show detailed error message
      if (error.data) {
        console.error('Server error details:', error.data);
        if (error.data.validationErrors) {
          const fieldErrors = error.data.validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
          showToast(`Validation failed: ${fieldErrors}`, 'error');
        } else {
          showToast(`Failed to ${isUpdate ? 'update' : 'create'} item: ${error.data.details || error.data.error}`, 'error');
        }
      } else {
        showToast(`Failed to ${isUpdate ? 'update' : 'create'} item: ${error.message}`, 'error');
      }
      throw error;
    }
  }

  /**
   * Export items
   */
  function exportItems() {
    const dataStr = JSON.stringify(items, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${contentType.urlSlug}_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${items.length} ${contentType.pluralName.toLowerCase()}`);
  }

  /**
   * Import items
   */
  async function importItems(file) {
    try {
      const text = await file.text();
      const importedItems = JSON.parse(text);
      
      if (!Array.isArray(importedItems)) {
        throw new Error('Invalid file format');
      }

      const response = await fetch(`${apiEndpoint}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: importedItems })
      });

      if (!response.ok) throw new Error('Failed to import items');

      const result = await response.json();
      showToast(`Successfully imported ${result.count} ${contentType.pluralName.toLowerCase()}`);
      
      setTimeout(() => location.reload(), 1000);
    } catch (error) {
      console.error('Error importing items:', error);
      showToast('Failed to import items. Please check the file format.', 'error');
    }
  }

  /**
   * Show toast notification
   */
  function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Public API
  return {
    init,
    getAllItems,
    getItemById,
    getContentType,
    updateStats,
    toggleItemStatus,
    deleteItem,
    saveItem,
    exportItems,
    importItems,
    showToast
  };
})();