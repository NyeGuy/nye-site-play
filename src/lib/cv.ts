import cv from "../../content/cv.json";

export type CvRow = {
  when: string;
  title: string;
  org?: string;
  note?: string;
};

export type CvSection = {
  heading: string;
  rows: CvRow[];
};

export type Cv = {
  title: string;
  lead: string;
  source: {
    label: string;
    href: string;
  };
  education: CvRow[];
  sections: CvSection[];
};

export function loadCv(): Cv {
  return cv;
}
