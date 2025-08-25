import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function POST(req) {
  try {
    console.log("[Smartling API] POST /api/smartling-job called");
    let body;
    try {
      body = await req.json();
    } catch (parseErr) {
      return NextResponse.json({ error: "Failed to parse JSON body", details: String(parseErr) }, { status: 400 });
    }
  const { selectedData, jobTitle, selectedRegions, userIdUS, userKeyUS, projectIdUS, userIdCA, userKeyCA, projectIdCA, userIdEU, userKeyEU, projectIdEU, targetLocalesEU, authorizeJobs, productId } = body;
    if (!selectedData || typeof selectedData !== 'object') {
      return NextResponse.json({ error: "selectedData missing or not an object" }, { status: 400 });
    }
    const selectedStrings = Object.entries(selectedData)
      .filter(([key, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => ({ stringText: String(value) }));
    if (selectedStrings.length === 0) {
      return NextResponse.json({ error: "No fields selected for translation." }, { status: 400 });
    }
    const stringsPayload = { strings: selectedStrings };

  const results = {};
  // Track job UIDs by region
  const jobUids = {};

    // US
    if (selectedRegions && selectedRegions.US) {
        // Wait 2 seconds to allow Smartling to process the strings before authorizing
        if (authorizeJobs) {
          await new Promise(res => setTimeout(res, 2000));
        }
      try {
        if (!userIdUS || !userKeyUS || !projectIdUS) throw new Error("Missing US credentials");
        const authRespUS = await fetch("https://api.smartling.com/auth-api/v2/authenticate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIdentifier: userIdUS, userSecret: userKeyUS }),
        });
        if (!authRespUS.ok) throw new Error(await authRespUS.text());
        const authDataUS = await authRespUS.json();
        const tokenUS = authDataUS.response.data.accessToken;
        const headersUS = { Authorization: `Bearer ${tokenUS}`, "Content-Type": "application/json" };
        const jobsRespUS = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${projectIdUS}/jobs`, {
          method: "POST",
          headers: headersUS,
          body: JSON.stringify({
            jobName: jobTitle ? jobTitle + " (US)" : "New SKU Job (US)",
            targetLocaleIds: ["es-US"],
            description: selectedData.shortDescription || "Automated job creation from form",
            sourceLocaleId: "en-US",
          }),
        });
        if (!jobsRespUS.ok) throw new Error(await jobsRespUS.text());
        const jobDataUS = await jobsRespUS.json();
        const jobUidUS = jobDataUS.response.data.translationJobUid;
        const stringsRespUS = await fetch(`https://api.smartling.com/strings-api/v2/projects/${projectIdUS}`, {
          method: "POST",
          headers: headersUS,
          body: JSON.stringify(stringsPayload),
        });
        if (!stringsRespUS.ok) throw new Error(await stringsRespUS.text());
        const stringsDataUS = await stringsRespUS.json();
        const hashcodesUS = (stringsDataUS.response.data.items || []).map((s) => s.hashcode);
        const jobStringsRespUS = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${projectIdUS}/jobs/${jobUidUS}/strings/add`, {
          method: "POST",
          headers: headersUS,
          body: JSON.stringify({ hashcodes: hashcodesUS }),
        });
        if (!jobStringsRespUS.ok) throw new Error(await jobStringsRespUS.text());
        // Authorize job if requested (after strings are added)
        if (authorizeJobs) {
          const authJobRespUS = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${projectIdUS}/jobs/${jobUidUS}/authorize`, {
            method: "POST",
            headers: {
              Authorization: headersUS.Authorization,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({})
          });
          if (!authJobRespUS.ok) {
            const errorText = await authJobRespUS.text();
            console.error("Smartling US job authorization failed", {
              status: authJobRespUS.status,
              statusText: authJobRespUS.statusText,
              url: authJobRespUS.url,
              errorText
            });
            throw new Error("Failed to authorize US job: " + errorText);
          }
        }
  results.US = { success: true, jobUid: jobUidUS };
  jobUids.US = jobUidUS;
      } catch (err) {
        results.US = { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    // CA
    if (selectedRegions && selectedRegions.CA) {
        // Wait 2 seconds to allow Smartling to process the strings before authorizing
        if (authorizeJobs) {
          await new Promise(res => setTimeout(res, 2000));
        }
      try {
        if (!userIdCA || !userKeyCA || !projectIdCA) throw new Error("Missing CA credentials");
        const authRespCA = await fetch("https://api.smartling.com/auth-api/v2/authenticate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIdentifier: userIdCA, userSecret: userKeyCA }),
        });
        if (!authRespCA.ok) throw new Error(await authRespCA.text());
        const authDataCA = await authRespCA.json();
        const tokenCA = authDataCA.response.data.accessToken;
        const headersCA = { Authorization: `Bearer ${tokenCA}`, "Content-Type": "application/json" };
        const jobsRespCA = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${projectIdCA}/jobs`, {
          method: "POST",
          headers: headersCA,
          body: JSON.stringify({
            jobName: jobTitle ? jobTitle + " (CA)" : "New SKU Job (CA)",
            targetLocaleIds: ["fr-CA"],
            description: selectedData.shortDescription || "Automated job creation from form",
            sourceLocaleId: "en-CA",
          }),
        });
        if (!jobsRespCA.ok) throw new Error(await jobsRespCA.text());
        const jobDataCA = await jobsRespCA.json();
        const jobUidCA = jobDataCA.response.data.translationJobUid;
        const stringsRespCA = await fetch(`https://api.smartling.com/strings-api/v2/projects/${projectIdCA}`, {
          method: "POST",
          headers: headersCA,
          body: JSON.stringify(stringsPayload),
        });
        if (!stringsRespCA.ok) throw new Error(await stringsRespCA.text());
        const stringsDataCA = await stringsRespCA.json();
        const hashcodesCA = (stringsDataCA.response.data.items || []).map((s) => s.hashcode);
        const jobStringsRespCA = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${projectIdCA}/jobs/${jobUidCA}/strings/add`, {
          method: "POST",
          headers: headersCA,
          body: JSON.stringify({ hashcodes: hashcodesCA }),
        });
        if (!jobStringsRespCA.ok) throw new Error(await jobStringsRespCA.text());
        // Authorize job if requested (after strings are added)
        if (authorizeJobs) {
          const authJobRespCA = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${projectIdCA}/jobs/${jobUidCA}/authorize`, {
            method: "POST",
            headers: {
              Authorization: headersCA.Authorization,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({})
          });
          if (!authJobRespCA.ok) {
            const errorText = await authJobRespCA.text();
            console.error("Smartling CA job authorization failed", {
              status: authJobRespCA.status,
              statusText: authJobRespCA.statusText,
              url: authJobRespCA.url,
              errorText
            });
            throw new Error("Failed to authorize CA job: " + errorText);
          }
        }
  results.CA = { success: true, jobUid: jobUidCA };
  jobUids.CA = jobUidCA;
      } catch (err) {
        results.CA = { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    // EU
    if (selectedRegions && selectedRegions.EU) {
        // Wait 2 seconds to allow Smartling to process the strings before authorizing
        if (authorizeJobs) {
          await new Promise(res => setTimeout(res, 2000));
        }
      try {
        if (!userIdEU || !userKeyEU || !projectIdEU || !Array.isArray(targetLocalesEU) || targetLocalesEU.length === 0) throw new Error("Missing EU credentials or target locales");
        const authRespEU = await fetch("https://api.smartling.com/auth-api/v2/authenticate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIdentifier: userIdEU, userSecret: userKeyEU }),
        });
        if (!authRespEU.ok) throw new Error(await authRespEU.text());
        const authDataEU = await authRespEU.json();
        const tokenEU = authDataEU.response.data.accessToken;
        const headersEU = { Authorization: `Bearer ${tokenEU}`, "Content-Type": "application/json" };
        const jobsRespEU = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${projectIdEU}/jobs`, {
          method: "POST",
          headers: headersEU,
          body: JSON.stringify({
            jobName: jobTitle ? jobTitle + " (EU)" : "New SKU Job (EU)",
            targetLocaleIds: targetLocalesEU,
            description: selectedData.shortDescription || "Automated job creation from form",
            sourceLocaleId: "en-IE",
          }),
        });
        if (!jobsRespEU.ok) throw new Error(await jobsRespEU.text());
        const jobDataEU = await jobsRespEU.json();
        const jobUidEU = jobDataEU.response.data.translationJobUid;
        const stringsRespEU = await fetch(`https://api.smartling.com/strings-api/v2/projects/${projectIdEU}`, {
          method: "POST",
          headers: headersEU,
          body: JSON.stringify(stringsPayload),
        });
        if (!stringsRespEU.ok) throw new Error(await stringsRespEU.text());
        const stringsDataEU = await stringsRespEU.json();
        const hashcodesEU = (stringsDataEU.response.data.items || []).map((s) => s.hashcode);
        const jobStringsRespEU = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${projectIdEU}/jobs/${jobUidEU}/strings/add`, {
          method: "POST",
          headers: headersEU,
          body: JSON.stringify({ hashcodes: hashcodesEU }),
        });
        if (!jobStringsRespEU.ok) throw new Error(await jobStringsRespEU.text());
        // Authorize job if requested (after strings are added)
        if (authorizeJobs) {
          const authJobRespEU = await fetch(`https://api.smartling.com/jobs-api/v3/projects/${projectIdEU}/jobs/${jobUidEU}/authorize`, {
            method: "POST",
            headers: {
              Authorization: headersEU.Authorization,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({})
          });
          if (!authJobRespEU.ok) {
            const errorText = await authJobRespEU.text();
            console.error("Smartling EU job authorization failed", {
              status: authJobRespEU.status,
              statusText: authJobRespEU.statusText,
              url: authJobRespEU.url,
              errorText
            });
            throw new Error("Failed to authorize EU job: " + errorText);
          }
        }
  results.EU = { success: true, jobUid: jobUidEU };
  jobUids.EU = jobUidEU;
      } catch (err) {
        results.EU = { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    // Save jobUids to SubmissionProduct if we have at least one job created and have productId
    if ((jobUids.US || jobUids.CA || jobUids.EU) && productId) {
      try {
        const updated = await prisma.submissionProduct.update({
          where: { id: Number(productId) },
          data: { smartlingJobUids: jobUids }
        });
        results.dbUpdate = { id: updated.id };
      } catch (dbErr) {
        results.dbUpdate = { error: dbErr instanceof Error ? dbErr.message : String(dbErr) };
      }
    }
    return NextResponse.json(results);
  } catch (err) {
    let message = "Unknown error";
    if (err && typeof err === "object" && "message" in err) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}