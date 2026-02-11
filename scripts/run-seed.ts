import { seedDatabase } from "../server/seed";

async function main() {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (err) {
    console.error("[Seed] Error:", err);
    process.exit(1);
  }
}

main();
