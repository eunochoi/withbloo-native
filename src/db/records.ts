import type { DraftImage } from '../media';
import type { SQLiteDatabase } from 'expo-sqlite';
import { withRecordWriteLock } from './index';
import { assertDate, assertDateTime, localDate } from '../domain/date';

export type RecordScope = 'habit' | 'sober';
export type ActivityRecord = {
  id: number;
  type: 'MEMO' | 'RESTART';
  recorded_at: string;
  memo: string | null;
  images?: { id: number; diary_id: number; file_name: string; position: number }[];
};
export type RecordCursor = Pick<ActivityRecord, 'id' | 'recorded_at'>;
const validId = (id: number) => Number.isSafeInteger(id) && id > 0;
function table(scope: RecordScope) {
  if (scope !== 'habit' && scope !== 'sober') throw new Error('기록을 확인해주세요.');
  return scope === 'habit'
    ? {
        name: 'habit_records',
        parent: 'habits',
        foreign: 'habit_id',
        time: 'recorded_at',
        columns: "id, 'MEMO' AS type, recorded_at, text AS memo",
        images: 'habit_record_images', imageForeign: 'habit_record_id',
      }
    : {
        name: 'sober_records',
        parent: 'sobers',
        foreign: 'sober_id',
        time: 'recorded_at',
        columns: "id, CASE WHEN is_restart = 1 THEN 'RESTART' ELSE 'MEMO' END AS type, recorded_at, text AS memo",
        images: 'sober_record_images', imageForeign: 'sober_record_id',
      };
}
async function attachImages(db: SQLiteDatabase, scope: RecordScope, rows: ActivityRecord[]) {
  if (!rows.length) return rows;
  const t = table(scope);
  const images = await db.getAllAsync<{ id: number; parent_id: number; file_name: string; position: number }>(
    `SELECT id, ${t.imageForeign} AS parent_id, file_name, position FROM ${t.images} WHERE ${t.imageForeign} IN (${rows.map(() => '?').join(',')}) ORDER BY position`, ...rows.map((row) => row.id));
  return rows.map((row) => ({ ...row, images: images.filter((image) => image.parent_id === row.id).map((image) => ({ ...image, diary_id: row.id })) }));
}
export async function getActivityRecord(db: SQLiteDatabase, scope: RecordScope, parentId: number, id: number) {
  const t = table(scope);
  if (!validId(parentId) || !validId(id)) throw new Error('기록을 확인해주세요.');
  const row = await db.getFirstAsync<ActivityRecord>(
    `SELECT ${t.columns} FROM ${t.name} WHERE id = ? AND ${t.foreign} = ?`, id, parentId,
  );
  return row ? (await attachImages(db, scope, [row]))[0] : null;
}
export async function getActivityPage(
  db: SQLiteDatabase,
  scope: RecordScope,
  parentId: number,
  sort: 'ASC' | 'DESC',
  cursor: RecordCursor | null = null,
) {
  const t = table(scope);
  if (
    !validId(parentId) ||
    !['ASC', 'DESC'].includes(sort) ||
    (cursor && (!validId(cursor.id) || !Number.isFinite(Date.parse(cursor.recorded_at))))
  )
    throw new Error('기록 조회 조건을 확인해주세요.');
  const comparison = sort === 'ASC' ? '>' : '<';
  const rows = await db.getAllAsync<ActivityRecord>(
    `SELECT ${t.columns} FROM ${t.name} WHERE ${t.foreign} = ? ${cursor ? `AND (${t.time} ${comparison} ? OR (${t.time} = ? AND id ${comparison} ?))` : ''} ORDER BY ${t.time} ${sort}, id ${sort} LIMIT 21`,
    parentId,
    ...(cursor ? [cursor.recorded_at, cursor.recorded_at, cursor.id] : []),
  );
  const records = await attachImages(db, scope, rows.slice(0, 20));
  const last = records.at(-1);
  return {
    records,
    nextCursor:
      rows.length > 20 && last ? { id: last.id, recorded_at: last.recorded_at } : undefined,
  };
}
export async function getActivityDay(
  db: SQLiteDatabase,
  scope: RecordScope,
  parentId: number,
  date: string,
) {
  assertDate(date);
  const t = table(scope);
  if (!validId(parentId)) throw new Error('항목을 확인해주세요.');
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const rows = await db.getAllAsync<ActivityRecord>(
    `SELECT ${t.columns} FROM ${t.name} WHERE ${t.foreign} = ? AND ${t.time} >= ? AND ${t.time} < ? ORDER BY ${t.time}, id`,
    parentId,
    start.toISOString(),
    end.toISOString(),
  );
  return attachImages(db, scope, rows);
}
export async function getActivityDates(db: SQLiteDatabase, scope: RecordScope, parentId: number) {
  const t = table(scope);
  if (!validId(parentId)) throw new Error('항목을 확인해주세요.');
  const rows = await db.getAllAsync<{ recorded_at: string }>(
    `SELECT ${t.time} AS recorded_at FROM ${t.name} WHERE ${t.foreign} = ? ${scope === 'sober' ? "AND is_restart = 0" : ''}`,
    parentId,
  );
  return [...new Set(rows.map((row) => localDate(row.recorded_at)))];
}
export function validateActivityRecord(
  input: { type: 'MEMO' | 'RESTART'; recorded_at: string; memo: string | null },
  startedAt: string,
  now = Date.now(),
) {
  assertDateTime(input.recorded_at, now);
  if (Date.parse(input.recorded_at) < Date.parse(startedAt))
    throw new Error('시작 시각 이후에 기록해주세요.');
  if (
    !['MEMO', 'RESTART'].includes(input.type) ||
    (input.memo !== null && (typeof input.memo !== 'string' || input.memo.length > 500)) ||
    (input.type === 'MEMO' && !input.memo?.trim())
  )
    throw new Error('내용은 1~500자로 입력해주세요.');
}
export function saveActivityRecord(
  db: SQLiteDatabase,
  scope: RecordScope,
  parentId: number,
  input: { id?: number; type: 'MEMO' | 'RESTART'; recorded_at: string; memo: string | null; images?: DraftImage[] },
  now = Date.now(),
) {
  return withRecordWriteLock(async () => {
    const t = table(scope);
    if (
      !validId(parentId) ||
      (input.id !== undefined && !validId(input.id)) ||
      (scope === 'habit' && input.type !== 'MEMO')
    )
      throw new Error('기록을 확인해주세요.');
    let id = input.id;
    const images = input.images;
    if (images && (images.length > 5 || new Set(images.map((image) => image.file)).size !== images.length)) throw new Error('사진 목록을 확인해주세요.');
    const media = images ? await import('../media') : null;
    const { File } = images?.some((image) => image.temporary) ? await import('expo-file-system') : { File: null };
    const copied: string[] = [];
    let removed: string[] = [];
    try {
      for (const image of images ?? []) {
        if (image.temporary) { await new File!(image.uri).copy(media!.mediaFile(image.file)); copied.push(image.file); }
        else if (!media!.mediaFile(image.file).exists) throw new Error('사진 파일을 찾을 수 없습니다.');
      }
    await db.withTransactionAsync(async () => {
      const parent = await db.getFirstAsync<{ initial_started_at: string }>(
        `SELECT initial_started_at FROM ${t.parent} WHERE id = ?`,
        parentId,
      );
      if (!parent) throw new Error('항목을 찾을 수 없어요.');
      validateActivityRecord(input, parent.initial_started_at, now);
      const timestamp = new Date(now).toISOString();
      if (id) {
        const result = await db.runAsync(
          `UPDATE ${t.name} SET ${t.time} = ?, text = ?, updated_at = ?${scope === 'sober' ? ', is_restart = ?' : ''} WHERE id = ? AND ${t.foreign} = ?`,
          input.recorded_at,
          input.memo?.trim() || null,
          timestamp,
          ...(scope === 'sober' ? [input.type === 'RESTART' ? 1 : 0] : []),
          id,
          parentId,
        );
        if (!result.changes) throw new Error('기록을 찾을 수 없어요.');
      } else {
        const result = await db.runAsync(
          `INSERT INTO ${t.name} (${t.foreign}, ${t.time}, text, created_at, updated_at${scope === 'sober' ? ', is_restart' : ''}) VALUES (?, ?, ?, ?, ?${scope === 'sober' ? ', ?' : ''})`,
          parentId,
          input.recorded_at,
          input.memo?.trim() || null,
          timestamp,
          timestamp,
          ...(scope === 'sober' ? [input.type === 'RESTART' ? 1 : 0] : []),
        );
        id = result.lastInsertRowId;
      }
      if (images) {
        const previous = await db.getAllAsync<{ file_name: string }>(`SELECT file_name FROM ${t.images} WHERE ${t.imageForeign} = ?`, id!);
        removed = previous.map((row) => row.file_name).filter((name) => !images.some((image) => image.file === name));
        await db.runAsync(`DELETE FROM ${t.images} WHERE ${t.imageForeign} = ?`, id!);
        for (const [position, image] of images.entries()) await db.runAsync(`INSERT INTO ${t.images} (${t.imageForeign}, file_name, position) VALUES (?, ?, ?)`, id!, image.file, position);
      }
    });
    for (const name of removed) { try { const file = media!.mediaFile(name); if (file.exists) file.delete(); } catch {} }
    if (images?.length) media!.discardDraftImages(images);
    return id!;
    } catch (error) {
      for (const name of copied) { try { const file = media!.mediaFile(name); if (file.exists) file.delete(); } catch {} }
      throw error;
    }
  });
}
export function deleteActivityRecord(
  db: SQLiteDatabase,
  scope: RecordScope,
  parentId: number,
  id: number,
) {
  return withRecordWriteLock(async () => {
    const t = table(scope);
    if (!validId(parentId) || !validId(id)) throw new Error('기록을 확인해주세요.');
    const images = await db.getAllAsync<{ file_name: string }>(`SELECT file_name FROM ${t.images} WHERE ${t.imageForeign} = ?`, id);
    const result = await db.runAsync(
      `DELETE FROM ${t.name} WHERE id = ? AND ${t.foreign} = ?`,
      id,
      parentId,
    );
    if (!result.changes) throw new Error('기록을 찾을 수 없어요.');
    const media = images.length ? await import('../media') : null;
    for (const image of images) { try { const file = media!.mediaFile(image.file_name); if (file.exists) file.delete(); } catch {} }
  });
}
