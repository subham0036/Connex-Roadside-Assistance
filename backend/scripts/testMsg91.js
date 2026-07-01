/**
 * Test MSG91 OTP API Connection
 * Usage: node scripts/testMsg91.js 9876543210
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const https = require("https");

async function testMsg91(phone10) {
  const authKey = process.env.MSG91_AUTH_KEY;

  if (!authKey) {
    console.error("❌ MSG91_AUTH_KEY not set in .env");
    process.exit(1);
  }

  if (!phone10) {
    console.error("Usage: node scripts/testMsg91.js 9876543210");
    process.exit(1);
  }

  console.log("🔍 Testing MSG91 OTP API...");
  console.log(`📱 Phone: +91${phone10}`);
  console.log(`🔑 Auth Key: ${authKey.substring(0, 10)}...`);

  const testCode = String(Math.floor(100000 + Math.random() * 900000));
  console.log(`📝 Test OTP Code: ${testCode}\n`);

  const message = `Your Connex OTP is ${testCode}. Valid for 5 minutes. Do not share.`;

  const params = new URLSearchParams({
    authkey: authKey,
    mobile: phone10,
    message,
    otp: testCode,
    sendotp: "1",
    route: "1",
  }).toString();

  console.log("📤 Sending request with params:");
  console.log(params);
  console.log("");

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.msg91.com",
        path: "/api/sendotp.php",
        method: "POST",
        headers: {
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

            if (parsed?.type === "success" || parsed?.type === 1) {
              console.log("\n✅ SUCCESS! OTP sent successfully.");
              console.log("   Transaction ID:", parsed?.message);
            } else if (parsed?.type === 0 || parsed?.type === "error") {
              console.log(`\n❌ ERROR: ${parsed?.message || "Unknown error"}`);
              console.log("   Check: MSG91_AUTH_KEY, phone format, or MSG91 account balance");
            } else {
              console.log("\n⚠️  UNKNOWN RESPONSE");
              console.log("   Type:", parsed?.type);
              console.log("   Message (Transaction ID):", parsed?.message);
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
testMsg91(phone);
