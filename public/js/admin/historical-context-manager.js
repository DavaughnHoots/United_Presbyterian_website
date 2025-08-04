const HistoricalContextManager = {
    historicalContexts: [],
    
    init() {
        this.loadHistoricalContexts();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        // Modal close handlers
        $('#historicalContextModal').on('hidden.bs.modal', () => {
            this.resetForm();
        });
        
        // Map URL preview
        const mapUrlInput = document.getElementById('contextMapUrl');
        if (mapUrlInput) {
            mapUrlInput.addEventListener('input', (e) => {
                this.updateMapPreview(e.target.value);
            });
        }
    },
    
    async loadHistoricalContexts() {
        try {
            const response = await fetch('/admin/api/content/unified/search?type=historical_context');
            this.historicalContexts = await response.json();
            this.filterHistoricalContexts();
        } catch (error) {
            console.error('Error loading historical contexts:', error);
            this.showAlert('Error loading historical contexts', 'danger');
        }
    },
    
    filterHistoricalContexts() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const timePeriod = document.getElementById('timePeriodFilter')?.value || '';
        const theme = document.getElementById('themeFilter')?.value || '';
        
        const cards = document.querySelectorAll('.content-card');
        cards.forEach(card => {
            const title = card.dataset.title || '';
            const cardTimePeriod = card.dataset.timePeriod || '';
            const cardTheme = card.dataset.theme || '';
            
            const matchesSearch = !searchTerm || title.includes(searchTerm);
            const matchesTimePeriod = !timePeriod || cardTimePeriod === timePeriod;
            const matchesTheme = !theme || cardTheme === theme;
            
            card.style.display = matchesSearch && matchesTimePeriod && matchesTheme ? '' : 'none';
        });
    },
    
    showCreateModal() {
        document.getElementById('modalTitle').textContent = 'Create Historical Context';
        document.getElementById('contextId').value = '';
        this.resetForm();
        $('#historicalContextModal').modal('show');
    },
    
    async editHistoricalContext(id) {
        try {
            const response = await fetch(`/admin/api/content/${id}`);
            const context = await response.json();
            
            document.getElementById('modalTitle').textContent = 'Edit Historical Context';
            document.getElementById('contextId').value = context.id;
            document.getElementById('contextTitle').value = context.title || '';
            document.getElementById('contextContent').value = context.content || '';
            document.getElementById('contextTimePeriod').value = context.metadata?.time_period || '';
            document.getElementById('contextFigure').value = context.metadata?.figure || '';
            document.getElementById('contextRelatedHymn').value = context.metadata?.related_hymn || '';
            document.getElementById('contextBiblicalRef').value = context.metadata?.biblical_reference || '';
            document.getElementById('contextLocation').value = context.metadata?.location || '';
            document.getElementById('contextTheme').value = context.theme || '';
            document.getElementById('contextQuestions').value = context.metadata?.questions?.join('\n') || '';
            document.getElementById('contextTags').value = context.tags?.join(', ') || '';
            
            $('#historicalContextModal').modal('show');
        } catch (error) {
            console.error('Error loading historical context:', error);
            this.showAlert('Error loading historical context', 'danger');
        }
    },
    
    async saveHistoricalContext() {
        const id = document.getElementById('contextId').value;
        const isNew = !id;
        
        const contextData = {
            type: 'historical_context',
            title: document.getElementById('contextTitle').value.trim(),
            content: document.getElementById('contextContent').value.trim(),
            theme: document.getElementById('contextTheme').value,
            tags: document.getElementById('contextTags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag),
            metadata: {
                time_period: document.getElementById('contextTimePeriod').value.trim(),
                figure: document.getElementById('contextFigure').value.trim(),
                related_hymn: document.getElementById('contextRelatedHymn').value.trim(),
                biblical_reference: document.getElementById('contextBiblicalRef').value.trim(),
                location: document.getElementById('contextLocation').value.trim(),
                questions: document.getElementById('contextQuestions').value
                    .split('\n')
                    .map(q => q.trim())
                    .filter(q => q)
            }
        };
        
        // Validate required fields
        if (!contextData.title || !contextData.content) {
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
                body: JSON.stringify(contextData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save historical context');
            }
            
            this.showAlert(`Historical context ${isNew ? 'created' : 'updated'} successfully`, 'success');
            $('#historicalContextModal').modal('hide');
            
            // Reload the page to show changes
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            console.error('Error saving historical context:', error);
            this.showAlert('Error saving historical context', 'danger');
        }
    },
    
    async deleteHistoricalContext(id) {
        if (!confirm('Are you sure you want to delete this historical context?')) {
            return;
        }
        
        try {
            const response = await fetch(`/admin/api/content/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete historical context');
            }
            
            this.showAlert('Historical context deleted successfully', 'success');
            
            // Remove the card from the DOM
            const card = document.querySelector(`[data-id="${id}"]`);
            if (card) {
                card.remove();
            }
        } catch (error) {
            console.error('Error deleting historical context:', error);
            this.showAlert('Error deleting historical context', 'danger');
        }
    },
    
    async previewHistoricalContext(id) {
        try {
            const response = await fetch(`/admin/api/content/${id}`);
            const context = await response.json();
            
            let previewHtml = `
                <h4>${context.title}</h4>
                ${context.metadata?.time_period ? `<p class="text-muted"><i class="fas fa-clock"></i> ${context.metadata.time_period}</p>` : ''}
                ${context.metadata?.figure ? `<p class="text-muted"><i class="fas fa-user"></i> ${context.metadata.figure}</p>` : ''}
                <hr>
                <div style="white-space: pre-wrap;">${context.content}</div>
            `;
            
            if (context.metadata?.related_hymn || context.metadata?.biblical_reference || context.metadata?.location) {
                previewHtml += '<hr><div class="mt-3">';
                if (context.metadata.related_hymn) {
                    previewHtml += `<span class="badge badge-info mr-2"><i class="fas fa-music"></i> ${context.metadata.related_hymn}</span>`;
                }
                if (context.metadata.biblical_reference) {
                    previewHtml += `<span class="badge badge-secondary mr-2"><i class="fas fa-bible"></i> ${context.metadata.biblical_reference}</span>`;
                }
                if (context.metadata.location) {
                    previewHtml += `<span class="badge badge-primary"><i class="fas fa-map-marker-alt"></i> ${context.metadata.location}</span>`;
                }
                previewHtml += '</div>';
            }
            
            if (context.metadata?.questions && context.metadata.questions.length > 0) {
                previewHtml += `
                    <hr>
                    <h5 class="mt-3">Reflection Questions:</h5>
                    <ul>
                        ${context.metadata.questions.map(q => `<li>${q}</li>`).join('')}
                    </ul>
                `;
            }
            
            document.getElementById('previewContent').innerHTML = previewHtml;
            $('#previewModal').modal('show');
        } catch (error) {
            console.error('Error previewing historical context:', error);
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
    
    async importHistoricalContexts() {
        const importData = document.getElementById('importData').value.trim();
        
        if (!importData) {
            this.showAlert('Please paste the JSON data to import', 'warning');
            return;
        }
        
        try {
            const contexts = JSON.parse(importData);
            
            if (!Array.isArray(contexts)) {
                throw new Error('Invalid format: expected an array of historical contexts');
            }
            
            let imported = 0;
            let errors = 0;
            
            for (const context of contexts) {
                try {
                    const contextData = {
                        type: 'historical_context',
                        title: context.title,
                        content: context.content,
                        theme: context.theme,
                        tags: context.tags || [],
                        metadata: {
                            time_period: context.time_period || '',
                            figure: context.figure || '',
                            related_hymn: context.related_hymn || '',
                            biblical_reference: context.biblical_reference || '',
                            location: context.location || '',
                            questions: context.questions || []
                        }
                    };
                    
                    const response = await fetch('/admin/api/content', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(contextData)
                    });
                    
                    if (response.ok) {
                        imported++;
                    } else {
                        errors++;
                    }
                } catch (error) {
                    console.error('Error importing context:', error);
                    errors++;
                }
            }
            
            this.showAlert(`Import complete: ${imported} historical contexts imported${errors > 0 ? `, ${errors} errors` : ''}`, 
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
    
    async exportHistoricalContexts() {
        try {
            const response = await fetch('/admin/api/content/unified/search?type=historical_context');
            const contexts = await response.json();
            
            const exportData = contexts.map(context => ({
                title: context.title,
                content: context.content,
                time_period: context.metadata?.time_period || '',
                figure: context.metadata?.figure || '',
                related_hymn: context.metadata?.related_hymn || '',
                biblical_reference: context.metadata?.biblical_reference || '',
                location: context.metadata?.location || '',
                theme: context.theme || '',
                questions: context.metadata?.questions || [],
                tags: context.tags || []
            }));
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `historical_contexts_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            this.showAlert('Error exporting historical contexts', 'danger');
        }
    },
    
    resetForm() {
        document.getElementById('historicalContextForm').reset();
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
    HistoricalContextManager.init();
});