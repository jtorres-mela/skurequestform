import { NextResponse } from "next/server";
export async function POST(req) {
  try {
    let jobUidUS;
    let jobUidCA;
    console.log("[Smartling API] POST /api/smartling-job called");

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error("[Smartling API] Failed to parse JSON body", parseErr);
      return NextResponse.json({ error: "Failed to parse JSON body", details: String(parseErr) }, { status: 400 });
    }
    console.log("[Smartling API] Body parsed", body);
    const { selectedData, jobTitle } = body;
  const SMARTLING_USER_ID_US = body.userIdUS;
  const SMARTLING_USER_KEY_US = body.userKeyUS;
  const SMARTLING_PROJECT_ID_US = body.projectIdUS;
  const SMARTLING_USER_ID_CA = body.userIdCA;
  const SMARTLING_USER_KEY_CA = body.userKeyCA;
  const SMARTLING_PROJECT_ID_CA = body.projectIdCA;
    if (!selectedData || typeof selectedData !== 'object') {
      console.error("[Smartling API] selectedData missing or not an object", selectedData);
      return NextResponse.json({ error: "selectedData missing or not an object" }, { status: 400 });
    }
    console.log("[Smartling API] Credentials received", {
      SMARTLING_USER_ID_US,
      SMARTLING_PROJECT_ID_US,
      SMARTLING_USER_ID_CA,
      SMARTLING_PROJECT_ID_CA,
      selectedKeys: Object.keys(selectedData || {})
    });
    if (!SMARTLING_USER_ID_US || !SMARTLING_USER_KEY_US || !SMARTLING_PROJECT_ID_US || !SMARTLING_USER_ID_CA || !SMARTLING_USER_KEY_CA || !SMARTLING_PROJECT_ID_CA) {
      console.error("[Smartling API] Missing credentials");
      return NextResponse.json({ error: "Missing Smartling credentials. Please provide User ID, User Key, and Project ID for both US and CA." }, { status: 400 });
    }


    // 1. Authenticate and get access token for US
    const authRespUS = await fetch("https://api.smartling.com/auth-api/v2/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIdentifier: SMARTLING_USER_ID_US,
        userSecret: SMARTLING_USER_KEY_US,
      }),
    });
    if (!authRespUS.ok) {
      const err = await authRespUS.text();
      console.error("[Smartling API] Auth failed (US)", err);
      return NextResponse.json({ error: "Smartling auth failed (US)", details: err }, { status: 500 });
    }
    const authDataUS = await authRespUS.json();
    const tokenUS = authDataUS.response.data.accessToken;
    const headersUS = { Authorization: `Bearer ${tokenUS}`, "Content-Type": "application/json" };

    // 2. Create US job (enUS → esUS)
    const jobsRespUS = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${SMARTLING_PROJECT_ID_US}/jobs`, {
      method: "POST",
      headers: headersUS,
      body: JSON.stringify({
        jobName: jobTitle ? jobTitle + " (US)" : "New SKU Job (US)",
        targetLocaleIds: ["es-US"],
        description: selectedData.shortDescription || "Automated job creation from form",
        sourceLocaleId: "en-US",
      }),
    });
    if (!jobsRespUS.ok) {
      const err = await jobsRespUS.text();
      console.error("[Smartling API] US job creation failed", err);
      return NextResponse.json({ error: "Smartling US job creation failed", details: err }, { status: 500 });
    }
  const jobDataUS = await jobsRespUS.json();
  jobUidUS = jobDataUS.response.data.translationJobUid;

    // 3. Upload strings to US project
    const selectedStrings = Object.entries(selectedData)
      .filter(([key, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => ({ stringText: String(value) }));
    if (selectedStrings.length === 0) {
      return NextResponse.json({ error: "No fields selected for translation." }, { status: 400 });
    }
    const stringsPayload = { strings: selectedStrings };

    const stringsRespUS = await fetch(`https://api.smartling.com/strings-api/v2/projects/${SMARTLING_PROJECT_ID_US}`, {
      method: "POST",
      headers: headersUS,
      body: JSON.stringify(stringsPayload),
    });
    if (!stringsRespUS.ok) {
      const err = await stringsRespUS.text();
      console.error("[Smartling API] US string upload failed", err);
      return NextResponse.json({ error: "Smartling US string upload failed", details: err }, { status: 500 });
    }
    const stringsDataUS = await stringsRespUS.json();
    const hashcodesUS = (stringsDataUS.response.data.items || []).map((s) => s.hashcode);
    const jobStringsRespUS = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${SMARTLING_PROJECT_ID_US}/jobs/${jobUidUS}/strings/add`, {
      method: "POST",
      headers: headersUS,
      body: JSON.stringify({ hashcodes: hashcodesUS }),
    });
    if (!jobStringsRespUS.ok) {
      const err = await jobStringsRespUS.text();
      console.error("[Smartling API] Failed to add strings to US job", err);
      return NextResponse.json({ error: "Failed to add strings to Smartling US job", details: err }, { status: 500 });
    }

    // 4. Authenticate and get access token for CA
    const authRespCA = await fetch("https://api.smartling.com/auth-api/v2/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIdentifier: SMARTLING_USER_ID_CA,
        userSecret: SMARTLING_USER_KEY_CA,
      }),
    });
    if (!authRespCA.ok) {
      const err = await authRespCA.text();
      console.error("[Smartling API] Auth failed (CA)", err);
      return NextResponse.json({ error: "Smartling auth failed (CA)", details: err }, { status: 500 });
    }
    const authDataCA = await authRespCA.json();
    const tokenCA = authDataCA.response.data.accessToken;
    const headersCA = { Authorization: `Bearer ${tokenCA}`, "Content-Type": "application/json" };

    // 5. Create CA job (enCA → frCA)
    const jobsRespCA = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${SMARTLING_PROJECT_ID_CA}/jobs`, {
      method: "POST",
      headers: headersCA,
      body: JSON.stringify({
        jobName: jobTitle ? jobTitle + " (CA)" : "New SKU Job (CA)",
        targetLocaleIds: ["fr-CA"],
        description: selectedData.shortDescription || "Automated job creation from form",
        sourceLocaleId: "en-CA",
      }),
    });
    if (!jobsRespCA.ok) {
      const err = await jobsRespCA.text();
      console.error("[Smartling API] CA job creation failed", err);
      return NextResponse.json({ error: "Smartling CA job creation failed", details: err }, { status: 500 });
    }
    const jobDataCA = await jobsRespCA.json();
    jobUidCA = jobDataCA.response.data.translationJobUid;

    // 6. Upload strings to CA project
    const stringsRespCA = await fetch(`https://api.smartling.com/strings-api/v2/projects/${SMARTLING_PROJECT_ID_CA}`, {
      method: "POST",
      headers: headersCA,
      body: JSON.stringify(stringsPayload),
    });
    if (!stringsRespCA.ok) {
      const err = await stringsRespCA.text();
      console.error("[Smartling API] CA string upload failed", err);
      return NextResponse.json({ error: "Smartling CA string upload failed", details: err }, { status: 500 });
    }
    const stringsDataCA = await stringsRespCA.json();
    const hashcodesCA = (stringsDataCA.response.data.items || []).map((s) => s.hashcode);
    const jobStringsRespCA = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${SMARTLING_PROJECT_ID_CA}/jobs/${jobUidCA}/strings/add`, {
      method: "POST",
      headers: headersCA,
      body: JSON.stringify({ hashcodes: hashcodesCA }),
    });
    if (!jobStringsRespCA.ok) {
      const err = await jobStringsRespCA.text();
      console.error("[Smartling API] Failed to add strings to CA job", err);
      return NextResponse.json({ error: "Failed to add strings to Smartling CA job", details: err }, { status: 500 });
    }

    return NextResponse.json({ success: true, jobUidUS, jobUidCA });
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