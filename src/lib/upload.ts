import type { ProjectRecord, RecordType } from "./types";

const PREFIXES: [RegExp, RecordType][] = [
  [/^rfi/i, "rfi"],
  [/^tq/i, "tq"],
  [/diary|^sd/i, "site_diary"],
  [/minutes|^min/i, "minutes"],
  [/letter|^lt/i, "letter"],
  [/\.eml$|email|^em/i, "email"],
];

function guessType(name: string, text: string): RecordType {
  for (const [re, t] of PREFIXES) if (re.test(name)) return t;
  if (/^(from|to|subject):/im.test(text)) return "email";
  return "other";
}

function guessDate(text: string, fallback: Date): string {
  const iso = text.match(/\b(20\d\d)-(\d\d)-(\d\d)\b/);
  if (iso) return iso[0];
  const au = text.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d\d)\b/);
  if (au) return `${au[3]}-${au[2].padStart(2, "0")}-${au[1].padStart(2, "0")}`;
  return fallback.toISOString().slice(0, 10);
}

export async function filesToRecords(files: FileList | File[]): Promise<ProjectRecord[]> {
  const out: ProjectRecord[] = [];
  for (const file of Array.from(files)) {
    const text = await file.text();
    if (file.name.endsWith(".json")) {
      const data = JSON.parse(text);
      out.push(...(Array.isArray(data) ? data : data.records ?? []));
      continue;
    }
    const subject = text.match(/^subject:\s*(.+)$/im)?.[1]?.trim() ?? file.name.replace(/\.[^.]+$/, "");
    out.push({
      id: file.name.replace(/\.[^.]+$/, "").slice(0, 24),
      type: guessType(file.name, text),
      date: guessDate(text, new Date(file.lastModified)),
      from: text.match(/^from:\s*(.+)$/im)?.[1]?.trim(),
      to: text.match(/^to:\s*(.+)$/im)?.[1]?.trim(),
      subject,
      body: text,
    });
  }
  return out;
}
