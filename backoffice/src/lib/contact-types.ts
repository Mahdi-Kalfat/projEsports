import type { ContactType } from "@/generated/prisma";

// The set an admin picks from while triaging a report — see the ContactType
// enum's comment in schema.prisma. Order here is the select's display order.
export const CONTACT_TYPES: ContactType[] = ["GENERAL", "DEPOSIT_REQUEST", "ACCOUNT_ISSUE", "BUG_REPORT", "OTHER"];

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  GENERAL: "General",
  DEPOSIT_REQUEST: "Deposit Request",
  ACCOUNT_ISSUE: "Account Issue",
  BUG_REPORT: "Bug Report",
  OTHER: "Other",
};
