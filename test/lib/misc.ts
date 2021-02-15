export function code(strings: TemplateStringsArray, ...args: any): string {
    const text = String.raw(strings, ...args)
    const lines = text.split("\n")
    const minIndent = lines
        .filter(line => line.trim() !== "")
        .map(line => /^\s+/u.exec(line)?.[0].length ?? 0)
        .reduce((a, b) => Math.min(a, b))

    return lines
        .map(line => line.slice(minIndent))
        .join("\n")
        .trim()
}
