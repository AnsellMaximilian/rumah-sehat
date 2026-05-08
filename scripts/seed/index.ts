
import { authSeeder } from "@/scripts/seed/seeders/auth";


import {
  getStringFlag,
  isSeedVerbose,
  parseSeedArgs,
  resolveSeedExecutionOrder,
  type Seeder,
} from "@/scripts/seed/lib";

const seedRegistry: Record<string, Seeder> = {
  auth: authSeeder,
};

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runSeederWithRetry(input: {
  seeder: Seeder;
  maxAttempts: number;
  verbose: boolean;
  run: () => Promise<void>;
}) {
  let attempt = 0;

  while (attempt < input.maxAttempts) {
    attempt += 1;

    const startedAt = new Date();

    if (input.verbose) {
      console.log(
        `[seed] starting ${input.seeder.name} attempt=${attempt}/${input.maxAttempts} at ${startedAt.toISOString()}`,
      );
    }

    try {
      await input.run();

      if (input.verbose) {
        console.log(
          `[seed] completed ${input.seeder.name} attempt=${attempt}/${input.maxAttempts} at ${new Date().toISOString()}`,
        );
      }

      return;
    } catch (error) {
      const isLastAttempt = attempt >= input.maxAttempts;

      if (isLastAttempt) {
        throw error;
      }

      const backoffMs = 1_000 * 2 ** (attempt - 1);
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Unknown seed error";

      console.warn(
        `[seed] ${input.seeder.name} failed on attempt ${attempt}/${input.maxAttempts}: ${message}`,
      );
      console.warn(
        `[seed] retrying ${input.seeder.name} in ${backoffMs}ms`,
      );

      await sleep(backoffMs);
    }
  }
}

async function main() {
  const args = parseSeedArgs(process.argv.slice(2));

  if (args.flags.help) {
    console.log(
      "Usage: pnpm seed -- [all|auth|customers|currencies|items|exchange-rates]",
    );
    console.log(
      "                    [discount-policies]",
    );
    console.log("Optional flags:");
    console.log("  --super-admin-email=<email>");
    console.log("  --verbose");
    console.log("  --retries=<number>");
    return;
  }

  const executionOrder = resolveSeedExecutionOrder(args.positional, seedRegistry);
  const verbose = isSeedVerbose(args);
  const maxAttempts = Math.max(
    Number.parseInt(getStringFlag(args, "retries") ?? "3", 10) || 3,
    1,
  );

  console.log(
    `Running seeders: ${executionOrder.map((seeder) => seeder.name).join(", ")}`,
  );
  if (verbose) {
    console.log(`[seed] verbose logging enabled`);
  }
  console.log(`[seed] max attempts per seeder: ${maxAttempts}`);

  for (const seeder of executionOrder) {
    await runSeederWithRetry({
      seeder,
      maxAttempts,
      verbose,
      run: () => seeder.run({ args }),
    });
  }

  console.log("Seeding complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});