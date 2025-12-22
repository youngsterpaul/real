import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const bookingConfirmationSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID format"),
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  guestName: z.string().min(1, "Guest name required").max(100, "Guest name too long"),
  bookingType: z.enum(['trip', 'event', 'hotel', 'adventure_place', 'adventure', 'attraction']),
  itemName: z.string().min(1, "Item name required").max(200, "Item name too long"),
  totalAmount: z.number().positive("Amount must be positive").max(10000000, "Amount too large"),
  bookingDetails: z.any().optional(),
  visitDate: z.string().optional().nullable(),
  paymentStatus: z.string().optional(),
});

// HTML escape function to prevent XSS
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawData = await req.json();
    
    let validatedData;
    try {
      validatedData = bookingConfirmationSchema.parse(rawData);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("Validation error:", validationError.errors);
        return new Response(
          JSON.stringify({ error: "Invalid input", details: validationError.errors }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw validationError;
    }

    const { bookingId, email, guestName, bookingType, itemName, totalAmount, bookingDetails, visitDate, paymentStatus } = validatedData;

    // Initialize Supabase client to verify booking exists
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify booking exists and email matches
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('id, guest_email, payment_status, total_amount')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingId);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify email matches the booking
    if (booking.guest_email && booking.guest_email.toLowerCase() !== email.toLowerCase()) {
      console.error("Email mismatch for booking:", bookingId);
      return new Response(
        JSON.stringify({ error: "Email does not match booking" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Escape all user-provided data for HTML
    const safeGuestName = escapeHtml(guestName);
    const safeItemName = escapeHtml(itemName);
    const safeBookingType = escapeHtml(bookingType);

    const isPaid = paymentStatus === 'paid' || paymentStatus === 'completed';
    const typeDisplay = safeBookingType.charAt(0).toUpperCase() + safeBookingType.slice(1);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingId)}`;

    // Generate booking details HTML safely
    let detailsHTML = '';
    if (bookingDetails) {
      const details = typeof bookingDetails === 'string' ? JSON.parse(bookingDetails) : bookingDetails;
      
      if (details.adults || details.children) {
        detailsHTML += `<p><strong>Guests:</strong> ${Number(details.adults) || 0} Adults, ${Number(details.children) || 0} Children</p>`;
      }
      if (details.rooms) {
        detailsHTML += `<p><strong>Rooms:</strong> ${Number(details.rooms) || 0}</p>`;
      }
      if (details.selectedFacilities && Array.isArray(details.selectedFacilities) && details.selectedFacilities.length > 0) {
        const facilitiesNames = details.selectedFacilities
          .map((f: any) => escapeHtml(typeof f === 'string' ? f : f.name || ''))
          .filter(Boolean)
          .join(', ');
        if (facilitiesNames) {
          detailsHTML += `<p><strong>Facilities:</strong> ${facilitiesNames}</p>`;
        }
      }
      if (details.selectedActivities && Array.isArray(details.selectedActivities) && details.selectedActivities.length > 0) {
        const activitiesNames = details.selectedActivities
          .map((a: any) => escapeHtml(typeof a === 'string' ? a : a.name || ''))
          .filter(Boolean)
          .join(', ');
        if (activitiesNames) {
          detailsHTML += `<p><strong>Activities:</strong> ${activitiesNames}</p>`;
        }
      }
    }

    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #008080; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .detail-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #008080; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #008080; font-size: 20px; margin-top: 0; }
            .amount { font-size: 28px; color: #008080; font-weight: bold; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-top: 10px; }
            .status-pending { background: #FFF3CD; color: #856404; }
            .status-paid { background: #D4EDDA; color: #155724; }
            .qr-code { text-align: center; margin: 20px 0; }
            .qr-code img { border: 2px solid #008080; border-radius: 8px; padding: 10px; background: white; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isPaid ? '✅ Booking Confirmed!' : '📋 Booking Submitted'}</h1>
            </div>
            <div class="content">
              <p>Dear ${safeGuestName},</p>
              <p>${isPaid ? 'Great news! Your payment has been received and your booking is now confirmed.' : 'Thank you for your booking! Your reservation is pending payment confirmation.'}</p>
              
              <div class="detail-box">
                <h2>Booking Details</h2>
                <p><strong>Booking ID:</strong> ${escapeHtml(bookingId)}</p>
                <p><strong>Booking Type:</strong> ${typeDisplay}</p>
                <p><strong>Guest Name:</strong> ${safeGuestName}</p>
                <p><strong>Item:</strong> ${safeItemName}</p>
                ${visitDate ? `<p><strong>Visit Date:</strong> ${escapeHtml(String(visitDate))}</p>` : ''}
                ${detailsHTML}
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p class="amount">Total: Sh ${Number(totalAmount).toFixed(2)}</p>
                <span class="status-badge ${isPaid ? 'status-paid' : 'status-pending'}">${isPaid ? 'Payment Confirmed' : 'Payment Pending'}</span>
              </div>

              ${isPaid ? `
              <div class="qr-code">
                <h3>Your Booking QR Code</h3>
                <p>Show this at the venue for quick check-in:</p>
                <img src="${qrCodeUrl}" alt="Booking QR Code" width="200" height="200" />
              </div>
              ` : `
              <div class="detail-box">
                <h2>Payment Instructions</h2>
                <p>To confirm your booking, please complete the payment process. You should receive an M-Pesa prompt on your phone.</p>
              </div>
              `}

              <p>Thank you for choosing us!</p>
            </div>
            <div class="footer">
              <p>This is an automated confirmation email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Bookings <onboarding@resend.dev>",
      to: [email],
      subject: `Booking ${isPaid ? 'Confirmed' : 'Submitted'} - ${safeItemName}`,
      html: emailHTML,
    });

    if (error) {
      console.error("Error sending booking confirmation email:", error);
      throw error;
    }

    console.log("Booking confirmation email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
