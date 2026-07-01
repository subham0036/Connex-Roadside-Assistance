const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Gmail App Password
    },
  });
}

async function sendOtpEmail(email, otp) {
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"Connex" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Your Connex OTP",
      html: `
        <div style="font-family:Arial,sans-serif;padding:30px">
          <h2>Connex Roadside Assistance</h2>

          <p>Your verification code is:</p>

          <div style="
              font-size:34px;
              font-weight:bold;
              letter-spacing:8px;
              background:#f4f4f4;
              padding:20px;
              text-align:center;
              border-radius:8px;">
              ${otp}
          </div>

          <p>This OTP expires in <b>5 minutes</b>.</p>

          <p>If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    console.log("OTP Email Sent:", info.messageId);

    return { sent: true };
  } catch (err) {
    console.error("Email Error:", err);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendOtpEmail };