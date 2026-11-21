import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('existing sheet routes use the Expo native stack form sheet', () => {
  const app = source('app/_layout.tsx');
  const routes = app.match(/const sheetRoutes = \[([\s\S]*?)\];/)?.[1] ?? '';
  for (const route of [
    'diary/[id]/index',
    'diary/[id]/edit',
    'habit/[id]/index',
    'sober/[id]/index',
    'habit/[id]/records',
    'sober/[id]/records',
    'calendar/[date]',
    'home/[year]/stats',
    'privacy',
    'image',
  ]) assert(routes.includes(`'${route}'`), route);
  assert.match(app, /sheetRoutes\.map[\s\S]*presentation: 'formSheet'/);
  assert.match(app, /Platform\.OS === 'android' \? metrics\.androidSheetCornerRadius : undefined/);
});

test('local diary pickers let Expo dismiss before releasing the list state', () => {
  const sheet = source('src/components/SheetModal.tsx');
  assert(sheet.includes("from '@expo/ui/community/bottom-sheet'"));
  assert(sheet.includes('onDismiss={onDismiss}'));
  for (const file of ['DiarySortPicker.tsx', 'DiaryFilterPicker.tsx']) {
    const picker = source(`src/screens/diary/${file}`);
    assert(picker.includes('<SheetModal'));
    assert(picker.includes('onDismiss={onClose}'));
    assert(picker.includes('sheet.current?.dismiss()'));
  }
  const list = source('app/(tabs)/diary.tsx');
  assert.equal(list.match(/onClose=\{\(\) => setPicker\(null\)\}/g)?.length, 2);
});

test('record collection sheets keep their header outside the clipped scroll area with both fades', () => {
  for (const file of ['src/screens/records/ActivityRecordListScreen.tsx', 'app/sober/[id]/memos.tsx']) {
    const page = source(file);
    assert.match(page, /<SheetHeader[\s\S]*?overflow-hidden[\s\S]*?<ScrollEdgeFade/);
    assert.match(page, /edge="top" visible=\{sheetFade\.topVisible\}/);
    assert.match(page, /edge="bottom"\s+visible=\{sheetFade\.bottomVisible\}/);
  }
});
