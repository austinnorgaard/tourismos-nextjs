import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/server/db";
import { sendEmail, generateUsernameRecoveryEmail } from "@/server/emailService";

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
    if (!user || !user.username) {
      return NextResponse.json({
        message: "If an account exists with that email and has a username, it has been sent.",
      });
    }

    // Send email with username
    const { html, text } = generateUsernameRecoveryEmail(user.username, user.name || "User");
    const emailSent = await sendEmail({
      to: user.email,
      subject: "Username Recovery - TourismOS",
      html,
      text,
    });

    if (!emailSent) {
      console.error("[Forgot Username] Failed to send email to:", user.email);
    }

    return NextResponse.json({
      message: "If an account exists with that email and has a username, it has been sent.",
    });
  } catch (error) {
    console.error("[Forgot Username] Error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
