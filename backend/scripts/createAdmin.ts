import "dotenv/config";
import { connectDB } from "../src/lib/db";
import { User } from "../src/models/User";

async function main() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const fullName = process.env.ADMIN_FULLNAME || process.argv[4] || "Admin";
  const adminSecret = process.env.ADMIN_SECRET || process.argv[5];

  if (!email || !password) {
    console.error(
      "Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... [ADMIN_FULLNAME] [ADMIN_SECRET] or pass args: <email> <password> [fullName] [adminSecret]",
    );
    process.exit(2);
  }

  const ADMIN_SECRET =
    process.env.ADMIN_SECRET ?? adminSecret ?? "dev-admin-secret";
  if (!ADMIN_SECRET) {
    console.error("ADMIN_SECRET is not set");
    process.exit(2);
  }

  // If a secret was provided via arg/env, require it to match the server ADMIN_SECRET
  if (adminSecret && adminSecret !== ADMIN_SECRET) {
    console.error(
      "Provided admin secret does not match ADMIN_SECRET. Aborting.",
    );
    process.exit(2);
  }

  try {
    await connectDB();

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.error("An admin already exists. Aborting.");
      process.exit(1);
    }

    const user = await User.create({
      email,
      password,
      fullName,
      role: "admin",
    });
    console.log("Created admin:", {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    });
    process.exit(0);
  } catch (err: any) {
    console.error("Error creating admin:", err.message || err);
    process.exit(1);
  }
}

main();
