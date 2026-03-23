import { Resend } from "resend";
import { type Volunteer } from "@shared/schema";
import { log } from "./index";

const resend = new Resend(process.env.RESEND_API_KEY);
const isEmailConfigured = !!process.env.RESEND_API_KEY;

// NOTE: Resend's free tier (onboarding@resend.dev) can only send to your own email address
// unless you verify a custom domain in the Resend dashboard.
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

export async function sendAttendanceEmail(
  volunteer: Volunteer,
  ranking: number,
  points: number,
  eventName: string
) {
  if (!volunteer.email) return;

  const subject = `Smile Club Mahajanga - Your Ranking Update (${eventName})`;
  const text = `Hello ${volunteer.fullName},

Thank you for attending our meeting: ${eventName}.

Your current stats in Smile Club Mahajanga:
- Ranking: #${ranking}
- Total Points: ${points}

Keep up the great work!

Best regards,
Smile Club Mahajanga Administration Team
(This is a no-reply email)`;

  if (!isEmailConfigured) {
    log(`[MOCK EMAIL] To: ${volunteer.email} | Subject: ${subject}`, "email");
    log(`[MOCK EMAIL] Content: Ranking #${ranking}, Points: ${points}`, "email");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Smile Club Mahajanga <${FROM_EMAIL}>`,
      to: [volunteer.email],
      subject,
      text,
    });

    if (error) {
      console.error(`Resend error for ${volunteer.email}:`, error);
    } else {
      log(`Email queued for ${volunteer.email} (ID: ${data?.id})`, "email");
    }
  } catch (err) {
    console.error(`Failed to send email to ${volunteer.email}:`, err);
  }
}
