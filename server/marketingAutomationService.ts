/**
 * Marketing Automation Service
 * Automated workflows for customer engagement and retention
 */

interface WorkflowTrigger {
  type: 'booking_created' | 'booking_confirmed' | 'booking_completed' | 'customer_birthday' | 'inactive_customer';
  conditions?: Record<string, any>;
}

interface WorkflowAction {
  type: 'send_email' | 'send_notification' | 'create_discount' | 'add_to_segment';
  delay?: number; // Delay in hours before executing
  data: Record<string, any>;
}

interface MarketingWorkflow {
  id: number;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  active: boolean;
}

/**
 * Pre-defined marketing workflows
 */
export const DEFAULT_WORKFLOWS: Omit<MarketingWorkflow, 'id'>[] = [
  {
    name: 'Welcome Email',
    description: 'Send welcome email to new customers after first booking',
    trigger: {
      type: 'booking_created',
    },
    actions: [
      {
        type: 'send_email',
        delay: 0,
        data: {
          template: 'welcome',
          subject: 'Welcome to {{businessName}}!',
        },
      },
    ],
    active: true,
  },
  {
    name: 'Booking Confirmation',
    description: 'Send confirmation email when booking is confirmed',
    trigger: {
      type: 'booking_confirmed',
    },
    actions: [
      {
        type: 'send_email',
        delay: 0,
        data: {
          template: 'booking_confirmed',
          subject: 'Your booking is confirmed!',
        },
      },
      {
        type: 'send_notification',
        delay: 0,
        data: {
          title: 'Booking Confirmed',
          message: 'Your booking has been confirmed',
        },
      },
    ],
    active: true,
  },
  {
    name: 'Post-Experience Follow-up',
    description: 'Send follow-up email 24 hours after experience completion',
    trigger: {
      type: 'booking_completed',
    },
    actions: [
      {
        type: 'send_email',
        delay: 24,
        data: {
          template: 'post_experience',
          subject: 'How was your experience?',
        },
      },
    ],
    active: true,
  },
  {
    name: 'Review Request',
    description: 'Request review 48 hours after experience completion',
    trigger: {
      type: 'booking_completed',
    },
    actions: [
      {
        type: 'send_email',
        delay: 48,
        data: {
          template: 'review_request',
          subject: 'Share your experience with others',
        },
      },
    ],
    active: true,
  },
  {
    name: 'Re-engagement Campaign',
    description: 'Send special offer to customers inactive for 90 days',
    trigger: {
      type: 'inactive_customer',
      conditions: {
        daysSinceLastBooking: 90,
      },
    },
    actions: [
      {
        type: 'create_discount',
        delay: 0,
        data: {
          type: 'percentage',
          value: 15,
          validDays: 30,
        },
      },
      {
        type: 'send_email',
        delay: 0,
        data: {
          template: 're_engagement',
          subject: 'We miss you! Here\'s 15% off your next booking',
        },
      },
    ],
    active: true,
  },
  {
    name: 'Birthday Campaign',
    description: 'Send birthday greeting with special offer',
    trigger: {
      type: 'customer_birthday',
    },
    actions: [
      {
        type: 'create_discount',
        delay: 0,
        data: {
          type: 'percentage',
          value: 20,
          validDays: 7,
        },
      },
      {
        type: 'send_email',
        delay: 0,
        data: {
          template: 'birthday',
          subject: 'Happy Birthday! Enjoy 20% off',
        },
      },
    ],
    active: true,
  },
];

/**
 * Execute a workflow action
 */
export async function executeWorkflowAction(
  action: WorkflowAction,
  context: {
    businessId?: number;
    customerId?: number;
    customerEmail?: string;
    customerName?: string;
    bookingId?: number;
    [key: string]: unknown;
  }
): Promise<void> {
  console.log(`[Workflow] Executing action: ${action.type}`, { context });

  switch (action.type) {
    case 'send_email':
      await sendWorkflowEmail(action.data as { template: string; subject: string }, context);
      break;
    
    case 'send_notification':
      await sendWorkflowNotification(action.data as { title: string; message: string }, context);
      break;
    
    case 'create_discount':
      await createWorkflowDiscount(action.data as { type: 'percentage' | 'fixed'; value: number; validDays: number }, context);
      break;
    
    case 'add_to_segment':
      await addToSegment(action.data as { segmentName: string }, context);
      break;
    
    default:
      console.warn(`[Workflow] Unknown action type: ${action.type}`);
  }
}

/**
 * Send email as part of workflow
 */
async function sendWorkflowEmail(
  data: { template: string; subject: string },
  context: Record<string, unknown>
): Promise<void> {
  // Get email template and replace variables
  const template = await getEmailTemplate(data.template, context);
  const subject = replaceVariables(data.subject, context);
  
  console.log('[Workflow] Sending email:', {
    to: context.customerEmail,
    subject,
    template: data.template,
  });
  
  // In production, send via email service
}

/**
 * Send notification as part of workflow
 */
async function sendWorkflowNotification(
  data: { title: string; message: string },
  context: Record<string, unknown>
): Promise<void> {
  if (!context.customerId) return;
  
  console.log('[Workflow] Sending notification:', {
    userId: context.customerId,
    title: replaceVariables(data.title, context),
    message: replaceVariables(data.message, context),
  });
  
  // Create notification in database
}

/**
 * Create discount code as part of workflow
 */
async function createWorkflowDiscount(
  data: { type: 'percentage' | 'fixed'; value: number; validDays: number },
  context: Record<string, unknown>
): Promise<void> {
  const code = generateDiscountCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + data.validDays);
  
  console.log('[Workflow] Creating discount:', {
    code,
    type: data.type,
    value: data.value,
    expiresAt,
    customerId: context.customerId,
  });
  
  // Save discount to database
}

/**
 * Add customer to segment
 */
async function addToSegment(
  data: { segmentName: string },
  context: any
): Promise<void> {
  console.log('[Workflow] Adding to segment:', {
    customerId: context.customerId,
    segment: data.segmentName,
  });
  
  // Update customer segment in database
}

/**
 * Get email template with variables replaced
 */
async function getEmailTemplate(templateName: string, context: Record<string, unknown>): Promise<string> {
  const templates: Record<string, string> = {
    welcome: `
Dear {{customerName}},

Welcome to {{businessName}}! We're thrilled to have you.

Your booking for {{offeringName}} has been received and is being processed.

We look forward to providing you with an amazing experience!

Best regards,
{{businessName}} Team
    `.trim(),
    
    booking_confirmed: `
Dear {{customerName}},

Great news! Your booking has been confirmed.

**Booking Details:**
- Service: {{offeringName}}
- Date: {{bookingDate}}
- Time: {{bookingTime}}
- Party Size: {{partySize}}

We can't wait to see you!

Best regards,
{{businessName}} Team
    `.trim(),
    
    post_experience: `
Dear {{customerName}},

We hope you enjoyed your {{offeringName}} experience with us!

We'd love to hear about your experience. Your feedback helps us improve and serve you better.

Looking forward to welcoming you again soon!

Best regards,
{{businessName}} Team
    `.trim(),
    
    review_request: `
Dear {{customerName}},

Thank you for choosing {{businessName}} for your {{offeringName}} experience!

Would you mind taking a moment to share your thoughts? Your review helps other travelers discover great experiences.

[Leave a Review]

We truly appreciate your feedback!

Best regards,
{{businessName}} Team
    `.trim(),
    
    re_engagement: `
Dear {{customerName}},

We miss you! It's been a while since your last visit to {{businessName}}.

As a special welcome back offer, we'd like to give you 15% off your next booking.

Use code: {{discountCode}}

Valid for the next 30 days. We hope to see you soon!

Best regards,
{{businessName}} Team
    `.trim(),
    
    birthday: `
Dear {{customerName}},

Happy Birthday! 🎉

To celebrate your special day, we're giving you 20% off your next booking with {{businessName}}.

Use code: {{discountCode}}

Valid for the next 7 days. Treat yourself to an amazing experience!

Best wishes,
{{businessName}} Team
    `.trim(),
  };
  
  const template = templates[templateName] || '';
  return replaceVariables(template, context);
}

/**
 * Replace variables in template
 */
function replaceVariables(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const v = (context as Record<string, unknown>)[key];
    return typeof v === 'string' || typeof v === 'number' ? String(v) : match;
  });
}

/**
 * Generate random discount code
 */
function generateDiscountCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Schedule workflow action execution
 */
export async function scheduleWorkflowAction(
  action: WorkflowAction,
  context: Record<string, unknown>
): Promise<void> {
  if (action.delay && action.delay > 0) {
    // In production, use a job queue (e.g., Bull, BullMQ)
    console.log(`[Workflow] Scheduling action for ${action.delay} hours from now`);
    
    // For now, just log
    setTimeout(() => {
      executeWorkflowAction(action, context);
    }, action.delay * 60 * 60 * 1000);
  } else {
    await executeWorkflowAction(action, context);
  }
}

/**
 * Trigger workflow based on event
 */
export async function triggerWorkflow(
  trigger: WorkflowTrigger['type'],
  context: Record<string, unknown>,
  workflows: MarketingWorkflow[]
): Promise<void> {
  const matchingWorkflows = workflows.filter(
    w => w.active && w.trigger.type === trigger
  );
  
  for (const workflow of matchingWorkflows) {
    console.log(`[Workflow] Triggering workflow: ${workflow.name}`);
    
    for (const action of workflow.actions) {
      await scheduleWorkflowAction(action, context);
    }
  }
}
