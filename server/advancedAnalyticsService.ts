/**
 * Advanced Analytics Service
 * Provides detailed analytics with custom date ranges and advanced metrics
 */

import * as db from './db';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsMetrics {
  revenue: {
    total: number;
    byPeriod: Array<{ date: string; amount: number }>;
    growth: number; // Percentage growth vs previous period
  };
  bookings: {
    total: number;
    byStatus: Record<string, number>;
    byOffering: Array<{ offeringId: number; offeringName: string; count: number; revenue: number }>;
    conversionRate: number; // Confirmed / Total
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    topCustomers: Array<{ email: string; name: string; totalSpent: number; bookingCount: number }>;
  };
  performance: {
    averageBookingValue: number;
    averagePartySize: number;
    popularTimes: Array<{ hour: number; count: number }>;
    popularDays: Array<{ day: string; count: number }>;
  };
}

/**
 * Get comprehensive analytics for a business within a date range
 */
export async function getAnalytics(businessId: number, dateRange: DateRange): Promise<AnalyticsMetrics> {
  const bookings = await db.listBookingsByDateRange(businessId, dateRange.startDate, dateRange.endDate);
  const offerings = await db.listOfferingsByBusiness(businessId);
  
  // Calculate revenue metrics
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const revenueByDate = groupByDate(bookings, 'bookingDate', b => b.totalAmount);
  
  // Calculate previous period for growth comparison
  const periodLength = dateRange.endDate.getTime() - dateRange.startDate.getTime();
  const previousStart = new Date(dateRange.startDate.getTime() - periodLength);
  const previousEnd = new Date(dateRange.startDate);
  const previousBookings = await db.listBookingsByDateRange(businessId, previousStart, previousEnd);
  const previousRevenue = previousBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const revenueGrowth = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;
  
  // Bookings by status
  const bookingsByStatus: Record<string, number> = {};
  bookings.forEach(b => {
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
  });
  
  // Bookings by offering
  const bookingsByOffering = new Map<number, { name: string; count: number; revenue: number }>();
  bookings.forEach(b => {
    const offering = offerings.find(o => o.id === b.offeringId);
    if (offering) {
      const existing = bookingsByOffering.get(b.offeringId) || { name: offering.name, count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += b.totalAmount;
      bookingsByOffering.set(b.offeringId, existing);
    }
  });
  
  // Customer metrics
  const customerEmails = new Set(bookings.map(b => b.customerEmail));
  const customerBookingCounts = new Map<string, number>();
  bookings.forEach(b => {
    customerBookingCounts.set(b.customerEmail, (customerBookingCounts.get(b.customerEmail) || 0) + 1);
  });
  const returningCustomers = Array.from(customerBookingCounts.values()).filter(count => count > 1).length;
  
  // Top customers
  const customerSpending = new Map<string, { name: string; total: number; count: number }>();
  bookings.forEach(b => {
    const existing = customerSpending.get(b.customerEmail) || { name: b.customerName, total: 0, count: 0 };
    existing.total += b.totalAmount;
    existing.count++;
    customerSpending.set(b.customerEmail, existing);
  });
  const topCustomers = Array.from(customerSpending.entries())
    .map(([email, data]) => ({
      email,
      name: data.name,
      totalSpent: data.total,
      bookingCount: data.count,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);
  
  // Performance metrics
  const averageBookingValue = bookings.length > 0 
    ? totalRevenue / bookings.length 
    : 0;
  const averagePartySize = bookings.length > 0
    ? bookings.reduce((sum, b) => sum + b.partySize, 0) / bookings.length
    : 0;
  
  // Popular times
  const hourCounts = new Map<number, number>();
  bookings.forEach(b => {
    if (b.bookingTime) {
      const hour = parseInt(b.bookingTime.split(':')[0]);
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }
  });
  const popularTimes = Array.from(hourCounts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count);
  
  // Popular days
  const dayCounts = new Map<string, number>();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  bookings.forEach(b => {
    const day = dayNames[new Date(b.bookingDate).getDay()];
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  });
  const popularDays = Array.from(dayCounts.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => b.count - a.count);
  
  return {
    revenue: {
      total: totalRevenue,
      byPeriod: revenueByDate,
      growth: revenueGrowth,
    },
    bookings: {
      total: bookings.length,
      byStatus: bookingsByStatus,
      byOffering: Array.from(bookingsByOffering.entries()).map(([id, data]) => ({
        offeringId: id,
        offeringName: data.name,
        count: data.count,
        revenue: data.revenue,
      })),
      conversionRate: bookings.length > 0
        ? (bookingsByStatus['confirmed'] || 0) / bookings.length * 100
        : 0,
    },
    customers: {
      total: customerEmails.size,
      new: customerEmails.size - returningCustomers,
      returning: returningCustomers,
      topCustomers,
    },
    performance: {
      averageBookingValue,
      averagePartySize,
      popularTimes,
      popularDays,
    },
  };
}

/**
 * Helper function to group bookings by date
 */
function groupByDate(
  bookings: any[],
  dateField: string,
  valueExtractor: (booking: any) => number
): Array<{ date: string; amount: number }> {
  const grouped = new Map<string, number>();
  
  bookings.forEach(booking => {
    const date = new Date(booking[dateField]).toISOString().split('T')[0];
    grouped.set(date, (grouped.get(date) || 0) + valueExtractor(booking));
  });
  
  return Array.from(grouped.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Export analytics data as CSV
 */
export function exportAnalyticsCSV(metrics: AnalyticsMetrics): string {
  const lines: string[] = [];
  
  // Revenue by period
  lines.push('Date,Revenue');
  metrics.revenue.byPeriod.forEach(({ date, amount }) => {
    lines.push(`${date},${amount / 100}`);
  });
  
  lines.push('');
  lines.push('Offering,Bookings,Revenue');
  metrics.bookings.byOffering.forEach(({ offeringName, count, revenue }) => {
    lines.push(`${offeringName},${count},${revenue / 100}`);
  });
  
  lines.push('');
  lines.push('Customer,Email,Total Spent,Booking Count');
  metrics.customers.topCustomers.forEach(({ name, email, totalSpent, bookingCount }) => {
    lines.push(`${name},${email},${totalSpent / 100},${bookingCount}`);
  });
  
  return lines.join('\n');
}

/**
 * Generate analytics report summary
 */
export function generateAnalyticsReport(metrics: AnalyticsMetrics, dateRange: DateRange): string {
  return `
# Analytics Report
**Period:** ${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}

## Revenue
- **Total Revenue:** $${(metrics.revenue.total / 100).toFixed(2)}
- **Growth:** ${metrics.revenue.growth >= 0 ? '+' : ''}${metrics.revenue.growth.toFixed(1)}%

## Bookings
- **Total Bookings:** ${metrics.bookings.total}
- **Conversion Rate:** ${metrics.bookings.conversionRate.toFixed(1)}%
- **Confirmed:** ${metrics.bookings.byStatus['confirmed'] || 0}
- **Pending:** ${metrics.bookings.byStatus['pending'] || 0}

## Customers
- **Total Customers:** ${metrics.customers.total}
- **New Customers:** ${metrics.customers.new}
- **Returning Customers:** ${metrics.customers.returning}

## Performance
- **Average Booking Value:** $${(metrics.performance.averageBookingValue / 100).toFixed(2)}
- **Average Party Size:** ${metrics.performance.averagePartySize.toFixed(1)}

## Top Offerings
${metrics.bookings.byOffering.slice(0, 5).map((o, i) => 
  `${i + 1}. ${o.offeringName}: ${o.count} bookings, $${(o.revenue / 100).toFixed(2)}`
).join('\n')}
  `.trim();
}
