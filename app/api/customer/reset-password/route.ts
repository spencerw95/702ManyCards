import { NextResponse } from "next/server";
import { resetPasswordByEmail } from "@/lib/customer-auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Find the token
    const { data: tokenRecord, error: fetchError } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single();

    if (fetchError || !tokenRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Check expiry
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
      // Mark as used so it can't be retried
      await supabase
        .from("password_reset_tokens")
        .update({ used: true })
        .eq("id", tokenRecord.id);

      return NextResponse.json(
        { success: false, error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update the customer's password
    const updated = resetPasswordByEmail(tokenRecord.customer_email, password);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Failed to update password. Account may not exist." },
        { status: 400 }
      );
    }

    // Mark token as used
    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("id", tokenRecord.id);

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
