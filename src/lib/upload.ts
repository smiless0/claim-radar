import type { ProjectRecord, RecordType } from "./types";
import { localIsoDate } from "./deadlines";

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

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parseDate(text: string): string | null {
  const iso = text.match(/\b(20\d\d)-(\d\d)-(\d\d)(?!\d)/);
  if (iso) return iso[0];
  const au = text.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d\d)\b/);
  if (au) return `${au[3]}-${au[2].padStart(2, "0")}-${au[1].padStart(2, "0")}`;
  return null;
}

function guessDate(text: string, fallback: Date): string {
  const headerBlock = text.split(/\r?\n\s*\r?\n/)[0];
  const header = headerBlock.match(/^date:\s*(.+)$/im)?.[1]?.trim();
  if (header) {
    const numeric = parseDate(header);
    if (numeric) return numeric;
    const mon = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?";
    const dayFirst = header.match(new RegExp(`\\b(\\d{1,2})\\s+${mon}\\s+(\\d{4})\\b`, "i"));
    const monthFirst = header.match(new RegExp(`\\b${mon}\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, "i"));
    const [day, name, year] = dayFirst ? [dayFirst[1], dayFirst[2], dayFirst[3]] : monthFirst ? [monthFirst[2], monthFirst[1], monthFirst[3]] : [];
    if (day && name && year) {
      const month = MONTHS.indexOf(name.toLowerCase()) + 1;
      return `${year}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
  return parseDate(text) ?? localIsoDate(fallback);
}

export async function filesToRecords(files: FileList | File[], existingIds: string[] = []): Promise<ProjectRecord[]> {
  const out: ProjectRecord[] = [];
  const used = new Set(existingIds);
  const uniqueId = (base: string) => {
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
  for (const file of Array.from(files)) {
    const text = await file.text();
    if (file.name.endsWith(".json")) {
      const data = JSON.parse(text);
      const recs: ProjectRecord[] = Array.isArray(data) ? data : data.records ?? [];
      out.push(...recs.map((r) => ({ ...r, id: uniqueId(r.id) })));
      continue;
    }
    const subject = text.match(/^subject:\s*(.+)$/im)?.[1]?.trim() ?? file.name.replace(/\.[^.]+$/, "");
    out.push({
      id: uniqueId(file.name.replace(/\.[^.]+$/, "").slice(0, 24)),
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
