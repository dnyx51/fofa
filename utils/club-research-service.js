/**
 * Enhanced Club Research & Verification Service
 * 
 * Uses Gemini 2.0 Flash to:
 * 1. Research the club (website, social media, founding, league)
 * 2. Verify legitimacy based on real evidence
 * 3. Check funding reasonableness
 * 4. Generate detailed report with sources
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const LEAGUE_NORMS = {
  "Premier League": { avg: 5000000, max: 50000000 },
  "Championship": { avg: 1500000, max: 10000000 },
  "League One": { avg: 500000, max: 3000000 },
  "League Two": { avg: 200000, max: 1500000 },
  "National League": { avg: 100000, max: 500000 },
  "Non-League": { avg: 25000, max: 200000 },
  "Bundesliga": { avg: 8000000, max: 60000000 },
  "2. Bundesliga": { avg: 2000000, max: 15000000 },
  "3. Liga": { avg: 500000, max: 3000000 },
  "Serie A": { avg: 6000000, max: 70000000 },
  "Serie B": { avg: 1000000, max: 8000000 },
  "La Liga": { avg: 5000000, max: 60000000 },
  "Segunda División": { avg: 800000, max: 5000000 },
  "Ligue 1": { avg: 4000000, max: 50000000 },
  "Ligue 2": { avg: 1000000, max: 8000000 },
  "Eredivisie": { avg: 2000000, max: 20000000 },
  "Primeira Liga": { avg: 2000000, max: 15000000 },
  "Super Lig": { avg: 1500000, max: 12000000 },
};

/**
 * Research a club using Gemini
 * Returns: {
 *   exists: boolean,
 *   name: string,
 *   founded: number,
 *   country: string,
 *   league: string,
 *   stadium: string,
 *   website: string,
 *   social: { twitter, instagram, facebook, youtube, tiktok },
 *   fanBase: number (estimated),
 *   reputability: "verified" | "likely" | "unverified" | "suspicious",
 *   sources: string[],
 *   notes: string
 * }
 */
export async function researchClub(clubData) {
  if (!GEMINI_API_KEY) {
    console.warn("⚠️  GEMINI_API_KEY not set. Using basic verification.");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const researchPrompt = `You are a football club researcher. Research the following club and provide detailed information.

**Club to Research:**
- Name: ${clubData.club_name}
- Country: ${clubData.country}
- League: ${clubData.league || "Unknown"}
- Stadium: ${clubData.stadium || "Not provided"}
- Website: ${clubData.website || "Not provided"}

**Your task:**
1. Determine if this club ACTUALLY EXISTS and is legitimate
2. Find their official website, social media (Twitter, Instagram, Facebook, YouTube, TikTok)
3. When was the club founded?
4. What is their stadium/home ground?
5. How many fans/supporters do they have?
6. What is their current league tier and country?
7. Is there verified information about them online?

**Respond in JSON format:**
{
  "exists": true/false,
  "name": "official club name",
  "founded": 1950,
  "country": "England",
  "league": "Premier League",
  "leagueTier": "1st",
  "stadium": "Official Stadium Name",
  "website": "https://official-website.com",
  "social": {
    "twitter": "https://twitter.com/...",
    "instagram": "https://instagram.com/...",
    "facebook": "https://facebook.com/...",
    "youtube": "https://youtube.com/...",
    "tiktok": "https://tiktok.com/..."
  },
  "fanBase": 15000,
  "reputability": "verified|likely|unverified|suspicious",
  "sources": ["source 1", "source 2"],
  "notes": "Research findings and any red flags"
}

Only respond with valid JSON, no additional text.`;

    const response = await model.generateContent(researchPrompt);
    const responseText = response.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not parse Gemini response as JSON");
      return null;
    }

    const researchResult = JSON.parse(jsonMatch[0]);
    return researchResult;
  } catch (error) {
    console.error("Club research error:", error.message);
    return null;
  }
}

/**
 * Verify club application with detailed research
 */
export async function verifyClubApplicationEnhanced(application) {
  try {
    // Step 1: Research the club
    const research = await researchClub(application);

    // Step 2: Verify legitimacy based on research
    const legitimacyChecks = {
      clubExists: research?.exists || false,
      hasOfficialWebsite:
        research?.website &&
        research.website.includes(
          application.club_name
            .toLowerCase()
            .replace(/\s+/g, "")
        ),
      hasMultipleSocialMedia:
        (research?.social?.twitter ? 1 : 0) +
        (research?.social?.instagram ? 1 : 0) +
        (research?.social?.facebook ? 1 : 0) +
        (research?.social?.youtube ? 1 : 0) >=
        2,
      hasVerifiedHistory: research?.founded && research.founded < 2020,
      reputabilityVerified: research?.reputability === "verified",
      reputabilityLikely: research?.reputability === "likely",
      reputabilitySuspicious: research?.reputability === "suspicious",
    };

    // Step 3: Check funding reasonableness
    const leagueNorm = LEAGUE_NORMS[application.league] || {
      avg: 100000,
      max: 1000000,
    };
    const fundingAmount = application.funding_amount || 0;
    const fundingIsReasonable =
      fundingAmount <= leagueNorm.max &&
      fundingAmount >= leagueNorm.avg * 0.1;
    const fundingIsAnomalous = fundingAmount > leagueNorm.max * 2;

    // Step 4: Generate decision
    let decision = "approved";
    let confidence = 0.85;
    const redFlags = [];

    if (!legitimacyChecks.clubExists) {
      decision = "rejected";
      confidence = 0.95;
      redFlags.push("Club does not appear to exist in public records");
    }

    if (
      legitimacyChecks.reputabilitySuspicious ||
      !legitimacyChecks.reputabilityVerified
    ) {
      if (legitimacyChecks.reputabilitySuspicious) {
        redFlags.push("Research indicates suspicious club");
        confidence = Math.max(0.8, confidence - 0.2);
      } else if (!legitimacyChecks.reputabilityVerified) {
        redFlags.push("Club legitimacy could not be fully verified");
        confidence = Math.max(0.6, confidence - 0.15);
      }
    }

    if (!legitimacyChecks.hasOfficialWebsite) {
      redFlags.push(
        `Club website could not be verified or does not match "${application.club_name}"`
      );
      confidence = Math.max(0.5, confidence - 0.15);
    }

    if (!legitimacyChecks.hasMultipleSocialMedia) {
      redFlags.push("Minimal social media presence (less than 2 verified accounts)");
      confidence = Math.max(0.6, confidence - 0.1);
    }

    if (fundingIsAnomalous) {
      redFlags.push(
        `Funding request (${application.funding_currency} ${fundingAmount.toLocaleString()}) is ${(fundingAmount / leagueNorm.max).toFixed(1)}x the typical max for ${application.league}`
      );
      confidence = Math.max(0.5, confidence - 0.2);
      if (confidence < 0.65) {
        decision = "needs_review";
      }
    } else if (!fundingIsReasonable) {
      redFlags.push(
        `Funding request seems unusual for ${application.league} tier`
      );
      confidence = Math.max(0.65, confidence - 0.1);
    }

    // If multiple red flags, escalate to needs_review
    if (redFlags.length >= 3 && decision !== "rejected") {
      decision = "needs_review";
      confidence = Math.max(0.5, confidence - 0.15);
    }

    // Build reasoning string
    const reasoning = buildReasoningText(
      application,
      research,
      legitimacyChecks,
      fundingIsReasonable,
      leagueNorm,
      redFlags
    );

    return {
      decision,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
      checks: {
        clubExists: legitimacyChecks.clubExists,
        website: research?.website || null,
        socialMedia: research?.social || {},
        founded: research?.founded || null,
        fanBase: research?.fanBase || null,
        league: research?.league || null,
        stadium: research?.stadium || null,
        fundingNormAvg: leagueNorm.avg,
        fundingNormMax: leagueNorm.max,
        redFlags,
      },
      research,
    };
  } catch (error) {
    console.error("Verification error:", error);
    return {
      decision: "needs_review",
      confidence: 0.5,
      reasoning: `Verification could not complete: ${error.message}`,
      checks: { error: true },
      research: null,
    };
  }
}

/**
 * Build human-readable reasoning text
 */
function buildReasoningText(
  application,
  research,
  checks,
  fundingReasonable,
  leagueNorm,
  redFlags
) {
  const parts = [];

  if (!research) {
    parts.push(
      "⚠️ Research phase could not complete. Decision based on form data only."
    );
  } else {
    parts.push(`✓ Research conducted on "${application.club_name}"`);

    if (checks.clubExists) {
      parts.push(
        `✓ Club verified to exist: Founded ${research.founded}, plays in ${research.league}`
      );
    } else {
      parts.push(`✗ Club does not appear to exist in public records`);
    }

    if (checks.hasOfficialWebsite && research.website) {
      parts.push(`✓ Official website verified: ${research.website}`);
    } else {
      parts.push(`✗ Could not verify official website`);
    }

    if (checks.hasMultipleSocialMedia) {
      const socials = Object.entries(research.social || {})
        .filter(([key, url]) => url)
        .map(([key]) => key)
        .join(", ");
      parts.push(`✓ Multi-platform presence verified: ${socials}`);
    } else {
      parts.push(`⚠️ Limited social media presence`);
    }

    if (research.fanBase) {
      parts.push(`✓ Estimated fan base: ${research.fanBase.toLocaleString()}`);
    }

    parts.push(`\nReputability: ${research.reputability.toUpperCase()}`);
  }

  parts.push(`\nFunding Analysis:`);
  parts.push(
    `- Requested: ${application.funding_currency} ${(application.funding_amount || 0).toLocaleString()}`
  );
  parts.push(
    `- League norms for ${application.league}: Avg ${leagueNorm.avg.toLocaleString()}, Max ${leagueNorm.max.toLocaleString()}`
  );
  parts.push(
    `- Reasonableness: ${fundingReasonable ? "✓ Within expected range" : "⚠️ Outside typical range"}`
  );

  if (redFlags.length > 0) {
    parts.push(`\n🚩 Red Flags (${redFlags.length}):`);
    redFlags.forEach((flag) => parts.push(`  - ${flag}`));
  } else {
    parts.push(`\n✓ No major red flags detected`);
  }

  return parts.join("\n");
}