/**
 * FOFA Notification Service
 * Sends AI assessment emails when club/expert applications are submitted
 * 
 * Setup:
 * 1. npm install resend
 * 2. Add to .env: RESEND_API_KEY=re_xxxxxx
 * 3. Add to .env: ADMIN_EMAIL=your-email@example.com
 * 4. Add to .env: FOFA_BASE_URL=https://fofa.lol
 */

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const FOFA_BASE_URL = process.env.FOFA_BASE_URL || "https://fofa.lol";
const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@fofa.lol";

let resend = null;

// Initialize Resend only if API key is available
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  console.warn("⚠️  RESEND_API_KEY not set - email notifications disabled");
}

/**
 * Send club application AI assessment email to admin
 */
export async function notifyClubApplicationSubmitted(application) {
  if (!resend || !ADMIN_EMAIL) {
    console.log("📧 Email notifications disabled (Resend not configured)");
    return;
  }

  try {
    const aiVerification = application.ai_verification || {};
    const decision = aiVerification.decision || "pending";
    const confidence = aiVerification.confidence || 0;
    const redFlags = aiVerification.checks?.red_flags || [];
    const reasoning = aiVerification.reasoning || "No reasoning provided";

    // Decision badge color
    const decisionBadgeColor =
      decision === "approved"
        ? "#1AFF6E"
        : decision === "rejected"
          ? "#FF4D4D"
          : "#FFB800";

    const decisionBadgeBackground =
      decision === "approved"
        ? "rgba(26, 255, 110, 0.1)"
        : decision === "rejected"
          ? "rgba(255, 77, 77, 0.1)"
          : "rgba(255, 184, 0, 0.1)";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0e0a; color: #e0e0e0; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1e1a; border: 1px solid #2a3e2a; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #080c08 0%, #1a2a1a 100%); padding: 30px; border-bottom: 2px solid #1AFF6E; }
    .header h1 { margin: 0; color: #1AFF6E; font-size: 24px; }
    .header p { margin: 5px 0 0 0; color: #999; font-size: 14px; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { color: #1AFF6E; font-size: 16px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a3e2a; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #999; }
    .info-value { color: #e0e0e0; font-weight: 500; }
    .decision-badge { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .decision-approved { background: rgba(26, 255, 110, 0.1); color: #1AFF6E; }
    .decision-rejected { background: rgba(255, 77, 77, 0.1); color: #FF4D4D; }
    .decision-needs-review { background: rgba(255, 184, 0, 0.1); color: #FFB800; }
    .confidence { color: #1AFF6E; font-weight: 600; }
    .red-flags { background: rgba(255, 77, 77, 0.05); border-left: 3px solid #FF4D4D; padding: 12px; border-radius: 4px; margin: 12px 0; }
    .red-flags ul { margin: 0; padding-left: 20px; }
    .red-flags li { color: #FF9999; margin: 4px 0; }
    .reasoning-box { background: rgba(26, 255, 110, 0.05); border-left: 3px solid #1AFF6E; padding: 12px; border-radius: 4px; margin: 12px 0; color: #ccc; font-size: 14px; }
    .action-buttons { display: flex; gap: 12px; margin-top: 20px; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 14px; text-align: center; }
    .btn-approve { background: #1AFF6E; color: #080c08; }
    .btn-reject { background: #FF4D4D; color: #fff; }
    .btn-review { background: #FFB800; color: #080c08; }
    .btn:hover { opacity: 0.8; }
    .footer { background: #0a0e0a; padding: 20px 30px; border-top: 1px solid #2a3e2a; font-size: 12px; color: #666; }
    .funding-check { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
    .check-icon { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; margin-right: 8px; font-weight: bold; }
    .check-pass { background: rgba(26, 255, 110, 0.2); color: #1AFF6E; }
    .check-fail { background: rgba(255, 77, 77, 0.2); color: #FF4D4D; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 New Application Submitted</h1>
      <p>AI Assessment Ready for Review</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Application Details</div>
        <div class="info-row">
          <span class="info-label">Club Name</span>
          <span class="info-value">${application.club_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Location</span>
          <span class="info-value">${application.country} • ${application.league_tier}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Contact</span>
          <span class="info-value">${application.contact_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Funding Request</span>
          <span class="info-value">${application.funding_currency} ${application.funding_amount.toLocaleString()}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">AI Assessment</div>
        <div style="margin-bottom: 12px;">
          <span class="decision-badge ${
            decision === "approved"
              ? "decision-approved"
              : decision === "rejected"
                ? "decision-rejected"
                : "decision-needs-review"
          }">
            ${decision.toUpperCase()}
          </span>
          <span class="confidence" style="margin-left: 12px;">Confidence: ${(confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Verification Checks</div>
        <div class="funding-check">
          <span>Club Exists</span>
          <span>
            <span class="check-icon ${aiVerification.checks?.club_exists ? "check-pass" : "check-fail"}">
              ${aiVerification.checks?.club_exists ? "✓" : "✗"}
            </span>
          </span>
        </div>
        <div class="funding-check">
          <span>Email Legitimate</span>
          <span>
            <span class="check-icon ${aiVerification.checks?.email_legitimate ? "check-pass" : "check-fail"}">
              ${aiVerification.checks?.email_legitimate ? "✓" : "✗"}
            </span>
          </span>
        </div>
        <div class="funding-check">
          <span>Funding Reasonable</span>
          <span>
            <span class="check-icon ${aiVerification.checks?.ask_reasonable ? "check-pass" : "check-fail"}">
              ${aiVerification.checks?.ask_reasonable ? "✓" : "✗"}
            </span>
          </span>
        </div>
      </div>

      ${
        redFlags.length > 0
          ? `
      <div class="section red-flags">
        <strong>🚩 Red Flags Detected:</strong>
        <ul>
          ${redFlags.map((flag) => `<li>${flag}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }

      <div class="section">
        <div class="section-title">AI Reasoning</div>
        <div class="reasoning-box">
          ${reasoning}
        </div>
      </div>

      <div class="section">
        <div class="action-buttons">
          <a href="${FOFA_BASE_URL}/#admin/clubs/${application._id}/approve" class="btn btn-approve">✓ APPROVE</a>
          <a href="${FOFA_BASE_URL}/#admin/clubs/${application._id}/reject" class="btn btn-reject">✗ REJECT</a>
          <a href="${FOFA_BASE_URL}/#admin/clubs/applications" class="btn btn-review">📋 REVIEW</a>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Application ID:</strong> ${application._id}</p>
      <p>This is an automated notification from FOFA AI Assessment System. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    const subject = `[FOFA AI] Club Application: ${application.club_name} - ${decision.toUpperCase()}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      html,
      replyTo: "noreply@fofa.lol",
    });

    if (error) {
      console.error("❌ Email send failed:", error);
      return false;
    }

    console.log("✅ Club application notification sent:", data.id);
    return true;
  } catch (err) {
    console.error("❌ Notification service error:", err);
    return false;
  }
}

/**
 * Send expert application AI assessment email to admin
 */
export async function notifyExpertApplicationSubmitted(application) {
  if (!resend || !ADMIN_EMAIL) {
    console.log("📧 Email notifications disabled (Resend not configured)");
    return;
  }

  try {
    const aiVerification = application.ai_verification || {};
    const decision = aiVerification.decision || "pending";
    const confidence = aiVerification.confidence || 0;
    const redFlags = aiVerification.checks?.red_flags || [];
    const reasoning = aiVerification.reasoning || "No reasoning provided";

    const decisionBadgeColor =
      decision === "approved"
        ? "#1AFF6E"
        : decision === "rejected"
          ? "#FF4D4D"
          : "#FFB800";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0e0a; color: #e0e0e0; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1e1a; border: 1px solid #2a3e2a; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #080c08 0%, #1a2a1a 100%); padding: 30px; border-bottom: 2px solid #1AFF6E; }
    .header h1 { margin: 0; color: #1AFF6E; font-size: 24px; }
    .header p { margin: 5px 0 0 0; color: #999; font-size: 14px; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { color: #1AFF6E; font-size: 16px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a3e2a; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #999; }
    .info-value { color: #e0e0e0; font-weight: 500; }
    .decision-badge { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .decision-approved { background: rgba(26, 255, 110, 0.1); color: #1AFF6E; }
    .decision-rejected { background: rgba(255, 77, 77, 0.1); color: #FF4D4D; }
    .decision-needs-review { background: rgba(255, 184, 0, 0.1); color: #FFB800; }
    .confidence { color: #1AFF6E; font-weight: 600; }
    .red-flags { background: rgba(255, 77, 77, 0.05); border-left: 3px solid #FF4D4D; padding: 12px; border-radius: 4px; margin: 12px 0; }
    .red-flags ul { margin: 0; padding-left: 20px; }
    .red-flags li { color: #FF9999; margin: 4px 0; }
    .reasoning-box { background: rgba(26, 255, 110, 0.05); border-left: 3px solid #1AFF6E; padding: 12px; border-radius: 4px; margin: 12px 0; color: #ccc; font-size: 14px; }
    .action-buttons { display: flex; gap: 12px; margin-top: 20px; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 14px; text-align: center; }
    .btn-approve { background: #1AFF6E; color: #080c08; }
    .btn-reject { background: #FF4D4D; color: #fff; }
    .btn-review { background: #FFB800; color: #080c08; }
    .btn:hover { opacity: 0.8; }
    .footer { background: #0a0e0a; padding: 20px 30px; border-top: 1px solid #2a3e2a; font-size: 12px; color: #666; }
    .check-icon { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; margin-right: 8px; font-weight: bold; }
    .check-pass { background: rgba(26, 255, 110, 0.2); color: #1AFF6E; }
    .check-fail { background: rgba(255, 77, 77, 0.2); color: #FF4D4D; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>👤 Expert Application Submitted</h1>
      <p>AI Assessment Ready for Review</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Application Details</div>
        <div class="info-row">
          <span class="info-label">Full Name</span>
          <span class="info-value">${application.full_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Expert Type</span>
          <span class="info-value">${application.expert_type}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${application.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Background</span>
          <span class="info-value">${application.professional_background.substring(0, 50)}...</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">AI Assessment</div>
        <div style="margin-bottom: 12px;">
          <span class="decision-badge ${
            decision === "approved"
              ? "decision-approved"
              : decision === "rejected"
                ? "decision-rejected"
                : "decision-needs-review"
          }">
            ${decision.toUpperCase()}
          </span>
          <span class="confidence" style="margin-left: 12px;">Confidence: ${(confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      ${
        redFlags.length > 0
          ? `
      <div class="section red-flags">
        <strong>🚩 Red Flags Detected:</strong>
        <ul>
          ${redFlags.map((flag) => `<li>${flag}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }

      <div class="section">
        <div class="section-title">AI Reasoning</div>
        <div class="reasoning-box">
          ${reasoning}
        </div>
      </div>

      <div class="section">
        <div class="action-buttons">
          <a href="${FOFA_BASE_URL}/#admin/experts/${application._id}/approve" class="btn btn-approve">✓ APPROVE</a>
          <a href="${FOFA_BASE_URL}/#admin/experts/${application._id}/reject" class="btn btn-reject">✗ REJECT</a>
          <a href="${FOFA_BASE_URL}/#admin/experts/applications" class="btn btn-review">📋 REVIEW</a>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Application ID:</strong> ${application._id}</p>
      <p>This is an automated notification from FOFA AI Assessment System. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    const subject = `[FOFA] Expert Application: ${application.full_name} (${application.expert_type})`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      html,
      replyTo: "noreply@fofa.lol",
    });

    if (error) {
      console.error("❌ Email send failed:", error);
      return false;
    }

    console.log("✅ Expert application notification sent:", data.id);
    return true;
  } catch (err) {
    console.error("❌ Notification service error:", err);
    return false;
  }
}
