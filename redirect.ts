import { parseArgs } from "jsr:@std/cli@1.0.15/parse-args";
import * as path from "jsr:@std/path@1.0.8";
import { ensureDir } from "jsr:@std/fs@1.0.15/ensure-dir";
import { which } from "jsr:@david/which@0.4.1";

import { homedir } from "node:os";
const HOME = homedir();
const BIN_DIR = path.join(HOME, ".local", "share", "redirector");

async function createSymlink(source: string, target: string) {
  try {
    // Remove existing symlink if it exists
    try {
      await Deno.remove(target);
      // console.log(`Removed existing symlink at ${target}`);
    } catch (_) {
      // Ignore if it doesn't exist
    }

    await Deno.symlink(source, target);
    // console.log(`Created symlink: ${target} -> ${source}`);
  } catch (error) {
    console.error(`Failed to create symlink: ${error}`);
    throw error;
  }
}

async function main() {
  const args = parseArgs(Deno.args, {
    string: ["from", "to"],
    boolean: ["help"],
    alias: { h: "help", f: "from", t: "to" },
  });

  if (args.help || !args.from || !args.to) {
    console.log(`
Usage: rd --from <program> --to <program> -- [command to run with new program]

Options:
  --from, -f    The program to replace (e.g., node, deno, bun)
  --to, -t      The program to switch to
  --help, -h    Show this help message

Example:
  rd --from ls --to exa -- npx create-react-app my-app
    `);
    return;
  }

  const fromProgram = args.from;
  const toProgram = args.to;
  const remainingArgs = args._.length > 0 ? args._ : null;

  // Find paths of both runtimes
  const fromProgramPath = await which(fromProgram);
  const toProgramPath = await which(toProgram);

  if (!toProgramPath || !fromProgramPath) {
    console.error(
      `Error: '${toProgram}' or '${fromProgram}' is not installed or not in PATH.`,
    );
    Deno.exit(1);
  }

  // Create ~/.local/bin if it doesn't exist
  await ensureDir(BIN_DIR);

  // Create a symlink from the toRuntime to the fromRuntime name
  const symlinkPath = path.join(BIN_DIR, fromProgram);
  await createSymlink(toProgramPath, symlinkPath);

  // Add ~/.local/bin to PATH if not already present
  const env = Deno.env.toObject();
  env.PATH = `${BIN_DIR}:${env.PATH}`;

  // console.log(
  //   `Successfully configured '${fromProgram}' to use '${toProgram}' (${toProgramPath})`,
  // );

  // Execute remaining command if provided
  if (remainingArgs) {
    // console.log(`\nExecuting: ${remainingArgs.join(" ")}\n`);

    const proc = new Deno.Command(remainingArgs[0].toString(), {
      args: remainingArgs.slice(1).map(String),
      env,
    });

    const status = await proc.spawn().status;
    Deno.exit(status.code);
  }
}

await main();
