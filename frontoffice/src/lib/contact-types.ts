import type { ContactType } from "@/generated/prisma";

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  GENERAL: "General",
  DEPOSIT_REQUEST: "Deposit Request",
  ACCOUNT_ISSUE: "Account Issue",
  BUG_REPORT: "Bug Report",
  OTHER: "Other",
};
