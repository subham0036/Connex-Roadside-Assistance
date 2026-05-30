/**
 * Test Fast2SMS API Connection
 * Usage: node scripts/testFast2SMS.js 9876543210
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const https = require("https");

async function testFast2SMS(phone10) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.error("❌ FAST2SMS_API_KEY not set in .env");
    process.exit(1);
  }

  if (!phone10) {
    console.error("Usage: node scripts/testFast2SMS.js 9876543210");
    process.exit(1);
  }

  console.log("🔍 Testing Fast2SMS API...");
  console.log(`📱 Phone: +91${phone10}`);
  console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);

  const testCode = String(Math.floor(100000 + Math.random() * 900000));
  console.log(`📝 Test OTP Code: ${testCode}\n`);

  // Try with correct Fast2SMS parameters
  const params = new URLSearchParams({
    route: "otp",
    variables_values: testCode,
    numbers: phone10,
  }).toString();

  console.log("📤 Sending request with params:");
  console.log(params);
  console.log("");

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "www.fast2sms.com",
        path: "/dev/bulkV3",  // Using V3 API
        method: "POST",
        headers: {
          authorization: apiKey,
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

            // Check various success conditions
            if (
              parsed?.return === true ||
              parsed?.status === true ||
              parsed?.status_code === 200 ||
              parsed?.status_code === 201 ||
              parsed?.request_id
            ) {
              console.log("\n✅ SUCCESS! OTP sent or request accepted.");
            } else if (parsed?.status_code === 999) {
              console.log("\n❌ ERROR 999: WALLET LOW - Need ₹100+ balance");
            } else if (parsed?.status_code === 996) {
              console.log("\n❌ ERROR 996: INVALID PARAMETERS or sender ID");
            } else if (parsed?.return === false) {
              console.log("\n❌ REQUEST FAILED - Invalid parameters");
              console.log("   Check: phone format, route name, or API key");
            } else {
              console.log("\n⚠️  UNKNOWN RESPONSE - Checking details:");
              console.log("   Status Code:", parsed?.status_code);
              console.log("   Message:", parsed?.message);
              console.log("   Return:", parsed?.return);
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
testFast2SMS(phone);
