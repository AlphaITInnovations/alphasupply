/** Predefined team members for dropdowns (Techniker, Besteller, etc.) */
export const TEAM_MEMBERS = [
  "Marco Hertwich",
  "Dominik Kaminski",
  "Jasmin Müller",
  "André Vonjo",
  "Julian Witibschlager",
  "Marco Schneider",
] as const;

export type TeamMember = (typeof TEAM_MEMBERS)[number];
