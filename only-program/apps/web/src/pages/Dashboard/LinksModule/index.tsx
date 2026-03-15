// ─── LINKS MODULE INDEX ───────────────────────────────────────────────────────
// This barrel file re-exports everything from the links sub-modules.
// The router still imports: import Links from "@/pages/Dashboard/Links"
// which resolves to the monolithic Links.tsx — once the refactor is complete
// we will swap that import to this slim orchestrator.

export { default } from "./LinksPage";
export type { PageData } from "./types";
