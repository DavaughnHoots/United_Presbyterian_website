/**
 * Utility functions for handling recurring events
 */

/**
 * Generate occurrences for a recurring event within a date range
 * @param {Object} event - The recurring event object
 * @param {Date} rangeStart - Start of the date range
 * @param {Date} rangeEnd - End of the date range
 * @returns {Array} Array of event occurrences
 */
function generateRecurringOccurrences(event, rangeStart, rangeEnd) {
  const occurrences = [];
  
  if (!event.isRecurring || !event.recurrencePattern) {
    return occurrences;
  }
  
  // Parse the original event dates - ensure we maintain local time
  const originalStart = new Date(event.startDate);
  const originalEnd = new Date(event.endDate || event.startDate);
  const duration = originalEnd - originalStart;
  
  // Store the original time components to preserve them
  const originalHours = originalStart.getHours();
  const originalMinutes = originalStart.getMinutes();
  
  // Set the recurrence end date (default to 1 year from start if not specified)
  const recurrenceEnd = event.recurrenceEnd 
    ? new Date(event.recurrenceEnd) 
    : new Date(originalStart.getTime() + (365 * 24 * 60 * 60 * 1000));
    
  // Ensure we don't generate occurrences beyond the recurrence end
  const effectiveRangeEnd = new Date(Math.min(rangeEnd.getTime(), recurrenceEnd.getTime()));
  
  // Start generating from the original start date or range start, whichever is later
  let currentDate = new Date(originalStart);
  if (currentDate < rangeStart) {
    // Fast forward to the range start
    currentDate = fastForwardToRangeStart(currentDate, rangeStart, event.recurrencePattern);
  }
  
  // Generate occurrences
  while (currentDate <= effectiveRangeEnd) {
    const occurrenceEnd = new Date(currentDate.getTime() + duration);
    
    // Check if this occurrence falls within our range
    if (occurrenceEnd >= rangeStart && currentDate <= rangeEnd) {
      // Create dates preserving the original time
      const occurrenceStart = new Date(currentDate);
      occurrenceStart.setHours(originalHours, originalMinutes, 0, 0);
      
      const occurrenceEndDate = new Date(occurrenceStart.getTime() + duration);
      
      occurrences.push({
        ...event,
        startDate: occurrenceStart,
        endDate: occurrenceEndDate,
        originalEventId: event.id,
        isRecurringInstance: true
      });
    }
    
    // Move to next occurrence
    currentDate = getNextOccurrenceDate(currentDate, event.recurrencePattern);
    
    // Safety check to prevent infinite loops
    if (occurrences.length > 365) break;
  }
  
  return occurrences;
}

/**
 * Fast forward a date to the start of a range based on recurrence pattern
 */
function fastForwardToRangeStart(date, rangeStart, pattern) {
  const current = new Date(date);
  const daysDiff = Math.floor((rangeStart - current) / (24 * 60 * 60 * 1000));
  
  switch (pattern) {
    case 'daily':
      current.setDate(current.getDate() + daysDiff);
      break;
    case 'weekly':
      const weeksDiff = Math.floor(daysDiff / 7);
      current.setDate(current.getDate() + (weeksDiff * 7));
      break;
    case 'biweekly':
      const biweeksDiff = Math.floor(daysDiff / 14);
      current.setDate(current.getDate() + (biweeksDiff * 14));
      break;
    case 'monthly':
      const monthsDiff = Math.floor(daysDiff / 30);
      current.setMonth(current.getMonth() + monthsDiff);
      break;
  }
  
  return current;
}

/**
 * Get the next occurrence date based on recurrence pattern
 */
function getNextOccurrenceDate(currentDate, pattern) {
  const next = new Date(currentDate);
  
  switch (pattern) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      // Add one month, handling edge cases
      const day = next.getDate();
      const originalMonth = next.getMonth();
      next.setMonth(next.getMonth() + 1);
      
      // If the day changed (e.g., Jan 31 -> Feb 28), use the last valid day
      if (next.getDate() !== day) {
        next.setDate(0); // Go to last day of previous month
      }
      
      // Ensure we actually moved to the next month
      if (next.getMonth() === originalMonth) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
  }
  
  return next;
}

/**
 * Get the next occurrence of a recurring event from today
 */
function getNextOccurrence(event) {
  if (!event.isRecurring) {
    return null;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const originalStart = new Date(event.startDate);
  const originalEnd = new Date(event.endDate || event.startDate);
  const duration = originalEnd - originalStart;
  
  // If the original event is in the future, return it
  if (originalStart >= today) {
    return {
      startDate: originalStart,
      endDate: originalEnd
    };
  }
  
  // Find the next occurrence
  let currentDate = new Date(originalStart);
  const recurrenceEnd = event.recurrenceEnd 
    ? new Date(event.recurrenceEnd) 
    : new Date(originalStart.getTime() + (365 * 24 * 60 * 60 * 1000));
  
  while (currentDate < today && currentDate <= recurrenceEnd) {
    currentDate = getNextOccurrenceDate(currentDate, event.recurrencePattern);
  }
  
  if (currentDate > recurrenceEnd) {
    return null;
  }
  
  return {
    startDate: currentDate,
    endDate: new Date(currentDate.getTime() + duration)
  };
}

module.exports = {
  generateRecurringOccurrences,
  getNextOccurrence
};