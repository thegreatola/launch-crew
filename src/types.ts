/** The contracts between the agents. Each agent returns one of these as structured output. */

export interface Fact {
  id: string;
  claim: string;
  /** Repo-relative path of the file the quote comes from. */
  path: string;
  /** A short exact quote from that file that backs the claim. */
  quote: string;
}

export interface Research {
  name: string;
  oneLiner: string;
  audience: string;
  problem: string;
  facts: Fact[];
  angles: string[];
}

export interface DroppedFact {
  fact: Fact;
  reason: string;
}

export interface Part {
  text: string;
  factIds: string[];
}

export interface Draft {
  post: Part;
  thread: Part[];
}

/** Where in the draft something is: the single post, or a thread part (1-based). */
export type Where = "post" | `thread ${number}`;

export interface Issue {
  where: Where;
  rule: string;
  quote: string;
  fix: string;
  /** Who raised it: the deterministic lint or the LLM critic. */
  by: "lint" | "critic";
  /** For critic issues: false when the quote is not in the draft. */
  anchored?: boolean;
}

export interface Critique {
  verdict: "approve" | "revise";
  issues: Issue[];
  strengths: string;
}

export interface Round {
  n: number;
  draft: Draft;
  lint: Issue[];
  /** Absent when the lint failed: the critic only sees drafts that pass the lint. */
  critique?: Critique;
  approved: boolean;
}

export interface AgentUsage {
  agent: string;
  durationMs: number;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  log: string;
}

export type RunStatus = "awaiting-approval" | "approved" | "rejected" | "failed";

export interface Run {
  id: string;
  source: { name: string; repoUrl: string | null; commit: string };
  model: string;
  started: string;
  research?: Research;
  dropped: DroppedFact[];
  rounds: Round[];
  /** True when the critic approved a round within the limit. */
  criticApproved: boolean;
  status: RunStatus;
  final?: Draft;
  humanNote?: string;
  agents: AgentUsage[];
  error?: string;
}
