export interface SyncResult {
  ok: boolean;
  changed: boolean;
}

export interface ConflictField {
  field: string;
  localValue: unknown;
  remoteValue: unknown;
}

export interface MergeResult {
  merged: Record<string, unknown>;
  conflicts: ConflictField[];
}

export interface ConflictClassification {
  autoMerge: ConflictField[];
  review: ConflictField[];
}
