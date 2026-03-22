import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCustomerByEmail } from "@/lib/customer-auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Always return success to avoid email enumeration attacks
    const successResponse = {
      success: true,
      message: "If an account exists with that email, a reset link has been generated.",
    };

    // Check if customer exists
    const customer = getCustomerByEmail(email);
    if (!customer) {
      return NextResponse.json(successResponse);
    }

    // Generate a random token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store token in Supabase
    const supabase = getServiceSupabase();

    // Invalidate any existing unused tokens for this email
    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("customer_email", email.toLowerCase())
      .eq("used", false);

    // Insert new token
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        customer_email: email.toLowerCase(),
        token,
        expires_at: expiresAt,
        used: false,
      });

    if (insertError) {
      console.error("Failed to store reset token:", insertError);
      return NextResponse.json(
        { success: false, error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    // In dev mode, include the token in the response so it can be used without email
    const isDev = process.env.NODE_ENV !== "production";

    return NextResponse.json({
      ...successResponse,
      ...(isDev ? { token, resetUrl: `/account/reset-password?token=${token}` } : {}),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
