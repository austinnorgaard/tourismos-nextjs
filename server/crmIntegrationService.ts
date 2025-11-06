/**
 * CRM Integration Service
 * Integrates with Salesforce, HubSpot, and other CRM platforms
 */

interface CRMContact {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

interface CRMDeal {
  id?: string;
  name: string;
  amount: number;
  stage: string;
  contactId: string;
  closeDate?: Date;
  probability?: number;
}

interface CRMActivity {
  type: 'email' | 'call' | 'meeting' | 'note';
  subject: string;
  description: string;
  contactId: string;
  date: Date;
}

/**
 * Salesforce Integration
 */
export class SalesforceIntegration {
  private accessToken?: string;
  private instanceUrl?: string;

  constructor(accessToken?: string, instanceUrl?: string) {
    this.accessToken = accessToken;
    this.instanceUrl = instanceUrl;
  }

  /**
   * Create or update contact in Salesforce
   */
  async upsertContact(contact: CRMContact): Promise<{ contactId: string }> {
    if (!this.accessToken || !this.instanceUrl) {
      throw new Error('Salesforce not connected');
    }

    console.log('[Salesforce] Upserting contact:', contact);

    // In production, use Salesforce REST API
    // const response = await fetch(`${this.instanceUrl}/services/data/v58.0/sobjects/Contact`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     FirstName: contact.firstName,
    //     LastName: contact.lastName,
    //     Email: contact.email,
    //     Phone: contact.phone,
    //     Company: contact.company,
    //   }),
    // });

    return {
      contactId: 'sf_' + Date.now(),
    };
  }

  /**
   * Create opportunity (deal) in Salesforce
   */
  async createDeal(deal: CRMDeal): Promise<{ dealId: string }> {
    if (!this.accessToken || !this.instanceUrl) {
      throw new Error('Salesforce not connected');
    }

    console.log('[Salesforce] Creating opportunity:', deal);

    return {
      dealId: 'sf_opp_' + Date.now(),
    };
  }

  /**
   * Log activity in Salesforce
   */
  async logActivity(activity: CRMActivity): Promise<{ activityId: string }> {
    if (!this.accessToken || !this.instanceUrl) {
      throw new Error('Salesforce not connected');
    }

    console.log('[Salesforce] Logging activity:', activity);

    return {
      activityId: 'sf_act_' + Date.now(),
    };
  }
}

/**
 * HubSpot Integration
 */
export class HubSpotIntegration {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create or update contact in HubSpot
   */
  async upsertContact(contact: CRMContact): Promise<{ contactId: string }> {
    if (!this.apiKey) {
      throw new Error('HubSpot not connected');
    }

    console.log('[HubSpot] Upserting contact:', contact);

    // In production, use HubSpot API
    // const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     properties: {
    //       firstname: contact.firstName,
    //       lastname: contact.lastName,
    //       email: contact.email,
    //       phone: contact.phone,
    //       company: contact.company,
    //     },
    //   }),
    // });

    return {
      contactId: 'hs_' + Date.now(),
    };
  }

  /**
   * Create deal in HubSpot
   */
  async createDeal(deal: CRMDeal): Promise<{ dealId: string }> {
    if (!this.apiKey) {
      throw new Error('HubSpot not connected');
    }

    console.log('[HubSpot] Creating deal:', deal);

    return {
      dealId: 'hs_deal_' + Date.now(),
    };
  }

  /**
   * Log activity in HubSpot
   */
  async logActivity(activity: CRMActivity): Promise<{ activityId: string }> {
    if (!this.apiKey) {
      throw new Error('HubSpot not connected');
    }

    console.log('[HubSpot] Logging activity:', activity);

    return {
      activityId: 'hs_act_' + Date.now(),
    };
  }

  /**
   * Add contact to list/segment
   */
  async addToList(contactId: string, listId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('HubSpot not connected');
    }

    console.log('[HubSpot] Adding contact to list:', { contactId, listId });
  }
}

/**
 * Generic CRM service that routes to the appropriate provider
 */
export class CRMService {
  private provider: 'salesforce' | 'hubspot' | null = null;
  private salesforce?: SalesforceIntegration;
  private hubspot?: HubSpotIntegration;

  constructor(config: {
    provider: 'salesforce' | 'hubspot';
    accessToken?: string;
    instanceUrl?: string; // Salesforce
    apiKey?: string; // HubSpot
  }) {
    this.provider = config.provider;

    if (config.provider === 'salesforce') {
      this.salesforce = new SalesforceIntegration(config.accessToken, config.instanceUrl);
    } else if (config.provider === 'hubspot') {
      this.hubspot = new HubSpotIntegration(config.apiKey);
    }
  }

  /**
   * Sync customer to CRM
   */
  async syncCustomer(customer: {
    name: string;
    email: string;
    phone?: string;
    totalBookings: number;
    totalSpent: number;
    lastBookingDate?: Date;
  }): Promise<{ contactId: string }> {
    const [firstName, ...lastNameParts] = customer.name.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    const contact: CRMContact = {
      firstName,
      lastName,
      email: customer.email,
      phone: customer.phone,
      tags: ['TourismOS Customer'],
      customFields: {
        total_bookings: customer.totalBookings,
        total_spent: customer.totalSpent / 100,
        last_booking_date: customer.lastBookingDate?.toISOString(),
      },
    };

    if (this.provider === 'salesforce' && this.salesforce) {
      return this.salesforce.upsertContact(contact);
    } else if (this.provider === 'hubspot' && this.hubspot) {
      return this.hubspot.upsertContact(contact);
    }

    throw new Error('No CRM provider configured');
  }

  /**
   * Create deal/opportunity for booking
   */
  async createBookingDeal(booking: {
    id: number;
    customerName: string;
    customerEmail: string;
    offeringName: string;
    totalAmount: number;
    bookingDate: Date;
    status: string;
  }): Promise<{ dealId: string }> {
    // First, sync customer
    const { contactId } = await this.syncCustomer({
      name: booking.customerName,
      email: booking.customerEmail,
      totalBookings: 1,
      totalSpent: booking.totalAmount,
      lastBookingDate: booking.bookingDate,
    });

    // Then create deal
    const deal: CRMDeal = {
      name: `${booking.offeringName} - ${booking.customerName}`,
      amount: booking.totalAmount / 100,
      stage: booking.status === 'confirmed' ? 'Closed Won' : 'Proposal',
      contactId,
      closeDate: booking.bookingDate,
      probability: booking.status === 'confirmed' ? 100 : 50,
    };

    if (this.provider === 'salesforce' && this.salesforce) {
      return this.salesforce.createDeal(deal);
    } else if (this.provider === 'hubspot' && this.hubspot) {
      return this.hubspot.createDeal(deal);
    }

    throw new Error('No CRM provider configured');
  }

  /**
   * Log customer interaction
   */
  async logInteraction(interaction: {
    customerEmail: string;
    type: 'email' | 'call' | 'meeting' | 'note';
    subject: string;
    description: string;
  }): Promise<void> {
    // Get contact ID (simplified - in production, search by email)
    const contactId = 'contact_' + Date.now();

    const activity: CRMActivity = {
      type: interaction.type,
      subject: interaction.subject,
      description: interaction.description,
      contactId,
      date: new Date(),
    };

    if (this.provider === 'salesforce' && this.salesforce) {
      await this.salesforce.logActivity(activity);
    } else if (this.provider === 'hubspot' && this.hubspot) {
      await this.hubspot.logActivity(activity);
    }
  }

  /**
   * Segment customers based on criteria
   */
  async segmentCustomers(criteria: {
    minBookings?: number;
    minSpent?: number;
    lastBookingDaysAgo?: number;
    tags?: string[];
  }): Promise<string[]> {
    console.log(`[CRM] Segmenting customers with criteria:`, criteria);

    // In production, query CRM for matching contacts
    return [];
  }

  /**
   * Get customer lifetime value
   */
  async getCustomerLifetimeValue(email: string): Promise<number> {
    console.log(`[CRM] Getting lifetime value for ${email}`);

    // In production, query CRM for customer data
    return 0;
  }
}

/**
 * Helper function to determine customer lifecycle stage
 */
export function getCustomerStage(bookingCount: number, daysSinceLastBooking: number): string {
  if (bookingCount === 0) return 'Lead';
  if (bookingCount === 1 && daysSinceLastBooking < 30) return 'New Customer';
  if (bookingCount > 1 && daysSinceLastBooking < 90) return 'Active Customer';
  if (daysSinceLastBooking >= 90 && daysSinceLastBooking < 180) return 'At Risk';
  if (daysSinceLastBooking >= 180) return 'Inactive';
  return 'Unknown';
}

/**
 * Helper function to calculate customer health score
 */
export function calculateHealthScore(customer: {
  bookingCount: number;
  totalSpent: number;
  daysSinceLastBooking: number;
  averageRating?: number;
}): number {
  let score = 0;

  // Booking frequency (0-40 points)
  score += Math.min(customer.bookingCount * 5, 40);

  // Spending (0-30 points)
  score += Math.min((customer.totalSpent / 100000) * 30, 30);

  // Recency (0-20 points)
  if (customer.daysSinceLastBooking < 30) score += 20;
  else if (customer.daysSinceLastBooking < 90) score += 15;
  else if (customer.daysSinceLastBooking < 180) score += 10;
  else score += 5;

  // Rating (0-10 points)
  if (customer.averageRating) {
    score += (customer.averageRating / 5) * 10;
  }

  return Math.min(Math.round(score), 100);
}
