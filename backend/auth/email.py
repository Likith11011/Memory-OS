import resend
from config import settings
resend.api_key = settings.RESEND_API_KEY

def send_confirmation_email(to_email: str, username: str) -> bool:
    if not settings.RESEND_API_KEY:
        print("Warning: RESEND_API_KEY not set, skipping email")
        return False

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#0a0a1a;font-family:'Inter',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a1a;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#0f0f23;border:1px solid rgba(99,102,241,0.2);border-radius:20px;overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1a1a3e,#0f0f23);padding:40px;text-align:center;border-bottom:1px solid rgba(99,102,241,0.2);">
                  <div style="display:inline-block;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:12px 20px;margin-bottom:16px;">
                    <span style="font-size:24px;">🧠</span>
                  </div>
                  <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0;letter-spacing:-0.5px;">
                    MemoryOS Lite
                  </h1>
                  <p style="color:#818cf8;font-size:13px;margin:6px 0 0;letter-spacing:0.05em;">
                    AI-POWERED SECOND BRAIN
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 12px;">
                    Welcome aboard! 🎉
                  </h2>
                  <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
                    Hi <strong style="color:#a5b4fc;">{username}</strong>, your account has been successfully created.
                    You can now upload notes, PDFs, and ideas — and retrieve them using natural language.
                  </p>

                  <!-- Feature list -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.15);border-radius:12px;padding:20px;margin-bottom:28px;">
                    <tr><td style="padding:8px 0;">
                      <span style="color:#6366f1;font-size:16px;">✦</span>
                      <span style="color:#cbd5e1;font-size:14px;margin-left:10px;">Semantic search — find by meaning, not keywords</span>
                    </td></tr>
                    <tr><td style="padding:8px 0;">
                      <span style="color:#6366f1;font-size:16px;">✦</span>
                      <span style="color:#cbd5e1;font-size:14px;margin-left:10px;">Upload PDFs, notes, and text snippets</span>
                    </td></tr>
                    <tr><td style="padding:8px 0;">
                      <span style="color:#6366f1;font-size:16px;">✦</span>
                      <span style="color:#cbd5e1;font-size:14px;margin-left:10px;">Chat with your memories using AI</span>
                    </td></tr>
                    <tr><td style="padding:8px 0;">
                      <span style="color:#6366f1;font-size:16px;">✦</span>
                      <span style="color:#cbd5e1;font-size:14px;margin-left:10px;">Vector database powered retrieval</span>
                    </td></tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="{settings.FRONTEND_URL}/dashboard"
                           style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;font-size:15px;font-weight:600;padding:14px 40px;border-radius:12px;text-decoration:none;letter-spacing:0.02em;box-shadow:0 0 30px rgba(99,102,241,0.3);">
                          Go to Dashboard →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:rgba(0,0,0,0.3);padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
                  <p style="color:#475569;font-size:12px;margin:0;line-height:1.6;">
                    This email was sent because you signed up for MemoryOS Lite.<br>
                    If you didn't create this account, you can safely ignore this email.
                  </p>
                  <p style="color:#334155;font-size:11px;margin:12px 0 0;">
                    © 2026 MemoryOS Lite. Built with ❤️ by Likith
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    try:
        resend.Emails.send({
            "from": f"{settings.APP_NAME} <{settings.FROM_EMAIL}>",
            "to": [to_email],
            "subject": f"Welcome to {settings.APP_NAME} — Your second brain is ready 🧠",
            "html": html_content,
        })
        return True
    except Exception as e:
        print(f"Email send failed: {str(e)}")
        return False
