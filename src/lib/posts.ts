import essaysFile from "../../content/essays.json";
import writing from "../../content/writing.json";

export type Essay = {
  title: string;
  date: string;
  url: string;
  blurb: string;
};

export type EssaysFile = {
  draft: boolean;
  label: string;
  note: string;
  source: {
    label: string;
    href: string;
  };
  archiveHref: string;
  essays: Essay[];
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function loadEssaysFile(): EssaysFile {
  return essaysFile;
}

export function loadEssays(): Essay[] {
  return (essaysFile.essays ?? []).filter((essay) => essay.title && essay.url);
}

export function loadWriting() {
  return writing;
}

export function formatDate(value: string): string {
  if (/^\d{4}$/.test(value)) return value;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month) return value;
  if (!day) return `${MONTHS[month - 1]} ${year}`;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}
