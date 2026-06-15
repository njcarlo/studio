import type { C2SGroup, C2SMentee } from "@studio/types";

export type GroupWithMentees = C2SGroup & { mentees: C2SMentee[] };
