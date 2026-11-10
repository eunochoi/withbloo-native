import test from 'node:test';
import assert from 'node:assert/strict';
import { database, rows } from './database';
import { initializeDatabase } from '../src/db/schema';
import { saveHabit, setHabitCompletion } from '../src/db/habit';
import { readBackupDatabase, replaceRecords } from '../src/backup/database';
import { todayString } from '../src/domain/date';

test('v8 habits and completions survive migration and old backup restore', async () => {
  const original = await database();
  const id = await saveHabit(original.db, { name: '걷기', priority: 1, icon_key: 'goal' });
  await setHabitCompletion(original.db, id, todayString(), true);
  original.raw.run('ALTER TABLE habits DROP COLUMN description');
  original.raw.run(`DROP TABLE habit_record_images;
      DROP TABLE sober_record_images;
      DROP TABLE habit_records;
      DROP INDEX IF EXISTS sober_record_restart_time;
      ALTER TABLE sober_records DROP COLUMN is_restart;
      ALTER TABLE sober_records RENAME COLUMN recorded_at TO restarted_at;
      ALTER TABLE sober_records RENAME COLUMN text TO memo;
      ALTER TABLE sober_records RENAME TO sober_restarts;`);
  original.raw.run('PRAGMA user_version = 8');
  const bytes = original.raw.export();
  const oldBackup = await database(bytes);
  const target = await database();
  try {
    const records = await readBackupDatabase(oldBackup.db, {});
    assert.equal(records.habits[0].description, null);
    await replaceRecords(target.db, records, new Map());
    assert.equal(rows(target.raw, 'SELECT description FROM habits')[0][0], null);
    assert.equal(rows(target.raw, 'SELECT count(*) FROM habit_completions')[0][0], 1);
    await initializeDatabase(original.db);
    assert.equal(rows(original.raw, 'SELECT description FROM habits')[0][0], null);
    assert.equal(rows(original.raw, 'SELECT count(*) FROM habit_completions')[0][0], 1);
    assert.deepEqual(rows(original.raw, 'PRAGMA foreign_key_check'), []);
  } finally {
    oldBackup.raw.close(); target.raw.close(); original.raw.close();
  }
});

test('description round trips through database backup records', async () => {
  const source = await database();
  const target = await database();
  try {
    const id = await saveHabit(source.db, { name: '읽기', description: '  매일 조금씩  ', priority: 1, icon_key: 'goal' });
    const records = await readBackupDatabase(source.db, {});
    await replaceRecords(target.db, records, new Map());
    assert.equal(rows(target.raw, 'SELECT description FROM habits')[0][0], '매일 조금씩');
    await saveHabit(target.db, { id, name: '읽기', description: '   ', priority: 1, icon_key: 'goal' });
    assert.equal(rows(target.raw, 'SELECT description FROM habits')[0][0], null);
    await assert.rejects(saveHabit(target.db, { name: '긴 설명', description: 'x'.repeat(51), priority: 1, icon_key: 'goal' }), /50/);
  } finally {
    source.raw.close(); target.raw.close();
  }
});

test('v9 migration retains descriptions and enforces the new database limit', async () => {
  const source = await database();
  try {
    await saveHabit(source.db, { name: '읽기', description: '설명', priority: 1, icon_key: 'goal' });
    source.raw.run(`DROP TABLE habit_record_images;
      DROP TABLE sober_record_images;
      DROP TABLE habit_records;
      DROP INDEX IF EXISTS sober_record_restart_time;
      ALTER TABLE sober_records DROP COLUMN is_restart;
      ALTER TABLE sober_records RENAME COLUMN recorded_at TO restarted_at;
      ALTER TABLE sober_records RENAME COLUMN text TO memo;
      ALTER TABLE sober_records RENAME TO sober_restarts; PRAGMA user_version = 9;`);
    await initializeDatabase(source.db);
    assert.equal(rows(source.raw, 'SELECT description FROM habits')[0][0], '설명');
    assert.throws(() => source.raw.run('UPDATE habits SET description = ?', ['x'.repeat(101)]));
    assert.deepEqual(rows(source.raw, 'PRAGMA foreign_key_check'), []);
  } finally {
    source.raw.close();
  }
});


test('restore truncates old habit and sober names and descriptions', async () => {
  const source = await database();
  const target = await database();
  try {
    source.raw.run("INSERT INTO habits (name, description, priority, icon_key, icon_color, initial_started_at, created_at, updated_at) VALUES (?, ?, 1, 'goal', 'theme', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')", ['h'.repeat(25), 'a'.repeat(75)]);
    source.raw.run("INSERT INTO sobers (name, description, icon_key, icon_color, is_priority, initial_started_at, goal_mode, goal_days, created_at, updated_at) VALUES (?, ?, 'favorite', 'theme', 0, '2024-01-01T00:00:00.000Z', 'AUTO', NULL, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')", ['s'.repeat(25), 'b'.repeat(75)]);
    const records = await readBackupDatabase(source.db, {});
    await replaceRecords(target.db, records, new Map());
    assert.deepEqual(rows(target.raw, 'SELECT name, description FROM habits'), [['h'.repeat(20), 'a'.repeat(50)]]);
    assert.deepEqual(rows(target.raw, 'SELECT name, description FROM sobers'), [['s'.repeat(20), 'b'.repeat(50)]]);
  } finally { source.raw.close(); target.raw.close(); }
});
