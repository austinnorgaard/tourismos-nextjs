/**
 * Google Calendar Sync Service
 * Syncs bookings with Google Calendar using the MCP Google Calendar integration
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
}

/**
 * Create a calendar event using MCP Google Calendar
 */
export async function createCalendarEvent(event: CalendarEvent): Promise<{ eventId: string; url: string }> {
  const input = JSON.stringify({
    summary: event.title,
    description: event.description || '',
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: 'UTC',
    },
    location: event.location || '',
    attendees: event.attendees?.map(email => ({ email })) || [],
  });

  try {
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call create_event --server google-calendar --input '${input.replace(/'/g, "\\'")}'`
    );
    
    const result = JSON.parse(stdout);
    return {
      eventId: result.id,
      url: result.htmlLink,
    };
  } catch (error) {
    console.error('[Calendar] Failed to create event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<void> {
  const input: any = { eventId };

  if (updates.title) input.summary = updates.title;
  if (updates.description !== undefined) input.description = updates.description;
  if (updates.startTime) {
    input.start = {
      dateTime: updates.startTime.toISOString(),
      timeZone: 'UTC',
    };
  }
  if (updates.endTime) {
    input.end = {
      dateTime: updates.endTime.toISOString(),
      timeZone: 'UTC',
    };
  }
  if (updates.location !== undefined) input.location = updates.location;
  if (updates.attendees) {
    input.attendees = updates.attendees.map(email => ({ email }));
  }

  try {
    await execAsync(
      `manus-mcp-cli tool call update_event --server google-calendar --input '${JSON.stringify(input).replace(/'/g, "\\'")}'`
    );
  } catch (error) {
    console.error('[Calendar] Failed to update event:', error);
    throw new Error('Failed to update calendar event');
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    await execAsync(
      `manus-mcp-cli tool call delete_event --server google-calendar --input '${JSON.stringify({ eventId }).replace(/'/g, "\\'")}'`
    );
  } catch (error) {
    console.error('[Calendar] Failed to delete event:', error);
    throw new Error('Failed to delete calendar event');
  }
}

/**
 * List calendar events in a date range
 */
export async function listCalendarEvents(startDate: Date, endDate: Date): Promise<any[]> {
  const input = JSON.stringify({
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    maxResults: 100,
  });

  try {
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call list_events --server google-calendar --input '${input.replace(/'/g, "\\'")}'`
    );
    
    const result = JSON.parse(stdout);
    return result.items || [];
  } catch (error) {
    console.error('[Calendar] Failed to list events:', error);
    return [];
  }
}

/**
 * Sync a booking to Google Calendar
 */
export async function syncBookingToCalendar(booking: {
  id: number;
  customerName: string;
  customerEmail: string;
  offeringName: string;
  bookingDate: Date;
  bookingTime?: string;
  durationMinutes?: number;
  location?: string;
  businessName: string;
  calendarEventId?: string;
}): Promise<string> {
  const startTime = new Date(booking.bookingDate);
  if (booking.bookingTime) {
    const [hours, minutes] = booking.bookingTime.split(':').map(Number);
    startTime.setHours(hours, minutes);
  }

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + (booking.durationMinutes || 60));

  const event: CalendarEvent = {
    title: `${booking.offeringName} - ${booking.customerName}`,
    description: `Booking for ${booking.offeringName}\nCustomer: ${booking.customerName}\nBusiness: ${booking.businessName}`,
    startTime,
    endTime,
    location: booking.location,
    attendees: [booking.customerEmail],
  };

  if (booking.calendarEventId) {
    // Update existing event
    await updateCalendarEvent(booking.calendarEventId, event);
    return booking.calendarEventId;
  } else {
    // Create new event
    const result = await createCalendarEvent(event);
    return result.eventId;
  }
}
