import { createHash } from "node:crypto";

export type SeedArgs = {
  positional: string[];
  flags: Record<string, string | boolean>;
};

export type SeederContext = {
  args: SeedArgs;
};

export type Seeder = {
  name: string;
  description: string;
  dependsOn?: string[];
  run: (context: SeederContext) => Promise<void>;
};

export function parseSeedArgs(argv: string[]): SeedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (const arg of argv) {
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const withoutPrefix = arg.slice(2);
    const separatorIndex = withoutPrefix.indexOf("=");

    if (separatorIndex === -1) {
      flags[withoutPrefix] = true;
      continue;
    }

    const key = withoutPrefix.slice(0, separatorIndex);
    const value = withoutPrefix.slice(separatorIndex + 1);
    flags[key] = value;
  }

  return {
    positional,
    flags,
  };
}

export function getFlag(
  args: SeedArgs,
  key: string,
): string | boolean | undefined {
  return args.flags[key];
}

export function getStringFlag(args: SeedArgs, key: string): string | undefined {
  const value = getFlag(args, key);

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function hasBooleanFlag(args: SeedArgs, key: string) {
  return getFlag(args, key) === true;
}

export function isSeedVerbose(args: SeedArgs) {
  return hasBooleanFlag(args, "verbose") || hasBooleanFlag(args, "debug");
}

export function resolveSeedExecutionOrder(
  requestedSeeds: string[],
  registry: Record<string, Seeder>,
): Seeder[] {
  const requested =
    requestedSeeds.length === 0 || requestedSeeds.includes("all")
      ? Object.keys(registry)
      : requestedSeeds;

  const resolved = new Set<string>();
  const visiting = new Set<string>();

  function visit(seedName: string) {
    const seeder = registry[seedName];

    if (!seeder) {
      throw new Error(`Unknown seeder "${seedName}"`);
    }

    if (resolved.has(seedName)) {
      return;
    }

    if (visiting.has(seedName)) {
      throw new Error(`Circular seeder dependency detected at "${seedName}"`);
    }

    visiting.add(seedName);

    for (const dependency of seeder.dependsOn ?? []) {
      visit(dependency);
    }

    visiting.delete(seedName);
    resolved.add(seedName);
  }

  for (const seedName of requested) {
    visit(seedName);
  }

  return [...resolved].map((seedName) => registry[seedName]);
}

export function deterministicTextId(namespace: string, value: string): string {
  return createHash("sha1")
    .update(`${namespace}:${value}`)
    .digest("hex")
    .slice(0, 21);
}

export function deterministicUuid(namespace: string, value: string): string {
  const hash = createHash("sha1")
    .update(`${namespace}:${value}`)
    .digest("hex")
    .slice(0, 32)
    .split("");

  hash[12] = "5";
  hash[16] = ((Number.parseInt(hash[16], 16) & 0x3) | 0x8).toString(16);

  return [
    hash.slice(0, 8).join(""),
    hash.slice(8, 12).join(""),
    hash.slice(12, 16).join(""),
    hash.slice(16, 20).join(""),
    hash.slice(20, 32).join(""),
  ].join("-");
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}