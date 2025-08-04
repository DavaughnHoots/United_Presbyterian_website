const InteractiveMapManager = {
    maps: [],
    locationCounter: 0,
    
    init() {
        this.loadMaps();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        // Modal close handlers
        $('#mapModal').on('hidden.bs.modal', () => {
            this.resetForm();
        });
        
        // Map URL preview
        const mapUrlInput = document.getElementById('mapUrl');
        if (mapUrlInput) {
            mapUrlInput.addEventListener('input', (e) => {
                this.updateMapPreview(e.target.value);
            });
        }
    },
    
    async loadMaps() {
        try {
            const response = await fetch('/admin/api/content/unified/search?type=interactive_map');
            this.maps = await response.json();
            this.filterMaps();
        } catch (error) {
            console.error('Error loading maps:', error);
            this.showAlert('Error loading interactive maps', 'danger');
        }
    },
    
    filterMaps() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const region = document.getElementById('regionFilter')?.value || '';
        const period = document.getElementById('periodFilter')?.value || '';
        
        const cards = document.querySelectorAll('.map-card');
        cards.forEach(card => {
            const title = card.dataset.title || '';
            const cardRegion = card.dataset.region || '';
            const cardPeriod = card.dataset.period || '';
            
            const matchesSearch = !searchTerm || title.includes(searchTerm);
            const matchesRegion = !region || cardRegion === region;
            const matchesPeriod = !period || cardPeriod === period;
            
            card.style.display = matchesSearch && matchesRegion && matchesPeriod ? '' : 'none';
        });
    },
    
    showCreateModal() {
        document.getElementById('modalTitle').textContent = 'Create Interactive Map';
        document.getElementById('mapId').value = '';
        this.resetForm();
        this.locationCounter = 0;
        this.addLocationInput(); // Add one location input by default
        $('#mapModal').modal('show');
    },
    
    async editMap(id) {
        try {
            const response = await fetch(`/admin/api/content/${id}`);
            const map = await response.json();
            
            document.getElementById('modalTitle').textContent = 'Edit Interactive Map';
            document.getElementById('mapId').value = map.id;
            document.getElementById('mapTitle').value = map.title || '';
            document.getElementById('mapContent').value = map.content || '';
            document.getElementById('mapUrl').value = map.map_url || '';
            document.getElementById('mapRegion').value = map.metadata?.region || '';
            document.getElementById('mapPeriod').value = map.metadata?.biblical_period || '';
            document.getElementById('mapEvents').value = map.metadata?.biblical_events || '';
            document.getElementById('mapTags').value = map.tags?.join(', ') || '';
            
            // Load locations
            this.locationCounter = 0;
            document.getElementById('locationsContainer').innerHTML = '';
            if (map.metadata?.locations && Array.isArray(map.metadata.locations)) {
                map.metadata.locations.forEach(location => {
                    this.addLocationInput(location);
                });
            } else {
                this.addLocationInput(); // Add one empty location input
            }
            
            // Update map preview
            if (map.map_url) {
                this.updateMapPreview(map.map_url);
            }
            
            $('#mapModal').modal('show');
        } catch (error) {
            console.error('Error loading map:', error);
            this.showAlert('Error loading interactive map', 'danger');
        }
    },
    
    addLocationInput(location = null) {
        this.locationCounter++;
        const container = document.getElementById('locationsContainer');
        
        const locationHtml = `
            <div class="location-input-group" id="location-${this.locationCounter}">
                <div class="form-row">
                    <div class="col-md-4">
                        <input type="text" class="form-control form-control-sm" 
                               placeholder="Location name" 
                               id="location-name-${this.locationCounter}"
                               value="${location?.name || ''}">
                    </div>
                    <div class="col-md-6">
                        <input type="text" class="form-control form-control-sm" 
                               placeholder="Description" 
                               id="location-desc-${this.locationCounter}"
                               value="${location?.description || ''}">
                    </div>
                    <div class="col-md-2">
                        <button type="button" class="btn btn-sm btn-danger" 
                                onclick="InteractiveMapManager.removeLocation(${this.locationCounter})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="form-row mt-1">
                    <div class="col-md-10">
                        <input type="text" class="form-control form-control-sm" 
                               placeholder="Coordinates (optional, e.g., 32.8806° N, 35.5751° E)" 
                               id="location-coords-${this.locationCounter}"
                               value="${location?.coordinates || ''}">
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', locationHtml);
    },
    
    removeLocation(id) {
        const element = document.getElementById(`location-${id}`);
        if (element) {
            element.remove();
        }
    },
    
    getLocations() {
        const locations = [];
        const locationGroups = document.querySelectorAll('.location-input-group');
        
        locationGroups.forEach(group => {
            const id = group.id.split('-')[1];
            const name = document.getElementById(`location-name-${id}`)?.value.trim();
            const description = document.getElementById(`location-desc-${id}`)?.value.trim();
            const coordinates = document.getElementById(`location-coords-${id}`)?.value.trim();
            
            if (name || description) {
                locations.push({
                    name: name || '',
                    description: description || '',
                    coordinates: coordinates || ''
                });
            }
        });
        
        return locations;
    },
    
    updateMapPreview(url) {
        const container = document.getElementById('mapPreviewContainer');
        
        if (!url) {
            container.innerHTML = '<p class="text-center text-muted" style="padding-top: 140px;">Enter a map URL to see preview</p>';
            return;
        }
        
        // Check if it's a Google Maps embed URL
        if (url.includes('google.com/maps/embed')) {
            container.innerHTML = `<iframe src="${url}" width="100%" height="300" frameborder="0" style="border:0;" allowfullscreen></iframe>`;
        } else {
            container.innerHTML = '<p class="text-center text-muted" style="padding-top: 140px;">Map preview will appear here for supported map URLs</p>';
        }
    },
    
    async saveMap() {
        const id = document.getElementById('mapId').value;
        const isNew = !id;
        
        const mapData = {
            type: 'interactive_map',
            title: document.getElementById('mapTitle').value.trim(),
            content: document.getElementById('mapContent').value.trim(),
            map_url: document.getElementById('mapUrl').value.trim(),
            tags: document.getElementById('mapTags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag),
            metadata: {
                region: document.getElementById('mapRegion').value,
                biblical_period: document.getElementById('mapPeriod').value,
                biblical_events: document.getElementById('mapEvents').value.trim(),
                locations: this.getLocations()
            }
        };
        
        // Validate required fields
        if (!mapData.title || !mapData.content) {
            this.showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        try {
            const url = isNew ? '/admin/api/content' : `/admin/api/content/${id}`;
            const method = isNew ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mapData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save map');
            }
            
            this.showAlert(`Interactive map ${isNew ? 'created' : 'updated'} successfully`, 'success');
            $('#mapModal').modal('hide');
            
            // Reload the page to show changes
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            console.error('Error saving map:', error);
            this.showAlert('Error saving interactive map', 'danger');
        }
    },
    
    async deleteMap(id) {
        if (!confirm('Are you sure you want to delete this interactive map?')) {
            return;
        }
        
        try {
            const response = await fetch(`/admin/api/content/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete map');
            }
            
            this.showAlert('Interactive map deleted successfully', 'success');
            
            // Remove the card from the DOM
            const card = document.querySelector(`[data-id="${id}"]`);
            if (card) {
                card.remove();
            }
        } catch (error) {
            console.error('Error deleting map:', error);
            this.showAlert('Error deleting interactive map', 'danger');
        }
    },
    
    async previewMap(id) {
        try {
            const response = await fetch(`/admin/api/content/${id}`);
            const map = await response.json();
            
            let previewHtml = `
                <h4>${map.title}</h4>
                ${map.metadata?.region ? `<p class="text-muted"><i class="fas fa-globe"></i> ${map.metadata.region}</p>` : ''}
                ${map.metadata?.biblical_period ? `<p class="text-muted"><i class="fas fa-clock"></i> ${map.metadata.biblical_period}</p>` : ''}
                <hr>
                <p>${map.content}</p>
            `;
            
            if (map.map_url) {
                previewHtml += '<hr><div class="mb-3">';
                if (map.map_url.includes('google.com/maps/embed')) {
                    previewHtml += `<iframe src="${map.map_url}" width="100%" height="400" frameborder="0" style="border:0;" allowfullscreen></iframe>`;
                } else {
                    previewHtml += `<p class="alert alert-info">Map URL: <a href="${map.map_url}" target="_blank">${map.map_url}</a></p>`;
                }
                previewHtml += '</div>';
            }
            
            if (map.metadata?.locations && map.metadata.locations.length > 0) {
                previewHtml += `
                    <hr>
                    <h5>Locations:</h5>
                    <ul class="list-group">
                `;
                map.metadata.locations.forEach(location => {
                    previewHtml += `
                        <li class="list-group-item">
                            <strong>${location.name}</strong>
                            ${location.description ? `<br><small class="text-muted">${location.description}</small>` : ''}
                            ${location.coordinates ? `<br><small class="text-info"><i class="fas fa-map-pin"></i> ${location.coordinates}</small>` : ''}
                        </li>
                    `;
                });
                previewHtml += '</ul>';
            }
            
            if (map.metadata?.biblical_events) {
                previewHtml += `
                    <hr>
                    <p><strong>Biblical Events:</strong> ${map.metadata.biblical_events}</p>
                `;
            }
            
            document.getElementById('previewContent').innerHTML = previewHtml;
            $('#previewModal').modal('show');
        } catch (error) {
            console.error('Error previewing map:', error);
            this.showAlert('Error loading preview', 'danger');
        }
    },
    
    showImportModal() {
        this.switchImportTab('paste');
        $('#importModal').modal('show');
    },
    
    switchImportTab(tab) {
        // Update tab buttons
        document.querySelectorAll('#importModal .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Show/hide content
        document.getElementById('pasteImportContent').classList.toggle('hidden', tab !== 'paste');
        document.getElementById('exampleImportContent').classList.toggle('hidden', tab !== 'example');
    },
    
    async importMaps() {
        const importData = document.getElementById('importData').value.trim();
        
        if (!importData) {
            this.showAlert('Please paste the JSON data to import', 'warning');
            return;
        }
        
        try {
            const maps = JSON.parse(importData);
            
            if (!Array.isArray(maps)) {
                throw new Error('Invalid format: expected an array of maps');
            }
            
            let imported = 0;
            let errors = 0;
            
            for (const map of maps) {
                try {
                    const mapData = {
                        type: 'interactive_map',
                        title: map.title,
                        content: map.content,
                        map_url: map.map_url || '',
                        tags: map.tags || [],
                        metadata: {
                            region: map.region || '',
                            biblical_period: map.biblical_period || '',
                            biblical_events: map.biblical_events || '',
                            locations: map.locations || []
                        }
                    };
                    
                    const response = await fetch('/admin/api/content', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(mapData)
                    });
                    
                    if (response.ok) {
                        imported++;
                    } else {
                        errors++;
                    }
                } catch (error) {
                    console.error('Error importing map:', error);
                    errors++;
                }
            }
            
            this.showAlert(`Import complete: ${imported} maps imported${errors > 0 ? `, ${errors} errors` : ''}`, 
                         errors > 0 ? 'warning' : 'success');
            
            if (imported > 0) {
                $('#importModal').modal('hide');
                setTimeout(() => location.reload(), 2000);
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showAlert('Invalid JSON format', 'danger');
        }
    },
    
    async exportMaps() {
        try {
            const response = await fetch('/admin/api/content/unified/search?type=interactive_map');
            const maps = await response.json();
            
            const exportData = maps.map(map => ({
                title: map.title,
                content: map.content,
                map_url: map.map_url || '',
                region: map.metadata?.region || '',
                biblical_period: map.metadata?.biblical_period || '',
                biblical_events: map.metadata?.biblical_events || '',
                locations: map.metadata?.locations || [],
                tags: map.tags || []
            }));
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `interactive_maps_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            this.showAlert('Error exporting maps', 'danger');
        }
    },
    
    resetForm() {
        document.getElementById('mapForm').reset();
        document.getElementById('locationsContainer').innerHTML = '';
        document.getElementById('mapPreviewContainer').innerHTML = 
            '<p class="text-center text-muted" style="padding-top: 140px;">Enter a map URL to see preview</p>';
        this.locationCounter = 0;
    },
    
    showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="close" data-dismiss="alert">
                    <span>&times;</span>
                </button>
            </div>
        `;
        
        const container = document.querySelector('.container');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = alertHtml;
        container.insertBefore(tempDiv.firstChild, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            $('.alert').alert('close');
        }, 5000);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    InteractiveMapManager.init();
});