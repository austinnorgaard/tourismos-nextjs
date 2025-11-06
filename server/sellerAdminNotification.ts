/**
 * Seller Admin Notification Service
 * Sends notifications to seller admin (Norgaard Enterprises) on key events
 */

import { notifyOwner } from './_core/notification';

/**
 * Notify seller admin about new subscription
 */
export async function notifyNewSubscription(subscription: {
  businessName: string;
  businessEmail: string;
  planName: string;
  planPrice: number;
  startDate: Date;
}): Promise<boolean> {
  const title = '🎉 New Subscription!';
  
  const content = `
**New Business Subscribed to TourismOS**

**Business:** ${subscription.businessName}
**Email:** ${subscription.businessEmail}
**Plan:** ${subscription.planName}
**Price:** $${(subscription.planPrice / 100).toFixed(2)}/month
**Start Date:** ${subscription.startDate.toLocaleDateString()}

This business is now active on the TourismOS platform!
  `.trim();

  try {
    const success = await notifyOwner({ title, content });
    console.log('[SellerAdmin] New subscription notification sent:', success);
    return success;
  } catch (error) {
    console.error('[SellerAdmin] Failed to send new subscription notification:', error);
    return false;
  }
}

/**
 * Notify seller admin about subscription cancellation
 */
export async function notifySubscriptionCancellation(subscription: {
  businessName: string;
  businessEmail: string;
  planName: string;
  cancelDate: Date;
  reason?: string;
}): Promise<boolean> {
  const title = '⚠️ Subscription Cancelled';
  
  const content = `
**Business Cancelled TourismOS Subscription**

**Business:** ${subscription.businessName}
**Email:** ${subscription.businessEmail}
**Plan:** ${subscription.planName}
**Cancel Date:** ${subscription.cancelDate.toLocaleDateString()}
${subscription.reason ? `**Reason:** ${subscription.reason}` : ''}

Please follow up with this business to understand their needs.
  `.trim();

  try {
    const success = await notifyOwner({ title, content });
    console.log('[SellerAdmin] Cancellation notification sent:', success);
    return success;
  } catch (error) {
    console.error('[SellerAdmin] Failed to send cancellation notification:', error);
    return false;
  }
}

/**
 * Notify seller admin about payment failure
 */
export async function notifyPaymentFailure(payment: {
  businessName: string;
  businessEmail: string;
  amount: number;
  failureReason: string;
}): Promise<boolean> {
  const title = '❌ Payment Failed';
  
  const content = `
**Subscription Payment Failed**

**Business:** ${payment.businessName}
**Email:** ${payment.businessEmail}
**Amount:** $${(payment.amount / 100).toFixed(2)}
**Reason:** ${payment.failureReason}

This business may need assistance with their payment method.
  `.trim();

  try {
    const success = await notifyOwner({ title, content });
    console.log('[SellerAdmin] Payment failure notification sent:', success);
    return success;
  } catch (error) {
    console.error('[SellerAdmin] Failed to send payment failure notification:', error);
    return false;
  }
}

/**
 * Notify seller admin about milestone achievements
 */
export async function notifyMilestone(milestone: {
  type: 'revenue' | 'subscribers' | 'bookings';
  value: number;
  description: string;
}): Promise<boolean> {
  const title = '🎯 Milestone Achieved!';
  
  const content = `
**TourismOS Platform Milestone**

**Type:** ${milestone.type.charAt(0).toUpperCase() + milestone.type.slice(1)}
**Value:** ${milestone.value.toLocaleString()}
**Description:** ${milestone.description}

Great progress on the platform!
  `.trim();

  try {
    const success = await notifyOwner({ title, content });
    console.log('[SellerAdmin] Milestone notification sent:', success);
    return success;
  } catch (error) {
    console.error('[SellerAdmin] Failed to send milestone notification:', error);
    return false;
  }
}

/**
 * Send daily summary to seller admin
 */
export async function sendDailySummary(summary: {
  date: Date;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  totalRevenue: number;
  activeSubscribers: number;
  totalBookings: number;
}): Promise<boolean> {
  const title = '📊 Daily Summary';
  
  const content = `
**TourismOS Daily Summary - ${summary.date.toLocaleDateString()}**

**Subscriptions:**
- New: ${summary.newSubscriptions}
- Cancelled: ${summary.cancelledSubscriptions}
- Active: ${summary.activeSubscribers}

**Revenue:** $${(summary.totalRevenue / 100).toFixed(2)}

**Platform Activity:**
- Total Bookings: ${summary.totalBookings}

Have a great day!
  `.trim();

  try {
    const success = await notifyOwner({ title, content });
    console.log('[SellerAdmin] Daily summary sent:', success);
    return success;
  } catch (error) {
    console.error('[SellerAdmin] Failed to send daily summary:', error);
    return false;
  }
}
