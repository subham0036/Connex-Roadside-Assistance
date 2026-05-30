const https = require("https");

function postFast2Sms(apiKey, params) {
  const body = new URLSearchParams(params).toString();
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "www.fast2sms.com",
        path: "/dev/bulkV3",  // Changed from bulkV2 to V3
        method: "POST",
        headers: {
          authorization: apiKey,
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
          
          // Check if response indicates success
          let ok = false;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Fast2SMS success responses have return: true or status_code in [200, 201, 202]
            ok = parsed?.return === true || 
                 parsed?.status === true || 
                 parsed?.status_code === 200 ||
                 parsed?.status_code === 201 ||
                 (parsed?.return !== false && parsed?.status_code !== 999 && parsed?.status_code !== 996);
          }
          
          resolve({
            sent: ok,
            provider: "fast2sms",
            statusCode: res.statusCode,
            raw: parsed,
          });
        });
      }
    );
    req.on("error", (err) => resolve({ sent: false, provider: "fast2sms", error: err.message }));
    req.write(body);
    req.end();
  });
}

async function sendViaFast2Sms(phone10, code) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return { sent: false, provider: null, reason: "no_api_key" };

  const message = `Your Connex OTP is ${code}. Valid for 5 minutes. Do not share.`;

  // Try 1: Standard OTP route with all parameters
  let result = await postFast2Sms(apiKey, {
    route: "otp",
    variables_values: code,
    numbers: phone10,
    message: message,
  });

  console.log("[Connex SMS] OTP route attempt 1:", JSON.stringify(result, null, 2));

  // Try 2: If OTP route fails, try quick/general SMS route
  if (!result.sent) {
    console.log("[Connex SMS] OTP route failed, trying quick/general SMS route...");
    result = await postFast2Sms(apiKey, {
      route: "q",
      message: message,
      numbers: phone10,
    });
    console.log("[Connex SMS] Quick SMS route attempt 2:", JSON.stringify(result, null, 2));
  }

  // Try 3: If still failing, try with Flash SMS
  if (!result.sent) {
    console.log("[Connex SMS] Quick route failed, trying flash SMS...");
    result = await postFast2Sms(apiKey, {
      route: "q",
      message: message,
      numbers: phone10,
      flash: 0,
    });
    console.log("[Connex SMS] Flash SMS attempt 3:", JSON.stringify(result, null, 2));
  }

  // Check for specific error codes
  if (!result.sent && result.raw?.status_code === 999) {
    result.reason = "fast2sms_wallet";
    console.warn(
      "[Connex SMS] ⚠️  ERROR 999: Fast2SMS wallet LOW! Needs ₹100+ top-up. Check: https://www.fast2sms.com/dashboard"
    );
  }

  if (!result.sent && result.raw?.status_code === 414) {
    result.reason = "ip_blocked";
    console.error(
      "[Connex SMS] ❌ ERROR 414: IP is blacklisted. Need to whitelist IP in Fast2SMS dashboard."
    );
  }

  if (!result.sent) {
    console.warn(`[Connex SMS] ❌ SMS to +91${phone10} failed after all attempts. Code: ${code}`);
    console.warn(`[Connex SMS] Error reason:`, result.reason || "unknown");
  } else {
    console.log(`[Connex SMS] ✅ SMS sent to +91${phone10}`);
  }

  return result;
}

async function sendOtpSms(phone10, code) {
  const fast = await sendViaFast2Sms(phone10, code);
  if (fast.sent) return fast;

  console.log(`[Connex OTP] +91${phone10} => ${code} (copy from login screen if SMS did not arrive)`);
  return { sent: false, provider: fast.provider, reason: fast.reason || "sms_failed" };
}

module.exports = { sendOtpSms };
