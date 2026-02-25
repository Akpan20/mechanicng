import "dotenv/config";
import fetch from "node-fetch";

async function main() {
  const base = process.env.BASE_URL ?? "http://localhost:4000";
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "Secret123";

  console.log("Logging in as admin...");
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!loginRes.ok) {
    console.error("Login failed:", await loginRes.text());
    process.exit(2);
  }
  const { token } = await loginRes.json();
  console.log("Token received");

  console.log("Fetching admin mechanics (limit=2)...");
  const listRes = await fetch(`${base}/api/admin/mechanics?limit=2&page=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) {
    console.error("Failed to list mechanics:", await listRes.text());
    process.exit(2);
  }
  const data = await listRes.json();
  console.log("Mechanics count:", data.mechanics?.length);

  if (data.mechanics && data.mechanics.length > 0) {
    const id = data.mechanics[0].id;
    console.log("Toggling status for mechanic", id);
    const patchRes = await fetch(`${base}/api/admin/mechanics/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "approved" }),
    });
    console.log("PATCH status response:", patchRes.status);
    const patched = await patchRes.json();
    console.log("Response body:", patched);
  } else {
    console.log("No mechanics to patch");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
