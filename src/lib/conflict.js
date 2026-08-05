/* conflict.js — Field-level merge conflict resolution */

export function getFieldVersion(record, field) {
  const meta = record._field_versions || {};
  return meta[field] || 0;
}

export function setFieldVersion(record, field, version) {
  if (!record._field_versions) record._field_versions = {};
  record._field_versions[field] = version;
}

export function mergeRecord(local, remote, fieldDefs) {
  const merged = { ...local };
  const conflicts = [];

  for (const field of fieldDefs) {
    const localVer = getFieldVersion(local, field);
    const remoteVer = getFieldVersion(remote, field);

    if (localVer > remoteVer) {
      merged[field] = local[field];
    } else if (remoteVer > localVer) {
      merged[field] = remote[field];
    } else if (local[field] !== remote[field]) {
      if (local._updated_at >= remote._updated_at) {
        merged[field] = local[field];
      } else {
        merged[field] = remote[field];
      }
      conflicts.push({ field, localValue: local[field], remoteValue: remote[field] });
    }
  }

  return { merged, conflicts };
}

export function classifyConflicts(conflicts) {
  const autoMerge = [];
  const review = [];

  for (const c of conflicts) {
    if (['description', 'notes', 'category'].includes(c.field)) {
      autoMerge.push(c);
    } else {
      review.push(c);
    }
  }

  return { autoMerge, review };
}
