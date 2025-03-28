# rd (redirector)

A simple CLI tool to temporarily remap commands in your shell. This is useful
for replacing one program with another during execution of a command. (linux
only for now)

## Installation

```bash
deno install --global -A jsr:@sigmasd/rd
```

Or run it directly:

```bash
deno run -A jsr:@sigmasd/rd --from <program> --to <program> -- [command to run]
```

## Usage

```bash
rd --from <program> --to <program> -- [command to run with new program]
```

### Options

- `--from`, `-f`: The program to replace (e.g., node, deno, bun)
- `--to`, `-t`: The program to substitute it with
- `--help`, `-h`: Show help message

### Examples

Replace `node` with `deno` for a specific command:

```bash
rd --from node --to deno -- npm init
```

Replace `ls` with `exa` (if you have exa installed):

```bash
rd --from ls --to exa -- find . -type f -name "*.js"
```

Run a Node.js command using Bun instead:

```bash
rd --from node --to bun -- npx create-react-app my-app
```

## How it works

`rd` creates a temporary symlink in `~/.local/share/redirector/` that points to
your "to" program but has the name of your "from" program. It then prepends this
directory to your PATH when executing the command.

This makes any process looking for the original program find the replacement
instead, but only for the specified command's execution.

## License
