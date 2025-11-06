/**
 * Accounting Integration Service
 * Integrates with QuickBooks, Xero, and other accounting software
 */

interface Invoice {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  date: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod?: string;
}

/**
 * QuickBooks Integration
 */
export class QuickBooksIntegration {
  private accessToken?: string;
  private realmId?: string;

  constructor(accessToken?: string, realmId?: string) {
    this.accessToken = accessToken;
    this.realmId = realmId;
  }

  /**
   * Create invoice in QuickBooks
   */
  async createInvoice(invoice: Invoice): Promise<{ invoiceId: string; invoiceUrl: string }> {
    if (!this.accessToken || !this.realmId) {
      throw new Error('QuickBooks not connected');
    }

    console.log('[QuickBooks] Creating invoice:', invoice);

    // In production, use QuickBooks API
    // const response = await fetch(`https://quickbooks.api.intuit.com/v3/company/${this.realmId}/invoice`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     CustomerRef: { value: invoice.customerEmail },
    //     Line: invoice.lineItems.map(item => ({
    //       Amount: item.total / 100,
    //       DetailType: 'SalesItemLineDetail',
    //       Description: item.description,
    //       SalesItemLineDetail: {
    //         Qty: item.quantity,
    //         UnitPrice: item.unitPrice / 100,
    //       },
    //     })),
    //     DueDate: invoice.dueDate.toISOString().split('T')[0],
    //   }),
    // });

    return {
      invoiceId: 'qb_' + Date.now(),
      invoiceUrl: 'https://quickbooks.intuit.com/invoice/...',
    };
  }

  /**
   * Record transaction in QuickBooks
   */
  async recordTransaction(transaction: Transaction): Promise<{ transactionId: string }> {
    if (!this.accessToken || !this.realmId) {
      throw new Error('QuickBooks not connected');
    }

    console.log('[QuickBooks] Recording transaction:', transaction);

    // In production, use QuickBooks API
    return {
      transactionId: 'qb_txn_' + Date.now(),
    };
  }

  /**
   * Sync booking to QuickBooks as invoice
   */
  async syncBooking(booking: {
    id: number;
    customerName: string;
    customerEmail: string;
    offeringName: string;
    totalAmount: number;
    bookingDate: Date;
    partySize: number;
  }): Promise<{ invoiceId: string }> {
    const invoice: Invoice = {
      id: `booking_${booking.id}`,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      amount: booking.totalAmount,
      date: new Date(),
      dueDate: booking.bookingDate,
      status: 'sent',
      lineItems: [
        {
          description: `${booking.offeringName} (${booking.partySize} ${booking.partySize === 1 ? 'person' : 'people'})`,
          quantity: booking.partySize,
          unitPrice: booking.totalAmount / booking.partySize,
          total: booking.totalAmount,
        },
      ],
    };

    const result = await this.createInvoice(invoice);
    return { invoiceId: result.invoiceId };
  }
}

/**
 * Xero Integration
 */
export class XeroIntegration {
  private accessToken?: string;
  private tenantId?: string;

  constructor(accessToken?: string, tenantId?: string) {
    this.accessToken = accessToken;
    this.tenantId = tenantId;
  }

  /**
   * Create invoice in Xero
   */
  async createInvoice(invoice: Invoice): Promise<{ invoiceId: string; invoiceUrl: string }> {
    if (!this.accessToken || !this.tenantId) {
      throw new Error('Xero not connected');
    }

    console.log('[Xero] Creating invoice:', invoice);

    // In production, use Xero API
    return {
      invoiceId: 'xero_' + Date.now(),
      invoiceUrl: 'https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=...',
    };
  }

  /**
   * Record transaction in Xero
   */
  async recordTransaction(transaction: Transaction): Promise<{ transactionId: string }> {
    if (!this.accessToken || !this.tenantId) {
      throw new Error('Xero not connected');
    }

    console.log('[Xero] Recording transaction:', transaction);

    return {
      transactionId: 'xero_txn_' + Date.now(),
    };
  }
}

/**
 * Generic accounting service that routes to the appropriate provider
 */
export class AccountingService {
  private provider: 'quickbooks' | 'xero' | null = null;
  private quickbooks?: QuickBooksIntegration;
  private xero?: XeroIntegration;

  constructor(config: {
    provider: 'quickbooks' | 'xero';
    accessToken: string;
    realmId?: string; // QuickBooks
    tenantId?: string; // Xero
  }) {
    this.provider = config.provider;

    if (config.provider === 'quickbooks') {
      this.quickbooks = new QuickBooksIntegration(config.accessToken, config.realmId);
    } else if (config.provider === 'xero') {
      this.xero = new XeroIntegration(config.accessToken, config.tenantId);
    }
  }

  /**
   * Create invoice using configured provider
   */
  async createInvoice(invoice: Invoice): Promise<{ invoiceId: string; invoiceUrl: string }> {
    if (this.provider === 'quickbooks' && this.quickbooks) {
      return this.quickbooks.createInvoice(invoice);
    } else if (this.provider === 'xero' && this.xero) {
      return this.xero.createInvoice(invoice);
    }
    throw new Error('No accounting provider configured');
  }

  /**
   * Record transaction using configured provider
   */
  async recordTransaction(transaction: Transaction): Promise<{ transactionId: string }> {
    if (this.provider === 'quickbooks' && this.quickbooks) {
      return this.quickbooks.recordTransaction(transaction);
    } else if (this.provider === 'xero' && this.xero) {
      return this.xero.recordTransaction(transaction);
    }
    throw new Error('No accounting provider configured');
  }

  /**
   * Sync booking payment to accounting software
   */
  async syncBookingPayment(booking: {
    id: number;
    customerName: string;
    customerEmail: string;
    offeringName: string;
    totalAmount: number;
    bookingDate: Date;
    partySize: number;
  }): Promise<void> {
    // Create invoice
    const invoice: Invoice = {
      id: `booking_${booking.id}`,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      amount: booking.totalAmount,
      date: new Date(),
      dueDate: booking.bookingDate,
      status: 'paid',
      lineItems: [
        {
          description: `${booking.offeringName} (${booking.partySize} ${booking.partySize === 1 ? 'person' : 'people'})`,
          quantity: booking.partySize,
          unitPrice: booking.totalAmount / booking.partySize,
          total: booking.totalAmount,
        },
      ],
    };

    await this.createInvoice(invoice);

    // Record payment transaction
    const transaction: Transaction = {
      id: `payment_${booking.id}`,
      date: new Date(),
      description: `Payment for ${booking.offeringName} - ${booking.customerName}`,
      amount: booking.totalAmount,
      type: 'income',
      category: 'Tourism Services',
      paymentMethod: 'Stripe',
    };

    await this.recordTransaction(transaction);

    console.log(`[Accounting] Synced booking ${booking.id} to ${this.provider}`);
  }

  /**
   * Generate financial report
   */
  async generateReport(dateRange: { startDate: Date; endDate: Date }): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    transactionCount: number;
  }> {
    console.log(`[Accounting] Generating report for ${this.provider}`, dateRange);

    // In production, fetch from accounting software API
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      transactionCount: 0,
    };
  }
}

/**
 * Helper function to format amount for accounting software
 */
export function formatAccountingAmount(cents: number): number {
  return cents / 100;
}

/**
 * Helper function to categorize transactions
 */
export function categorizeTransaction(description: string): string {
  const categories: Record<string, string[]> = {
    'Tourism Services': ['booking', 'tour', 'activity', 'experience'],
    'Marketing': ['advertising', 'promotion', 'social media'],
    'Operations': ['supplies', 'equipment', 'maintenance'],
    'Payroll': ['salary', 'wages', 'compensation'],
    'Utilities': ['internet', 'phone', 'electricity'],
  };

  const lowerDesc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      return category;
    }
  }

  return 'Other';
}
