import { describe, it, expect } from 'vitest';
import { mergeRecord, classifyConflicts, getFieldVersion, setFieldVersion } from '../lib/conflict.js';

describe('Conflict Resolution', () => {
  it('should get field version', () => {
    const record = { _field_versions: { name: 3, description: 1 } };
    expect(getFieldVersion(record, 'name')).toBe(3);
    expect(getFieldVersion(record, 'description')).toBe(1);
    expect(getFieldVersion(record, 'missing')).toBe(0);
  });

  it('should set field version', () => {
    const record = {};
    setFieldVersion(record, 'name', 5);
    expect(record._field_versions.name).toBe(5);
  });

  it('should merge records with local winning on higher version', () => {
    const local = {
      id: '1',
      name: 'Local Name',
      description: 'Local Desc',
      _field_versions: { name: 2, description: 1 },
      _updated_at: '2026-08-05T10:00:00Z',
    };
    const remote = {
      id: '1',
      name: 'Remote Name',
      description: 'Remote Desc',
      _field_versions: { name: 1, description: 2 },
      _updated_at: '2026-08-05T09:00:00Z',
    };

    const { merged, conflicts } = mergeRecord(local, remote, ['name', 'description']);
    expect(merged.name).toBe('Local Name'); // local version 2 > remote 1
    expect(merged.description).toBe('Remote Desc'); // remote version 2 > local 1
    expect(conflicts).toHaveLength(0);
  });

  it('should detect conflicts on same version', () => {
    const local = {
      id: '1',
      name: 'Local',
      _field_versions: { name: 1 },
      _updated_at: '2026-08-05T10:00:00Z',
    };
    const remote = {
      id: '1',
      name: 'Remote',
      _field_versions: { name: 1 },
      _updated_at: '2026-08-05T09:00:00Z',
    };

    const { merged: _merged, conflicts } = mergeRecord(local, remote, ['name']);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].field).toBe('name');
  });

  it('should classify conflicts', () => {
    const conflicts = [
      { field: 'description', localValue: 'a', remoteValue: 'b' },
      { field: 'amount', localValue: 100, remoteValue: 200 },
      { field: 'category', localValue: 'sales', remoteValue: 'other' },
    ];

    const { autoMerge, review } = classifyConflicts(conflicts);
    expect(autoMerge.length).toBeGreaterThan(0);
    expect(review.length).toBeGreaterThan(0);
  });
});
