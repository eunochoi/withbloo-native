import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { decryptBloo } from '../src/backup/container';
import { extractBackupArchive } from '../src/backup/stream';
import { readBackupDatabase, replaceRecords } from '../src/backup/database';
import { database, rows } from './database';
import { nodeBackupCipher } from './helpers/backup-cipher';

test('web-produced .bloo restores records and photos while keeping device settings', async () => {
  const bytes = readFileSync(new URL('./fixtures/web-v8.bloo', import.meta.url));
  let offset = 0;
  const plain: Uint8Array[] = [];
  for await (const chunk of decryptBloo(
    (size) => {
      const result = bytes.subarray(offset, offset + size);
      offset += result.length;
      return result;
    },
    'compatibility-test-only',
    nodeBackupCipher,
  ))
    plain.push(chunk);
  const files: Record<string, Uint8Array> = {};
  const part = await extractBackupArchive(
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
    const records = await readBackupDatabase(source.db, part.files);
    assert.equal(records.preferences, null);
    assert.equal(records.diaries[0].emotion, 10);
    assert.equal(records.habits[0].priority, 0);
    assert.equal(records.habits[0].name, 'Read for twenty minutes');
    assert.equal(records.completions[0].date, '2024-03-01');
    assert.equal(records.soberRestarts[0].memo, 'A fresh start');
    await target.db.runAsync(
      'INSERT INTO settings VALUES (?, ?)',
      'preferences',
      JSON.stringify({ themeAccent: 'purple', habitOrder: [999], diaryReminderTime: '21:30' }),
    );
    await replaceRecords(target.db, records, new Map([['synthetic.jpg', 'restored.jpg']]));
    assert.equal(rows(target.raw, 'SELECT count(*) FROM diaries')[0][0], 1);
    assert.equal(rows(target.raw, 'SELECT file_name FROM diary_images')[0][0], 'restored.jpg');
    assert.equal(rows(target.raw, 'SELECT date FROM habit_completions')[0][0], '2024-03-01');
    const settings = JSON.parse(
      String(rows(target.raw, "SELECT value FROM settings WHERE key='preferences'")[0][0]),
    );
    assert.equal(settings.themeAccent, 'purple');
    assert.equal(settings.diaryReminderTime, '21:30');
    assert.deepEqual(settings.habitOrder, []);
  } finally {
    source.raw.close();
    target.raw.close();
  }
});
