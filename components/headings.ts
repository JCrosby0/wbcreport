import { teamGroupList } from "@/components/teamlist";

export class Headings {
  label: string;
  tooltip: string;
  constructor(label: string, tooltip: string) {
    this.label = label;
    this.tooltip = tooltip;
  }
}

export const headingsSports = [
  new Headings(
    "Baseball",
    "Players with Payment class matching 'Baseball', 'League', 'IL', or 'Machine'"
  ),
  new Headings("Softball", "Players from the Softball Revolutionise report"),
  new Headings(
    "Tee-ball",
    "Players with Payment class matching 'Tee-ball' or 'Teeball'"
  ),
  new Headings(
    "Tee-ball U6",
    "Players with Payment class matching 'Teeball under 6'"
  ),
  new Headings(
    "Baseball & Tee-ball",
    "Players counted by both baseball and tee-ball"
  ),
  new Headings(
    "Total Unique",
    "Baseball + Softball + Tee-ball - BB&TB, excludes Unpaid and Committee"
  ),
];

export const headingsFees = [
  new Headings("Baseball", "All baseballers with balance > 0"),
  new Headings("Softball", "All softballers with balance > 0"),
  new Headings("Tee-ball", "All tee-ballers with balance > 0"),
  new Headings(
    "Baseball Invoiced",
    "All baseballers whose payment class is 'Invoiced' with balance > 0"
  ),
  new Headings(
    "Baseball Part-Paid",
    "All baseballers whose payment class is 'Part-Paid' with balance > 0"
  ),
  new Headings(
    "Baseball Senior",
    "All players with Payment class matching 'Baseball' with balance > 0"
  ),
];

export const headingsOutstanding = [
  new Headings("Baseball", "Sum of outstanding fees for baseballers"),
  new Headings("Softball", "Sum of outstanding fees for softballers"),
  new Headings("Tee-ball", "Sum of outstanding fees for tee-ballers"),
];

export const headingsRegistration = [
  new Headings(
    "Baseball (Sportlomo)",
    "Baseballers with incomplete Sportlomo registration"
  ),
  new Headings(
    "Baseball (Revolutionise)",
    "Baseballers registered in Sportlomo but missing from Revolutionise"
  ),
];

export const headingsByTeam = teamGroupList.map((teamName: string) => {
  return new Headings(
    teamName.slice(0, 8) === "Baseball" ? teamName.slice(9) : teamName,
    `Players with outstanding membership on ${teamName}`
  );
});
