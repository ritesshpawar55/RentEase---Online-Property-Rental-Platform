/**
 * Subscribes to real-time listing updates.
 * Uses native EventSource to connect to /api/properties/stream.
 * 
 * @param {Function} onNewListing callback function invoked when a new listing is published.
 * @returns {Function} unsubscribe function to close the stream.
 */
export const subscribeToListingsStream = (onNewListing) => {
  const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/properties/stream`;
  const eventSource = new EventSource(url);

eventSource.addEventListener('new-listing', (event) => {
  try {
    const listing = JSON.parse(event.data)
    onNewListing(listing)
  } catch (err) {
    console.error('SSE Message parsing failed:', err)
  }
})

  eventSource.onerror = (err) => {
    console.error('SSE Error occurred:', err)
    // Don't close — browser auto-reconnects EventSource
    // Only close if readyState is CLOSED
    if (eventSource.readyState === EventSource.CLOSED) {
      eventSource.close()
    }
  }

  return () => {
    eventSource.close();
  };
};

/**
 * Subscribes to real-time status updates for a specific booking request.
 * Useful for tracking accepted/rejected/negotiated changes.
 * 
 * @param {Function} onStatusUpdate callback function invoked when booking details are changed.
 * @returns {Function} unsubscribe function.
 */
export const subscribeToBookingStream = (onStatusUpdate) => {
  const token = localStorage.getItem('rentease_token');
  const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/bookings/stream?token=${encodeURIComponent(token || '')}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const update = JSON.parse(event.data);
      onStatusUpdate(update);
    } catch (err) {
      console.error('SSE Booking Message parsing failed:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.error('SSE Booking Stream Error occurred:', err);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
};
