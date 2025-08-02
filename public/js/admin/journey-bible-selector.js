/**
 * Journey Bible Selector Module
 * Handles Bible verse selection functionality
 */

window.JourneyEditor = window.JourneyEditor || {};
JourneyEditor.BibleSelector = {};

(function(BibleSelector) {
  'use strict';

  // Private variables
  let selectedVerseData = null;

  /**
   * Load Bible books
   */
  BibleSelector.loadBibleBooks = async function() {
    try {
      const response = await fetch('/admin/api/bible/books');
      const books = await response.json();
      
      const select = document.getElementById('bibleBook');
      if (!select) return;
      
      select.innerHTML = '<option value="">Select Book...</option>';
      
      books.forEach(book => {
        const option = document.createElement('option');
        option.value = book.id;
        option.textContent = book.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading Bible books:', error);
      JourneyEditor.showMessage('Failed to load Bible books', 'error');
    }
  };

  /**
   * Load chapters for selected book
   */
  BibleSelector.loadChapters = async function() {
    const bookId = document.getElementById('bibleBook').value;
    if (!bookId) return;
    
    try {
      const response = await fetch(`/admin/api/bible/chapters/${bookId}`);
      const data = await response.json();
      
      const select = document.getElementById('bibleChapter');
      if (!select) return;
      
      select.innerHTML = '<option value="">Select Chapter...</option>';
      select.disabled = false;
      
      for (let i = 1; i <= data.chapterCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Chapter ${i}`;
        select.appendChild(option);
      }
      
      // Reset verses
      const versesInput = document.getElementById('bibleVerses');
      if (versesInput) {
        versesInput.value = '';
        versesInput.disabled = true;
      }
      
      const preview = document.getElementById('versePreview');
      if (preview) {
        preview.innerHTML = '<p class="text-muted">Select a passage to preview</p>';
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
      JourneyEditor.showMessage('Failed to load chapters', 'error');
    }
  };

  /**
   * Enable verse input after chapter selection
   */
  BibleSelector.loadVerses = function() {
    const bookId = document.getElementById('bibleBook').value;
    const chapter = document.getElementById('bibleChapter').value;
    
    if (!bookId || !chapter) return;
    
    const versesInput = document.getElementById('bibleVerses');
    if (versesInput) {
      versesInput.disabled = false;
      versesInput.focus();
      
      // Add event listener for verse input
      versesInput.oninput = BibleSelector.loadVersePreview;
    }
  };

  /**
   * Load and preview selected verses
   */
  BibleSelector.loadVersePreview = async function() {
    const bookId = document.getElementById('bibleBook').value;
    const chapter = document.getElementById('bibleChapter').value;
    const verseRange = document.getElementById('bibleVerses').value;
    
    if (!bookId || !chapter || !verseRange) return;
    
    try {
      const response = await fetch(`/admin/api/bible/verses/${bookId}/${chapter}?verses=${verseRange}`);
      const data = await response.json();
      
      if (data.verses && data.verses.length > 0) {
        const preview = document.getElementById('versePreview');
        if (preview) {
          preview.innerHTML = `
            <h5>${data.bookName} ${chapter}:${verseRange}</h5>
            <p>${data.verses.map(v => `<strong>${v.verse}.</strong> ${v.text}`).join(' ')}</p>
          `;
        }
        
        // Store selected content
        selectedVerseData = {
          type: 'bible_verse',
          id: `${bookId}-${chapter}-${verseRange}`,
          title: `${data.bookName} ${chapter}:${verseRange}`,
          content: data.verses.map(v => v.text).join(' '),
          metadata: {
            bookId: bookId,
            bookName: data.bookName,
            chapter: chapter,
            verses: verseRange,
            verseData: data.verses
          }
        };
      }
    } catch (error) {
      console.error('Error loading verse preview:', error);
      JourneyEditor.showMessage('Failed to load verse preview', 'error');
    }
  };

  /**
   * Get selected content
   * @returns {Object|null} Selected verse data
   */
  BibleSelector.getSelectedContent = function() {
    return selectedVerseData;
  };

  /**
   * Reset Bible selector
   */
  BibleSelector.reset = function() {
    const bookSelect = document.getElementById('bibleBook');
    const chapterSelect = document.getElementById('bibleChapter');
    const versesInput = document.getElementById('bibleVerses');
    const preview = document.getElementById('versePreview');
    
    if (bookSelect) bookSelect.value = '';
    if (chapterSelect) {
      chapterSelect.value = '';
      chapterSelect.disabled = true;
    }
    if (versesInput) {
      versesInput.value = '';
      versesInput.disabled = true;
    }
    if (preview) {
      preview.innerHTML = '<p class="text-muted">Select a passage to preview</p>';
    }
    
    selectedVerseData = null;
  };

  /**
   * Load Bible selector from content ID
   * @param {string} contentId - Content ID in format: bookId-chapter-verseRange
   */
  BibleSelector.loadFromContentId = async function(contentId) {
    if (!contentId || typeof contentId !== 'string') return;
    
    const parts = contentId.split('-');
    if (parts.length < 3) return;
    
    const bookId = parts[0];
    const chapter = parts[1];
    const verseRange = parts.slice(2).join('-');
    
    // Set book
    const bookSelect = document.getElementById('bibleBook');
    if (bookSelect) {
      bookSelect.value = bookId;
      
      // Load chapters
      await BibleSelector.loadChapters();
      
      // Set chapter
      const chapterSelect = document.getElementById('bibleChapter');
      if (chapterSelect) {
        chapterSelect.value = chapter;
        chapterSelect.disabled = false;
        
        // Enable verses
        await BibleSelector.loadVerses();
        
        // Set verses
        const versesInput = document.getElementById('bibleVerses');
        if (versesInput) {
          versesInput.value = verseRange;
          versesInput.disabled = false;
          
          // Load preview
          await BibleSelector.loadVersePreview();
        }
      }
    }
  };

  // Expose functions globally
  window.JourneyEditor.BibleSelector = BibleSelector;

})(JourneyEditor.BibleSelector);