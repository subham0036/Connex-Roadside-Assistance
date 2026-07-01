/**
 * Test Twilio OTP API Connection
 * Usage: node scripts/testTwilio.js 9973343724
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const https = require("https");

async function testTwilio(phone10) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    console.error("❌ Twilio credentials not set in .env");
    console.error("   Set: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER");
    process.exit(1);
  }

  if (!phone10) {
    console.error("Usage: node scripts/testTwilio.js 9973343724");
    process.exit(1);
  }

  console.log("🔍 Testing Twilio OTP API...");
  console.log(`📱 To Phone: +91${phone10}`);
  console.log(`📱 From Phone: ${fromPhone}`);
  console.log(`🔑 Account SID: ${accountSid.substring(0, 10)}...`);

  const testCode = String(Math.floor(100000 + Math.random() * 900000));
  console.log(`📝 Test OTP Code: ${testCode}\n`);

  const message = `Your Connex OTP is ${testCode}. Valid for 5 minutes. Do not share.`;

  const params = new URLSearchParams({
    From: fromPhone,
    To: `+91${phone10}`,
    Body: message,
  }).toString();

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  console.log("📤 Sending request to Twilio API...\n");

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.twilio.com",
        path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(params),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          console.log(`📥 HTTP Status: ${res.statusCode}`);
          console.log(`📥 Raw Response: ${data}\n`);

          try {
            const parsed = JSON.parse(data);
            console.log("📨 Parsed Response:");
            console.log(JSON.stringify(parsed, null, 2));

            if (res.statusCode === 201 && parsed?.sid) {
              console.log("\n✅ SUCCESS! OTP sent via Twilio.");
              console.log("   Message SID:", parsed?.sid);
              console.log("   Status:", parsed?.status);
              console.log("\n📞 Check your phone for the OTP!");
            } else if (parsed?.code === 21608) {
              console.log("\n❌ ERROR 21608: Unverified phone number");
              console.log("   Add your personal phone to Twilio verified callers:");
              console.log("   Dashboard → Phone Numbers → Verified Caller IDs → Add Number");
            } else if (parsed?.code === 21211) {
              console.log("\n❌ ERROR 21211: Invalid 'To' phone format");
            } else if (parsed?.code === 20003) {
              console.log("\n❌ ERROR 20003: Invalid credentials");
            } else {
              console.log("\n⚠️  Response Code:", parsed?.code);
              console.log("   Message:", parsed?.message);
            }

            process.exit(0);
          } catch (err) {
            console.error("❌ JSON Parse error:", err.message);
            console.log("Raw response:", data);
            process.exit(1);
          }
        });
      }
    );

    req.on("error", (err) => {
      console.error("❌ Network error:", err.message);
      process.exit(1);
    });

    req.write(params);
    req.end();
  });
}

const phone = process.argv[2];
testTwilio(phone);
