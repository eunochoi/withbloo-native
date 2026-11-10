import test from 'node:test';
import assert from 'node:assert/strict';
import { database, rows } from './database';
import { saveHabit, setHabitCompletion, deleteHabit } from '../src/db/habit';
import { saveSober, getSoberRestarts } from '../src/db/sober';
import {
  getActivityRecord,
  getActivityDay,
  getActivityPage,
  saveActivityRecord,
  deleteActivityRecord,
  getActivityDates,
} from '../src/db/records';
import { readBackupDatabase, replaceRecords } from '../src/backup/database';
import { initializeDatabase, SCHEMA_VERSION } from '../src/db/schema';
import { getSoberSummary } from '../src/domain/sober';
import { localDate, todayString } from '../src/domain/date';

const time = '2024-01-10T10:00:00.000Z';
const soberInput = {
  name: '커피',
  description: null,
  icon_key: 'coffee' as const,
  icon_color: 'theme' as const,
  is_priority: 0 as const,
  initial_started_at: '2024-01-01T00:00:00.000Z',
  goal_mode: 'AUTO' as const,
  goal_days: null,
};

test('multiple habit memos are independent from checking, have stable pagination, and cascade', async () => {
  const { db, raw } = await database();
  try {
    const id = await saveHabit(db, {
      name: '걷기',
      priority: 1,
      icon_key: 'goal',
      initial_started_at: '2024-01-01T00:00:00.000Z',
    });
    const ids: number[] = [];
    for (let index = 0; index < 23; index++)
      ids.push(
        await saveActivityRecord(db, 'habit', id, {
          type: 'MEMO',
          recorded_at: time,
          memo: `메모 ${index}`,
        }),
      );
    assert.equal((await getActivityDay(db, 'habit', id, localDate(time))).length, 23);
    assert.equal(rows(raw, 'SELECT count(*) FROM habit_completions')[0][0], 0);
    await setHabitCompletion(db, id, todayString(), true);
    await setHabitCompletion(db, id, todayString(), false);
    assert.equal((await getActivityDay(db, 'habit', id, localDate(time))).length, 23);
    for (const sort of ['ASC', 'DESC'] as const) {
      const page = await getActivityPage(db, 'habit', id, sort);
      const next = await getActivityPage(db, 'habit', id, sort, page.nextCursor!);
      assert.equal(new Set([...page.records, ...next.records].map((row) => row.id)).size, 23);
      assert.equal(next.nextCursor, undefined);
      assert.equal(page.records[0].id, sort === 'ASC' ? ids[0] : ids.at(-1));
    }
    await saveActivityRecord(db, 'habit', id, {
      id: ids[0],
      type: 'MEMO',
      recorded_at: time,
      memo: '수정',
    });
    await deleteActivityRecord(db, 'habit', id, ids[1]);
    assert.equal((await getActivityDay(db, 'habit', id, localDate(time))).length, 22);
    await deleteHabit(db, id);
    assert.equal(rows(raw, 'SELECT count(*) FROM habit_records')[0][0], 0);
  } finally {
    raw.close();
  }
});

test('sober records can change type without losing their identity or parent ownership', async () => {
  const { db, raw } = await database();
  try {
    const id = await saveSober(db, soberInput);
    const record = await saveActivityRecord(db, 'sober', id, {
      type: 'RESTART',
      recorded_at: time,
      memo: null,
    });
    const before = await getSoberRestarts(db, id);
    assert.equal((await getActivityRecord(db, 'sober', id, record))?.type, 'RESTART');
    assert.equal(await getActivityRecord(db, 'sober', id + 1000, record), null);
    const memo = await saveActivityRecord(db, 'sober', id, {
      type: 'MEMO',
      recorded_at: time,
      memo: '잘 넘겼어요',
    });
    assert.deepEqual(await getSoberRestarts(db, id), before);
    const sober = (await db.getFirstAsync<import('../src/db/types').Sober>(
      'SELECT * FROM sobers WHERE id = ?',
      id,
    ))!;
    assert.deepEqual(
      getSoberSummary(sober, await getSoberRestarts(db, id), Date.parse('2024-02-01T00:00:00Z')),
      getSoberSummary(sober, before, Date.parse('2024-02-01T00:00:00Z')),
    );
    assert.equal((await getActivityDay(db, 'sober', id, localDate(time))).length, 2);
    await db.runAsync('INSERT INTO sober_record_images (sober_record_id, file_name, position) VALUES (?, ?, ?)', memo, 'kept.jpg', 0);
    await saveActivityRecord(db, 'sober', id, {
      id: memo, type: 'RESTART', recorded_at: time, memo: '잘 넘겼어요',
    });
    assert.equal((await getActivityRecord(db, 'sober', id, memo))?.images?.[0].file_name, 'kept.jpg');
    assert.deepEqual(new Set((await getSoberRestarts(db, id)).map((row) => row.id)), new Set([record, memo]));
    await assert.rejects(saveActivityRecord(db, 'sober', id, {
      id: memo, type: 'MEMO', recorded_at: time, memo: null,
    }), /내용/);
    await saveActivityRecord(db, 'sober', id, {
      id: memo, type: 'MEMO', recorded_at: time, memo: '잘 넘겼어요',
    });
    assert.deepEqual(await getSoberRestarts(db, id), before);
    assert.equal((await getActivityDay(db, 'sober', id, localDate(time))).find((row) => row.id === memo)?.memo, '잘 넘겼어요');
    assert.equal((await getActivityRecord(db, 'sober', id, memo))?.images?.[0].file_name, 'kept.jpg');
    await db.runAsync('DELETE FROM sober_record_images WHERE sober_record_id = ?', memo);
    await deleteActivityRecord(db, 'sober', id, memo);
    assert.deepEqual(await getSoberRestarts(db, id), before);
  } finally {
    raw.close();
  }
});

test('records validate parent, content and timestamps and preserve other items on rejected writes', async () => {
  const { db, raw } = await database();
  try {
    const id = await saveHabit(db, {
      name: '읽기',
      priority: 0,
      icon_key: 'goal',
      initial_started_at: '2024-01-01T00:00:00.000Z',
    });
    const other = await saveHabit(db, {
      name: '걷기',
      priority: 1,
      icon_key: 'goal',
      initial_started_at: '2024-01-01T00:00:00.000Z',
    });
    const record = await saveActivityRecord(db, 'habit', id, {
      type: 'MEMO',
      recorded_at: time,
      memo: '기록',
    });
    for (const patch of [
      { memo: '  ' },
      { memo: 'x'.repeat(501) },
      { recorded_at: '2023-12-31T00:00:00.000Z' },
      { recorded_at: '2099-01-01T00:00:00.000Z' },
      { type: 'RESTART' as const },
    ])
      await assert.rejects(
        saveActivityRecord(db, 'habit', id, {
          type: 'MEMO',
          recorded_at: time,
          memo: '기록',
          ...patch,
        }),
      );
    await assert.rejects(
      saveActivityRecord(db, 'habit', 999, { type: 'MEMO', recorded_at: time, memo: '기록' }),
    );
    await assert.rejects(
      saveActivityRecord(db, 'habit', other, {
        id: record,
        type: 'MEMO',
        recorded_at: time,
        memo: '덮어쓰기',
      }),
    );
    await assert.rejects(deleteActivityRecord(db, 'habit', other, record));
    assert.deepEqual(await getActivityDates(db, 'habit', id), [localDate(time)]);
  } finally {
    raw.close();
  }
});

test('new memos and both sober types survive backup replacement and v10 migration preserves restart ids', async () => {
  const source = await database();
  const target = await database();
  try {
    const habit = await saveHabit(source.db, {
      name: '걷기',
      priority: 1,
      icon_key: 'goal',
      initial_started_at: '2024-01-01T00:00:00.000Z',
    });
    const sober = await saveSober(source.db, soberInput);
    await saveActivityRecord(source.db, 'habit', habit, {
      type: 'MEMO',
      recorded_at: time,
      memo: '습관 메모',
    });
    await saveActivityRecord(source.db, 'sober', sober, {
      type: 'MEMO',
      recorded_at: time,
      memo: '거리두기 메모',
    });
    await saveActivityRecord(source.db, 'sober', sober, {
      type: 'RESTART',
      recorded_at: time,
      memo: '다시 시작',
    });
    const backup = await readBackupDatabase(source.db, {});
    await replaceRecords(target.db, backup, new Map());
    assert.deepEqual(await readBackupDatabase(target.db, {}), backup);
    // A real previous-version table has neither the type column nor the memo table.
    source.raw.run(
      "PRAGMA query_only = OFF; PRAGMA foreign_keys = OFF; DELETE FROM sober_records WHERE is_restart = 0; DROP TABLE sober_record_images; DROP TABLE habit_record_images; DROP TABLE habit_records; DROP INDEX sober_record_restart_time; ALTER TABLE sober_records DROP COLUMN is_restart; ALTER TABLE sober_records RENAME COLUMN recorded_at TO restarted_at; ALTER TABLE sober_records RENAME COLUMN text TO memo; ALTER TABLE sober_records RENAME TO sober_restarts; PRAGMA user_version = 10;",
    );
    const before = rows(source.raw, 'SELECT * FROM sober_restarts');
    await initializeDatabase(source.db);
    assert.equal(rows(source.raw, 'PRAGMA user_version')[0][0], SCHEMA_VERSION);
    assert.deepEqual(
      rows(
        source.raw,
        'SELECT id, sober_id, recorded_at, text, created_at, updated_at FROM sober_records',
      ),
      before,
    );
    assert.equal((await getSoberRestarts(source.db, sober))[0].type, 'RESTART');
    assert.deepEqual(rows(source.raw, 'PRAGMA foreign_key_check'), []);
    await initializeDatabase(source.db);
  } finally {
    source.raw.close();
    target.raw.close();
  }
});

test('web v11 encrypted backup restores multiple habit memos and typed sober records in native', async () => {
  const { readFileSync } = await import('node:fs');
  const { decryptBloo } = await import('../src/backup/container');
  const { extractBackupArchive } = await import('../src/backup/stream');
  const { nodeBackupCipher } = await import('./helpers/backup-cipher');
  const bytes = readFileSync(new URL('./fixtures/web-v11-records.bloo', import.meta.url));
  let offset = 0;
  const plain: Uint8Array[] = [];
  for await (const chunk of decryptBloo(
    (size) => {
      const value = bytes.subarray(offset, offset + size);
      offset += value.length;
      return value;
    },
    'compatibility-test-only',
    nodeBackupCipher,
  ))
    plain.push(chunk);
  const files: Record<string, Uint8Array> = {};
  const archive = await extractBackupArchive(
    (async function* () {
      yield Buffer.concat(plain);
    })(),
    (name) => {
      const chunks: Uint8Array[] = [];
      return {
        write: (chunk) => chunks.push(chunk.slice()),
        close: () => {
          files[name] = Buffer.concat(chunks);
        },
      };
    },
  );
  const source = await database(files['took.db']);
  const target = await database();
  try {
    const records = await readBackupDatabase(source.db, archive.files);
    assert.equal(records.habitMemos?.length, 2);
    assert.equal(records.soberRestarts.filter((row) => row.type === 'MEMO').length, 1);
    await replaceRecords(target.db, records, new Map([['synthetic.jpg', 'restored.jpg']]));
    assert.equal((await getActivityPage(target.db, 'habit', 21, 'ASC')).records.length, 2);
    assert.equal((await getActivityPage(target.db, 'sober', 41, 'ASC')).records.length, 2);
    assert.equal((await getSoberRestarts(target.db, 41)).length, 1);
    assert.deepEqual(rows(target.raw, 'PRAGMA foreign_key_check'), []);
  } finally {
    source.raw.close();
    target.raw.close();
  }
});

test('activity photos remain associated and ordered through backup replacement', async () => {
  const source = await database();
  const destination = await database();
  try {
    const habit = await saveHabit(source.db, { name: '사진 습관', priority: 1, icon_key: 'goal', initial_started_at: '2024-01-01T00:00:00.000Z' });
    const memo = await saveActivityRecord(source.db, 'habit', habit, { type: 'MEMO', recorded_at: time, memo: '기록' });
    const sober = await saveSober(source.db, soberInput);
    const restart = await saveActivityRecord(source.db, 'sober', sober, { type: 'RESTART', recorded_at: time, memo: null });
    await source.db.runAsync('INSERT INTO habit_record_images (habit_record_id, file_name, position) VALUES (?, ?, ?)', memo, 'one.jpg', 0);
    await source.db.runAsync('INSERT INTO habit_record_images (habit_record_id, file_name, position) VALUES (?, ?, ?)', memo, 'two.jpg', 1);
    await source.db.runAsync('INSERT INTO sober_record_images (sober_record_id, file_name, position) VALUES (?, ?, ?)', restart, 'three.jpg', 0);
    const files = { 'media/one.jpg': new Uint8Array([1]), 'media/two.jpg': new Uint8Array([2]), 'media/three.jpg': new Uint8Array([3]) };
    const backup = await readBackupDatabase(source.db, files);
    await replaceRecords(destination.db, backup, new Map([['one.jpg', 'a.jpg'], ['two.jpg', 'b.jpg'], ['three.jpg', 'c.jpg']]));
    assert.deepEqual((await getActivityPage(destination.db, 'habit', habit, 'DESC')).records[0].images?.map((image) => image.file_name), ['a.jpg', 'b.jpg']);
    assert.deepEqual((await getActivityPage(destination.db, 'sober', sober, 'DESC')).records[0].images?.map((image) => image.file_name), ['c.jpg']);
    await assert.rejects(readBackupDatabase(source.db, { 'media/one.jpg': new Uint8Array([1]) }));
  } finally { source.raw.close(); destination.raw.close(); }
});

test('v12 records and photo links migrate to record tables without changing restart behavior', async () => {
  const source = await database();
  try {
    const habit = await saveHabit(source.db, { name: '걷기', priority: 1, icon_key: 'goal', initial_started_at: '2024-01-01T00:00:00.000Z' });
    const sober = await saveSober(source.db, soberInput);
    const memo = await saveActivityRecord(source.db, 'habit', habit, { type: 'MEMO', recorded_at: time, memo: '기록' });
    const note = await saveActivityRecord(source.db, 'sober', sober, { type: 'MEMO', recorded_at: time, memo: '생각' });
    const restart = await saveActivityRecord(source.db, 'sober', sober, { type: 'RESTART', recorded_at: time, memo: null });
    await source.db.runAsync('INSERT INTO habit_record_images (habit_record_id, file_name, position) VALUES (?, ?, ?)', memo, 'habit.jpg', 0);
    await source.db.runAsync('INSERT INTO sober_record_images (sober_record_id, file_name, position) VALUES (?, ?, ?)', restart, 'sober.jpg', 0);
    source.raw.run(`PRAGMA foreign_keys=OFF;
      ALTER TABLE habit_record_images RENAME COLUMN habit_record_id TO habit_memo_id;
      ALTER TABLE habit_record_images RENAME TO habit_memo_images;
      ALTER TABLE habit_records RENAME COLUMN text TO memo;
      ALTER TABLE habit_records RENAME TO habit_memos;
      DROP INDEX sober_record_restart_time;
      ALTER TABLE sober_records ADD COLUMN type TEXT NOT NULL DEFAULT 'RESTART';
      UPDATE sober_records SET type = CASE WHEN is_restart = 1 THEN 'RESTART' ELSE 'MEMO' END;
      ALTER TABLE sober_records DROP COLUMN is_restart;
      ALTER TABLE sober_records RENAME COLUMN recorded_at TO restarted_at;
      ALTER TABLE sober_records RENAME COLUMN text TO memo;
      ALTER TABLE sober_records RENAME TO sober_restarts;
      PRAGMA user_version=12;`);
    const oldBackup = await readBackupDatabase(source.db, { 'media/habit.jpg': new Uint8Array([1]), 'media/sober.jpg': new Uint8Array([2]) });
    assert.equal(oldBackup.activityImages?.length, 2);
    await source.db.execAsync('PRAGMA query_only = OFF;');
    await initializeDatabase(source.db);
    assert.deepEqual(rows(source.raw, 'SELECT id, is_restart FROM sober_records ORDER BY id'), [[note, 0], [restart, 1]]);
    assert.deepEqual(rows(source.raw, 'SELECT habit_record_id, file_name FROM habit_record_images'), [[memo, 'habit.jpg']]);
    assert.deepEqual(rows(source.raw, 'SELECT sober_record_id, file_name FROM sober_record_images'), [[restart, 'sober.jpg']]);
    assert.deepEqual((await getSoberRestarts(source.db, sober)).map((row) => row.id), [restart]);
    assert.deepEqual(rows(source.raw, 'PRAGMA foreign_key_check'), []);
    const backup = await readBackupDatabase(source.db, { 'media/habit.jpg': new Uint8Array([1]), 'media/sober.jpg': new Uint8Array([2]) });
    assert.equal(backup.activityImages?.length, 2);
    assert.deepEqual(backup, oldBackup);
  } finally { source.raw.close(); }
});
