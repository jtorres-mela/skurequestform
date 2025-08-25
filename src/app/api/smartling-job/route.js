import { NextResponse } from "next/server";
export async function POST(req) {
  try {
    console.log("[Smartling API] POST /api/smartling-job called");
    if (!req) {
      return NextResponse.json({ error: "No request object received." }, { status: 400 });
    }
    const body = await req.json();
    const { selectedData, jobTitle } = body;
    // Require credentials from request only
    const SMARTLING_USER_ID = body.userId;
    const SMARTLING_USER_KEY = body.userKey;
    const SMARTLING_PROJECT_ID = body.projectId;
    if (!SMARTLING_USER_ID || !SMARTLING_USER_KEY || !SMARTLING_PROJECT_ID) {
      return NextResponse.json({ error: "Missing Smartling credentials. Please provide User ID, User Key, and Project ID." }, { status: 400 });
    }

    // 1. Authenticate and get access token
    const authResp = await fetch("https://api.smartling.com/auth-api/v2/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIdentifier: SMARTLING_USER_ID,
        userSecret: SMARTLING_USER_KEY,
      }),
    });
    if (!authResp.ok) {
      const err = await authResp.text();
      return NextResponse.json({ error: "Smartling auth failed", details: err }, { status: 500 });
    }
    const authData = await authResp.json();
    const token = authData.response.data.accessToken;
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    // 2. Create the job
    const jobsResp = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${SMARTLING_PROJECT_ID}/jobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jobName: jobTitle || selectedData.productName || selectedData.sku || "New SKU Job",
        targetLocaleIds: ["es-US"],
        description: selectedData.shortDescription || "Automated job creation from form",
      }),
    });
    if (!jobsResp.ok) {
      const err = await jobsResp.text();
      return NextResponse.json({ error: "Smartling job creation failed", details: err }, { status: 500 });
    }
    const jobData = await jobsResp.json();
    const jobUid = jobData.response.data.translationJobUid;

    // 3. Upload only selected strings
    // selectedData is now expected to be an object with only the selected fields
    const selectedStrings = Object.entries(selectedData)
      .filter(([key, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => ({ stringText: String(value) }));
    if (selectedStrings.length === 0) {
      return NextResponse.json({ error: "No fields selected for translation." }, { status: 400 });
    }
    const stringsPayload = { strings: selectedStrings };
    const stringsResp = await fetch(`https://api.smartling.com/strings-api/v2/projects/${SMARTLING_PROJECT_ID}`, {
      method: "POST",
      headers,
      body: JSON.stringify(stringsPayload),
    });
    if (!stringsResp.ok) {
      const err = await stringsResp.text();
      return NextResponse.json({ error: "Smartling string upload failed", details: err }, { status: 500 });
    }
    const stringsData = await stringsResp.json();

    // 4. Add the strings to the job
    const hashcodes = (stringsData.response.data.items || []).map((s) => s.hashcode);
    const jobStringsResp = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${SMARTLING_PROJECT_ID}/jobs/${jobUid}/strings/add`, {
      method: "POST",
      headers,
      body: JSON.stringify({ hashcodes }),
    });
    if (!jobStringsResp.ok) {
      const err = await jobStringsResp.text();
      return NextResponse.json({ error: "Failed to add strings to Smartling job", details: err }, { status: 500 });
    }

    return NextResponse.json({ success: true, jobUid });
  } catch (err) {
    // Always return a JSON error response
    let message = "Unknown error";
    if (err && typeof err === "object" && "message" in err) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}