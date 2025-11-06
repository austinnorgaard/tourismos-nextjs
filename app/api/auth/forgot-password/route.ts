import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, setPasswordResetToken } from "@/server/db";
import { sendEmail, generatePasswordResetEmail } from "@/server/emailService";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await getUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with that email, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await setPasswordResetToken(user.id, resetToken, resetTokenExpiry);

    // Generate reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send email
    const { html, text } = generatePasswordResetEmail(resetUrl, user.name || "User");
    const emailSent = await sendEmail({
      to: user.email,
      subject: "Password Reset Request - TourismOS",
      html,
      text,
    });

    if (!emailSent) {
      console.error("[Forgot Password] Failed to send email to:", user.email);
    }

    return NextResponse.json({
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("[Forgot Password] Error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
