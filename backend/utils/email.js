const nodemailer = require("nodemailer");

// Create email transporter - Using Gmail or Ethereal (free test email service)
function getTransporter() {
  const emailProvider = process.env.EMAIL_PROVIDER || "ethereal"; // ethereal or gmail

  if (emailProvider === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use app-specific password for Gmail
      },
    });
  } else {
    // Ethereal - Free test email service (no credentials needed, auto-generated)
    // For real use, configure: https://ethereal.email
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || "connex@ethereal.email",
        pass: process.env.EMAIL_PASSWORD || "connex_test_password",
      },
    });
  }
}

async function sendOtpEmail(email, otp) {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@connex.com",
      to: email,
      subject: `Your Connex OTP: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
          <div style="background: white; padding: 40px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #0a0a0a; margin-bottom: 20px;">Connex Roadside Help</h2>
            <p style="color: #525252; font-size: 14px; margin-bottom: 20px;">
              Your one-time verification code is:
            </p>
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #0a0a0a; letter-spacing: 4px; margin: 0; font-family: 'Courier New', monospace;">
                ${otp}
              </h1>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This code expires in 5 minutes.
            </p>
            <p style="color: #999; font-size: 12px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[Email] OTP sent to", email, "- Preview:", nodemailer.getTestMessageUrl(info));
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error("[Email Error]", err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendOtpEmail };
