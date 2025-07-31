// Timezone utilities for handling EST/EDT conversions

// Get current time in Eastern Time
function getEasternTime() {
  const now = new Date();
  // Convert to Eastern Time using toLocaleString
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  return easternTime;
}

// Convert a date/time to Eastern Time
function toEasternTime(date) {
  if (!date) return null;
  const d = new Date(date);
  // Get the date string in Eastern timezone
  const easternString = d.toLocaleString("en-US", {timeZone: "America/New_York"});
  return new Date(easternString);
}

// Create a date in Eastern Time from date string and time string
function createEasternDateTime(dateStr, timeStr) {
  // Create date at noon to avoid DST issues
  const date = new Date(dateStr + 'T12:00:00');
  
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':');
    // Create a date string in Eastern Time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Create date string with time
    const dateTimeStr = `${year}-${month}-${day} ${hours}:${minutes}:00`;
    
    // Parse in Eastern Time
    const easternDate = new Date(dateTimeStr + ' EST');
    
    // Return the UTC equivalent
    return new Date(easternDate.toLocaleString("en-US", {timeZone: "UTC"}));
  }
  
  return date;
}

// Check if a date/time is in Eastern Time DST
function isEasternDST(date) {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const janOffset = jan.getTimezoneOffset();
  const julOffset = jul.getTimezoneOffset();
  const dateOffset = date.getTimezoneOffset();
  
  return Math.max(janOffset, julOffset) !== dateOffset;
}

// Get timezone offset for Eastern Time
function getEasternOffset(date) {
  // EST is UTC-5, EDT is UTC-4
  return isEasternDST(date) ? -4 : -5;
}

// Convert event times to Eastern Time
function convertEventToEastern(event) {
  const eventCopy = { ...event };
  
  if (eventCopy.startDate) {
    eventCopy.startDate = toEasternTime(eventCopy.startDate);
  }
  
  if (eventCopy.endDate) {
    eventCopy.endDate = toEasternTime(eventCopy.endDate);
  }
  
  return eventCopy;
}

module.exports = {
  getEasternTime,
  toEasternTime,
  createEasternDateTime,
  isEasternDST,
  getEasternOffset,
  convertEventToEastern
};