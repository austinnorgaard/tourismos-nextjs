import { NextRequest, NextResponse } from "next/server";
import { getUserByResetToken, updateUserPassword, clearPasswordResetToken } from "@/server/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find user by reset token
    const user = await getUserByResetToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (user.resetTokenExpiry && new Date() > new Date(user.resetTokenExpiry)) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await updateUserPassword(user.id, hashedPassword);

    // Clear reset token
    await clearPasswordResetToken(user.id);

    return NextResponse.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("[Reset Password] Error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
