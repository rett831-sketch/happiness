/**
 * Reads a top-level string field out of JSON that is still being streamed,
 * e.g. partialString('{"reply":"今天你', "reply") === "今天你".
 */
export function partialString(json: string, field: string): string {
  const start = json.match(new RegExp(`"${field}"\\s*:\\s*"`));
  if (!start || start.index === undefined) return "";
  let raw = json.slice(start.index + start[0].length);

  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "\\") {
      const len = raw[i + 1] === "u" ? 6 : 2; // \uXXXX or \n, \", \\ ...
      if (i + len > raw.length) {
        raw = raw.slice(0, i); // escape not finished arriving yet
        break;
      }
      i += len - 1;
    } else if (raw[i] === '"') {
      raw = raw.slice(0, i); // closing quote
      break;
    }
  }

  try {
    return JSON.parse(`"${raw}"`) as string;
  } catch {
    return "";
  }
}
