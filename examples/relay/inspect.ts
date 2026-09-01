/** Serializes inspectable CLI output without failing on bigint-backed signed values. */
export function stringifyForInspection(value: unknown): string {
  return (
    JSON.stringify(
      value,
      (_key, nestedValue) =>
        typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue,
      2
    ) ?? "undefined"
  );
}
