import assert from 'node:assert/strict';
import test from 'node:test';
import { database, rows } from './database';
import { initializeDatabase, SCHEMA_VERSION } from '../src/db/schema';
import { saveHabit } from '../src/db/habit';
import { saveSober } from '../src/db/sober';
import { readBackupDatabase, replaceRecords } from '../src/backup/database';

test('v7 upgrade expands name limits without losing records, links, or sequences', async () => {
  const template = await database();
  const source = await database(new Uint8Array());
  const restored = await database();
  try {
    const schema = await template.db.getAllAsync<{ sql: string }>(
      "SELECT sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND type IN ('table', 'index') ORDER BY type DESC",
    );
    await source.db.execAsync(
      schema
        .map(({ sql }) =>
          sql.replace('length(trim(name)) BETWEEN 1 AND 30', 'length(trim(name)) BETWEEN 1 AND 10'),
        )
        .join(';') + '; PRAGMA user_version = 7; PRAGMA foreign_keys = ON;',
    );
    await source.db.execAsync(`
      INSERT INTO habits VALUES (2, 'old habit', 1, 'goal', 'theme', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');
      INSERT INTO habit_completions VALUES (2, '2024-01-02', '2024-01-02T00:00:00.000Z');
      INSERT INTO sobers VALUES (3, 'old sober', NULL, 'favorite', 'theme', 0, '2024-01-01T00:00:00.000Z', 'AUTO', NULL, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');
      INSERT INTO sober_restarts VALUES (4, 3, '2024-01-02T00:00:00.000Z', NULL, '2024-01-02T00:00:00.000Z', '2024-01-02T00:00:00.000Z');
      UPDATE sqlite_sequence SET seq = 20 WHERE name IN ('habits', 'sobers');
    `);
    const backup = await readBackupDatabase(source.db, {});
    await replaceRecords(restored.db, backup, new Map());
    assert.equal(rows(restored.raw, 'SELECT count(*) FROM sober_restarts')[0][0], 1);
    // The backup reader intentionally makes its connection read-only.
    const upgraded = await database(source.raw.export());
    try {
      await initializeDatabase(upgraded.db);
      assert.equal(rows(upgraded.raw, 'PRAGMA user_version')[0][0], SCHEMA_VERSION);
      assert.deepEqual(rows(upgraded.raw, 'PRAGMA foreign_key_check'), []);
      assert.equal(rows(upgraded.raw, 'SELECT count(*) FROM habit_completions')[0][0], 1);
      assert.equal(rows(upgraded.raw, 'SELECT count(*) FROM sober_restarts')[0][0], 1);
      const habitId = await saveHabit(upgraded.db, {
        name: 'h'.repeat(30),
        priority: 1,
        icon_key: 'goal',
      });
      const soberId = await saveSober(upgraded.db, {
        name: 's'.repeat(30),
        description: null,
        icon_key: 'favorite',
        icon_color: 'theme',
        is_priority: 0,
        initial_started_at: '2024-01-01T00:00:00.000Z',
        goal_mode: 'AUTO',
        goal_days: null,
      });
      assert.equal(habitId, 21);
      assert.equal(soberId, 21);
      await assert.rejects(
        saveHabit(upgraded.db, { name: 'h'.repeat(31), priority: 1, icon_key: 'goal' }),
      );
      await assert.rejects(
        saveSober(upgraded.db, {
          name: 's'.repeat(31),
          description: null,
          icon_key: 'favorite',
          icon_color: 'theme',
          is_priority: 0,
          initial_started_at: '2024-01-01T00:00:00.000Z',
          goal_mode: 'AUTO',
          goal_days: null,
        }),
      );
    } finally {
      upgraded.raw.close();
    }
  } finally {
    template.raw.close();
    source.raw.close();
    restored.raw.close();
  }
});
