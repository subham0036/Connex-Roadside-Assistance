const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use STARTTLS
    family: 4, // Force IPv4
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Gmail App Password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

async function sendOtpEmail(email, otp) {
  try {
    console.log("[Email] Creating Gmail transporter...");

    const transporter = getTransporter();

    console.log("[Email] Verifying SMTP connection...");
    await transporter.verify();
    console.log("[Email] SMTP connection successful.");

    console.log("[Email] Sending OTP to:", email);

    const info = await transporter.sendMail({
      from: `"Connex Roadside Assistance" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Your Connex OTP",
      html: `
        <div style="font-family:Arial,sans-serif;padding:30px;background:#f5f5f5;">
          <div style="background:white;padding:30px;border-radius:10px;max-width:500px;margin:auto;">
            <h2 style="margin-top:0;">Connex Roadside Assistance</h2>

            <p>Your One-Time Password (OTP) is:</p>

            <div style="
              font-size:36px;
              font-weight:bold;
              letter-spacing:8px;
              text-align:center;
              background:#f0f0f0;
              padding:20px;
              border-radius:8px;
              margin:25px 0;">
              ${otp}
            </div>

            <p>This OTP is valid for <b>5 minutes</b>.</p>

            <p>Please do not share this code with anyone.</p>

            <hr>

            <p style="font-size:12px;color:#777;">
              If you didn't request this OTP, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    console.log("[Email] OTP Email Sent Successfully");
    console.log("[Email] Message ID:", info.messageId);

    return {
      sent: true,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error("========================================");
    console.error("[Email Error]");
    console.error(err);
    console.error("========================================");

    return {
      sent: false,
      error: err.message,
    };
  }
}

module.exports = {
  sendOtpEmail,
};