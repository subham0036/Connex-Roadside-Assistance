const https = require("https");

// Twilio OTP API (free tier: $15 test credit, works globally + India)
const TWILIO_HOST = "api.twilio.com";

function getTwilioAuth() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    return null;
  }
  return { accountSid, authToken, fromPhone };
}

function postTwilio(accountSid, authToken, params) {
  const body = new URLSearchParams(params).toString();
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: TWILIO_HOST,
        path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = { raw: data };
          }

          const ok = res.statusCode === 201 && parsed?.sid;

          resolve({
            sent: ok,
            provider: "twilio",
            statusCode: res.statusCode,
            raw: parsed,
          });
        });
      }
    );

    req.on("error", (err) =>
      resolve({ sent: false, provider: "twilio", error: err.message })
    );

    req.write(body);
    req.end();
  });
}

async function sendViaTwilio(phone10, code) {
  const auth = getTwilioAuth();
  if (!auth) {
    console.warn(
      "[Connex SMS] ⚠️ Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER"
    );
    return { sent: false, provider: null, reason: "no_twilio_creds" };
  }

  const message = `Your Connex OTP is ${code}. Valid for 5 minutes. Do not share.`;
  const toPhone = `+91${phone10}`;

  console.log(`[Connex SMS] Sending OTP to ${toPhone} via Twilio...`);
  const result = await postTwilio(auth.accountSid, auth.authToken, {
    From: auth.fromPhone,
    To: toPhone,
    Body: message,
  });

  console.log("[Connex SMS] Twilio response:", JSON.stringify(result, null, 2));

  if (!result.sent) {
    if (result.raw?.code === 21211) {
      result.reason = "invalid_phone";
      console.error("[Connex SMS] ❌ Invalid phone number format");
    } else if (result.raw?.code === 20003) {
      result.reason = "invalid_credentials";
      console.error("[Connex SMS] ❌ Invalid Twilio credentials");
    } else if (result.raw?.code === 21608) {
      result.reason = "phone_not_allowed";
      console.error(
        "[Connex SMS] ❌ Phone number not in verified list. Add to Twilio dashboard."
      );
    } else if (result.raw?.error_code) {
      result.reason = "twilio_error";
      console.error(
        `[Connex SMS] ❌ Twilio error: ${result.raw.error_message || result.raw.message}`
      );
    }
    console.warn(`[Connex SMS] ❌ SMS to ${toPhone} failed. Code: ${code}`);
  } else {
    console.log(
      `[Connex SMS] ✅ OTP sent to ${toPhone} (SID: ${result.raw.sid})`
    );
  }

  return result;
}

async function sendOtpSms(phone10, code) {
  const result = await sendViaTwilio(phone10, code);
  if (result.sent) return result;

  console.log(
    `[Connex OTP] +91${phone10} => ${code} (copy from login screen if SMS did not arrive)`
  );
  return {
    sent: false,
    provider: result.provider,
    reason: result.reason || "sms_failed",
  };
}

module.exports = { sendOtpSms };
