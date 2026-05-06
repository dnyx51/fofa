import https from "https";
import http from "http";

const FOFA_API_URL = process.env.FOFA_API_URL || "https://fofa.lol";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const TEST_CASES = [
  {
    name: "Legitimate PL Club",
    data: {
      club_name: "Finsbury Park FC",
      country: "England",
      league: "Premier League",
      league_tier: "Premier League",
      founded_year: 1995,
      stadium: "Holloway Stadium, London",
      website: "https://finsburyparkfc.co.uk",
      description: "Premier League club based in North London with 15,000 season ticket holders and active youth academy.",
      contact_name: "James Mitchell",
      contact_email: "partnerships@finsburyparkfc.co.uk",
      contact_role: "Director of Commercial Partnerships",
      contact_phone: "+44 20 7123 4567",
      social_twitter: "https://twitter.com/FinsburyParkFC",
      social_instagram: "https://instagram.com/finsburyparkfc",
      social_facebook: "https://facebook.com/FinsburyParkFC",
      funding_amount: 2500000,
      funding_currency: "GBP",
      funding_purpose: "Fan engagement platform and digital infrastructure for 2024-25 season",
      funding_duration_months: 12,
      what_club_offers: "Direct access to 15,000 fans, stadium partnerships, official endorsements, merchandise opportunities",
      why_fofa: "We want to build deeper fan loyalty and reward our most engaged supporters with exclusive experiences and benefits.",
    },
    expectedDecision: "approved",
  },
  {
    name: "Championship Club",
    data: {
      club_name: "Meadowbrook Athletic",
      country: "England",
      league: "Championship",
      league_tier: "Championship",
      founded_year: 1987,
      stadium: "Meadowbrook Park",
      website: "https://meadowbrookathletic.org.uk",
      description: "Championship club with 8,000 average attendance. Strong community presence.",
      contact_name: "Sarah Webb",
      contact_email: "corporate@meadowbrookathletic.org.uk",
      contact_role: "Head of Digital",
      contact_phone: "+44 121 555 0123",
      social_twitter: "https://twitter.com/MeadowbrookAth",
      social_instagram: "https://instagram.com/meadowbrookathletic",
      social_facebook: "https://facebook.com/meadowbrookathletic",
      funding_amount: 750000,
      funding_currency: "GBP",
      funding_purpose: "Build fan loyalty ecosystem and increase merchandise sales",
      funding_duration_months: 12,
      what_club_offers: "8,000 active fans, merchandise partnerships, match day activations",
      why_fofa: "FOFA aligns with our vision of giving fans a voice and rewarding loyalty.",
    },
    expectedDecision: "approved",
  },
  {
    name: "Suspicious - Gmail Email + High Funding",
    data: {
      club_name: "Red Star United",
      country: "England",
      league: "League One",
      league_tier: "League One",
      founded_year: 2015,
      stadium: "City Sports Complex",
      website: "https://redstarunited.com",
      description: "Growing club with ambitions",
      contact_name: "Unknown Person",
      contact_email: "info.redstar@gmail.com",
      contact_role: "Manager",
      contact_phone: "",
      social_twitter: "",
      social_instagram: "",
      social_facebook: "",
      funding_amount: 5000000,
      funding_currency: "GBP",
      funding_purpose: "Build infrastructure",
      funding_duration_months: 12,
      what_club_offers: "Access to 3,000 fans",
      why_fofa: "We want FOFA",
    },
    expectedDecision: "needs_review",
  },
];

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(FOFA_API_URL + path);
    const protocol = url.protocol === "https:" ? https : http;

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "FOFA-Test-Harness/1.0",
      },
    };

    const req = protocol.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("\n" + "=".repeat(80));
  console.log("FOFA AI Club Verification Test Suite");
  console.log("=".repeat(80));
  console.log(`\nTarget API: ${FOFA_API_URL}`);
  console.log(`Gemini API Key: ${GEMINI_API_KEY ? "✓ Set" : "✗ NOT SET"}\n`);

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    console.log("\n" + "-".repeat(80));
    console.log(`TEST: ${testCase.name}`);
    console.log("-".repeat(80));

    try {
      console.log("\n📋 Submitting application...");
      const response = await makeRequest("POST", "/api/clubs/apply", testCase.data);

      if (response.status !== 201) {
        console.error(`❌ FAILED: Status ${response.status}`);
        console.error(`Response: ${JSON.stringify(response.body, null, 2)}`);
        failed++;
        continue;
      }

      const result = response.body;
      console.log(`✓ Application submitted (ID: ${result.application_id})`);

      const aiDecision = result.ai_decision;
      const aiResponse = result.ai_response;

      console.log(`\n🤖 AI Decision: ${aiDecision ? aiDecision.toUpperCase() : "UNKNOWN"}`);
      console.log(`   Response: ${aiResponse}`);

      const isCorrect =
        aiDecision === testCase.expectedDecision ||
        (testCase.expectedDecision === "needs_review" && aiDecision !== "approved" && aiDecision !== "rejected");

      if (isCorrect) {
        console.log(`\n✅ PASS: Decision matches expectation (${testCase.expectedDecision})`);
        passed++;
      } else {
        console.log(`\n❌ FAIL: Expected ${testCase.expectedDecision}, got ${aiDecision}`);
        failed++;
      }
    } catch (error) {
      console.error(`\n❌ ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("TEST SUMMARY");
  console.log("=".repeat(80));
  console.log(`\nTotal Tests: ${TEST_CASES.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / TEST_CASES.length) * 100).toFixed(1)}%\n`);

  if (failed === 0) {
    console.log("🎉 All tests passed! Gemini integration is working correctly.\n");
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Check AI decisions above.\n`);
  }
}

runTests().catch((error) => {
  console.error("\n❌ Test error:", error);
  process.exit(1);
});
