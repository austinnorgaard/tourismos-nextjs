import nodemailer from "nodemailer";

// Email configuration - supports Gmail, Brevo, or custom SMTP
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER || "noreply@tourismos.com";
const FROM_NAME = process.env.FROM_NAME || "TourismOS";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  // Gmail-specific settings
  ...(SMTP_HOST.includes('gmail') && {
    service: 'gmail',
  }),
});

// Verify connection configuration
transporter.verify((error: any, success: any) => {
  if (error) {
    console.log("[Email] SMTP connection error:", error.message);
    console.log("[Email] Please configure SMTP credentials in environment variables");
  } else {
    console.log("[Email] SMTP server is ready to send emails");
  }
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    console.log("[Email] Attempting to send email to:", options.to);
    console.log("[Email] SMTP configured:", !!SMTP_USER && !!SMTP_PASS);
    
    // Check if SMTP is configured
    if (!SMTP_USER || !SMTP_PASS) {
      console.log("[Email] SMTP not configured. Email would be sent to:", options.to);
      console.log("[Email] Subject:", options.subject);
      console.log("[Email] Content:", options.text || options.html);
      return false;
    }

    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("[Email] Message sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

export function generatePasswordResetEmail(resetUrl: string, userName: string): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password for your TourismOS account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Best regards,<br>The TourismOS Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} TourismOS. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${userName},

We received a request to reset your password for your TourismOS account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
The TourismOS Team

© ${new Date().getFullYear()} TourismOS. All rights reserved.
  `;

  return { html, text };
}

export function generateUsernameRecoveryEmail(username: string, userName: string): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .username-box { background: white; border: 2px solid #667eea; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .username { font-size: 24px; font-weight: bold; color: #667eea; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Username Recovery</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We received a request to recover your username for your TourismOS account.</p>
          <p>Your username is:</p>
          <div class="username-box">
            <div class="username">${username}</div>
          </div>
          <p>You can use this username to log in to your account at any time.</p>
          <p>If you didn't request this information, you can safely ignore this email.</p>
          <p>Best regards,<br>The TourismOS Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} TourismOS. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${userName},

We received a request to recover your username for your TourismOS account.

Your username is: ${username}

You can use this username to log in to your account at any time.

If you didn't request this information, you can safely ignore this email.

Best regards,
The TourismOS Team

© ${new Date().getFullYear()} TourismOS. All rights reserved.
  `;

  return { html, text };
}
