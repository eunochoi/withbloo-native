import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { formatDisplayDate, mockI18n } from './helpers/i18n';
const require = createRequire(import.meta.url);
const ts = require('typescript');

function scenario(scope: 'habit' | 'sober', params: Record<string, string> = {}, legacy = false) {
  const slots: any[] = [];
  let cursor = 0;
  let pending = false;
  let failWrite = false;
  let language: 'ko' | 'en' = 'ko';
  let release: () => void = () => { };
  const writes: any[] = [];
  const pushes: any[] = [];
  const records = [
    { id: 1, type: 'MEMO', recorded_at: '2024-01-10T10:00:00.000Z', memo: '마음 기록' },
    ...(scope === 'sober'
      ? [{ id: 2, type: 'RESTART', recorded_at: '2024-01-10T11:00:00.000Z', memo: null }]
      : []),
  ];
  const exports: any = {};
  const jsx = (type: unknown, props: any) => ({ type, props });
  const query = { data: records, isPending: false, error: null, refetch() { } };
  runInNewContext(
    ts.transpileModule(
      readFileSync(new URL(`../src/screens/records/${legacy || params.mode === 'new' || params.mode === 'edit' ? 'ActivityRecordFormScreen' : 'ActivityRecordListScreen'}.tsx`, import.meta.url), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
    ).outputText,
    {
      exports,
      require: function stub(name: string): any {
        if (name.endsWith('/ActivityRecordForm')) {
          const formExports: any = {};
          const source = readFileSync(new URL('../src/screens/records/ActivityRecordForm.tsx', import.meta.url), 'utf8');
          runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports: formExports, require: stub });
          return formExports;
        }
        if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
        if (name === 'react')
          return {
            useState: (initial: any) => {
              const index = cursor++;
              slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
              return [
                slots[index].value,
                (value: unknown) => {
                  slots[index].value = typeof value === 'function' ? (value as Function)(slots[index].value) : value;
                },
              ];
            },
            useEffect: (effect: () => unknown) => { const index = cursor++; if (!slots[index]) { slots[index] = true; effect(); } },
            useRef: (current: unknown) => {
              const index = cursor++;
              return (slots[index] ??= { current });
            },
          };
        if (name === 'react-native')
          return { View: 'View', TextInput: 'TextInput', Pressable: 'Pressable', Switch: 'Switch' };
        if (name === 'expo-router') return { useLocalSearchParams: () => ({ id: '1', ...params }) };
        if (name === 'expo-router/react-navigation') return { usePreventRemove() { } };
        if (name === 'expo-sqlite') return { useSQLiteContext: () => ({}) };
        if (name.endsWith('/NoticeProvider')) return { useNotice: () => ({ showNotice() { } }) };
        if (name.endsWith('/ModalNavigationProvider')) return { useModalNavigation: () => ({ openModal: (href: unknown) => pushes.push(href) }) };
        if (name.endsWith('/i18n/react')) return mockI18n(() => language);
        if (name.endsWith('/i18n/format')) return { formatDisplayDate };
        if (name.endsWith('/i18n/errors'))
          return { translateErrorMessage: (value: string) => value };
        if (name.endsWith('/media')) return { pickImages: async () => [{ file: 'photo.jpg', uri: 'cache://photo', temporary: true }], discardDraftImages() { }, mediaUri: (value: string) => value };
        if (name.endsWith('/domain/limits')) return { DIARY_IMAGE_MAX_COUNT: 5 };
        if (name.endsWith('/domain/date')) return require('../src/domain/date');
        if (name.endsWith('/domain/sober')) return { getSoberAchievements: () => [] };
        if (name.endsWith('/queries'))
          return {
            useToday: () => '2024-01-10',
            useRecordMutation: () => ({
              isPending: pending,
              mutateAsync: async (action: unknown) => {
                writes.push(action);
                pending = true;
                await new Promise<void>((resolve) => {
                  release = resolve;
                });
                pending = false;
                if (failWrite) { failWrite = false; throw new Error('저장 실패'); }
              },
            }),
          };
        if (name === '@tanstack/react-query')
          return {
            useQuery: ({ queryKey }: any) =>
              queryKey[1] === 'id'
                ? {
                  ...query,
                  data: {
                    id: 1,
                    name: '기록',
                    initial_started_at: '2024-01-01T00:00:00.000Z',
                    ...(scope === 'sober' ? { goal_mode: 'AUTO' } : {}),
                  },
                }
                : queryKey[1] === 'activity-record'
                  ? { ...query, data: records.find((record) => record.id === Number(queryKey[3])) ?? null }
                  : queryKey[1] === 'restarts'
                    ? { ...query, data: [] }
                    : query,
            useInfiniteQuery: () => ({
              ...query,
              data: { pages: [{ records }] },
              hasNextPage: false,
            }),
          };
        if (name.endsWith('/AppThemeProvider'))
          return { useAppTheme: () => ({ colors: {}, iconSizes: {} }) };
        if (name.endsWith('/ContentTopButton')) return { ContentTopButton: 'ContentTopButton', ContentTopButtons: 'ContentTopButtons' };
        const component = name.split('/').at(-1)!;
        return { [component]: component };
      },
    },
  );
  return {
    writes,
    pushes,
    records,
    release: (fail = false) => { failWrite = fail; release(); },
    setLanguage: (value: 'ko' | 'en') => { language = value; },
    render: () => {
      cursor = 0;
      let tree = legacy || params.mode === 'new' || params.mode === 'edit' ? exports.ActivityRecordFormScreen({ scope, legacy }) : exports.ActivityRecordListScreen({ scope });
      if (typeof tree.type === 'function') tree = tree.type(tree.props);
      return tree;
    },
  };
}

test('record cards place card-ratio photos before the memo', () => {
  for (const scope of ['habit', 'sober'] as const) {
    const ui = scenario(scope, { mode: 'day', date: '2024-01-10' });
    Object.assign(ui.records[0], { images: [{ id: 1, file_name: 'photo.jpg' }] });
    const items = nodes(ui.render());
    const galleryIndex = items.findIndex((node) => node.type === 'DiaryGallery');
    const memoIndex = items.findIndex((node) => node.type === 'Text' && node.props.children === '마음 기록');
    assert(galleryIndex >= 0 && galleryIndex < memoIndex);
    assert.equal(items[galleryIndex].props.cardAspect, true);
    assert.equal(items[galleryIndex].props.detail, true);
  }
});


function nodes(tree: any): any[] {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}



test('habit day shows timed memos, offers add at the top of the content, and cannot add on future dates', () => {
  const ui = scenario('habit', { mode: 'day', date: '2024-01-10' });
  const tree = ui.render();
  const add = nodes(tree).find((node) => node.type === 'ContentTopButton' && node.props.label === '기록 추가하기');
  assert(add);
  assert(nodes(tree).some((node) => node.type === 'Text' && node.props.children === '마음 기록'));
  add.props.onPress();
  const editor = scenario('habit', ui.pushes[0].params).render();
  assert.equal(editor.props.title, '기록 추가');
  assert.equal(nodes(editor).find((node) => node.type === 'TextInput').props.maxLength, 500);
  const future = scenario('habit', { mode: 'day', date: '2024-01-11' }).render();
  assert.equal(
    nodes(future).find((node) => node.type === 'ContentTopButton' && node.props.label === '기록 추가하기'),
    undefined,
  );
});

test('sober day opens one editor with restart switch and allows a regular record', async () => {
  const ui = scenario('sober', { mode: 'day', date: '2024-01-10' });
  const tree = ui.render();
  assert.equal(nodes(tree).filter((node) => node.type === 'RecordMenuButton').length, 2);
  nodes(tree).find((node) => node.type === 'ContentTopButton' && node.props.label === '기록 추가하기').props.onPress();
  const form = scenario('sober', ui.pushes[0].params);
  let editor = form.render();
  assert.equal(editor.props.title, '기록 추가');
  assert.equal(nodes(editor).find((node) => node.type === 'Switch').props.value, true);
  nodes(editor).find((node) => node.type === 'Switch').props.onValueChange(false);
  editor = form.render();
  nodes(editor).find((node) => node.type === 'TextInput').props.onChangeText('기록');
  form.render().props.headerButton.props.onPress();
  assert.equal(form.writes[0].input.type, 'MEMO');
  form.release();
  await new Promise((resolve) => setImmediate(resolve));
});

test('legacy restart edit opens the common editor with the existing record', () => {
  const ui = scenario('sober', { restartId: '2' }, true);
  ui.render();
  const editor = ui.render();
  assert.equal(editor.props.title, '기록 수정');
  assert.equal(nodes(editor).find((node) => node.type === 'Switch').props.value, true);
  assert.equal(nodes(editor).find((node) => node.type === 'TextInput').props.value, '');
});

test('editing a listed record opens a separate form with the selected record', () => {
  for (const scope of ['habit', 'sober'] as const) {
    const ui = scenario(scope);
    nodes(ui.render()).find((node) => node.type === 'RecordMenuButton').props.onPress();
    const menu = nodes(ui.render()).find((node) => node.type === 'BottomSheetModal' && node.props.visible);
    const actions = nodes(menu.props.children((afterClose: () => void) => afterClose()));
    actions.find((node) => node.type === 'PickerAction' && node.props.icon === 'edit').props.onPress();
    assert.equal(ui.pushes[0].params.recordId, '1');
    assert.equal(ui.pushes[0].params.mode, 'edit');
    assert(nodes(ui.render()).some((node) => node.type === 'RecordMenuButton'));
    const editor = scenario(scope, ui.pushes[0].params).render();
    assert.equal(editor.props.title, '기록 수정');
    assert.equal(nodes(editor).find((node) => node.type === 'TextInput').props.value, '마음 기록');
  }
});

test('legacy restart creation retains the selected day and defaults restart on', () => {
  const ui = scenario('sober', { date: '2024-01-10' }, true);
  const editor = ui.render();
  const dateField = nodes(editor).find((node) => node.type === 'RecordDateTimeField');
  assert.equal(dateField.props.draft.date, '2024-01-10');
  assert.equal(nodes(editor).find((node) => node.type === 'Switch').props.value, true);
  assert.equal(editor.props.headerButton.props.label, '저장');
});

test('restart form rejects invalid and future times without saving', () => {
  const ui = scenario('sober', { mode: 'new' });
  for (const draft of [
    { date: '2024-01-10', hour: '24', minute: '00' },
    { date: '2099-01-10', hour: '10', minute: '00' },
    { date: '2023-12-31', hour: '10', minute: '00' },
  ]) {
    nodes(ui.render()).find((node) => node.type === 'RecordDateTimeField').props.onChange(draft);
    ui.render().props.headerButton.props.onPress();
    assert.equal(ui.writes.length, 0);
    assert(nodes(ui.render()).some((node) => node.props.accessibilityRole === 'alert'));
  }
});

test('legacy restart edit preserves an unsaved draft across rerenders', () => {
  const ui = scenario('sober', { restartId: '2' }, true);
  ui.render();
  let editor = ui.render();
  nodes(editor).find((node) => node.type === 'TextInput').props.onChangeText('변경 중');
  nodes(editor).find((node) => node.type === 'RecordDateTimeField').props.onChange({ date: '2024-01-08', hour: '12', minute: '30' });
  editor = ui.render();
  assert.equal(nodes(editor).find((node) => node.type === 'TextInput').props.value, '변경 중');
  assert.equal(nodes(editor).find((node) => node.type === 'RecordDateTimeField').props.draft.date, '2024-01-08');
  assert.equal(ui.writes.length, 0);
});

test('failed save keeps the draft and allows retry', async () => {
  const ui = scenario('habit', { mode: 'new' });
  nodes(ui.render()).find((node) => node.type === 'TextInput').props.onChangeText('유지할 기록');
  ui.render().props.headerButton.props.onPress();
  ui.release(true);
  await new Promise((resolve) => setImmediate(resolve));
  let editor = ui.render();
  assert.equal(editor.props.closeRequested, false);
  assert.equal(nodes(editor).find((node) => node.type === 'TextInput').props.value, '유지할 기록');
  editor.props.headerButton.props.onPress();
  assert.equal(ui.writes.length, 2);
  ui.release();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(ui.render().props.closeRequested, true);
});

test('changing language preserves a draft in the common editor', () => {
  const ui = scenario('sober', { mode: 'new' });
  nodes(ui.render()).find((node) => node.type === 'TextInput').props.onChangeText('기록');
  ui.setLanguage('en');
  const editor = ui.render();
  assert.equal(editor.props.title, 'Add record');
  assert.equal(nodes(editor).find((node) => node.type === 'TextInput').props.value, '기록');
  assert.equal(nodes(editor).find((node) => node.type === 'Switch').props.value, true);
});



test('closing a day record editor returns to the day list', () => {
  const ui = scenario('habit', { mode: 'day', date: '2024-01-10' });
  nodes(ui.render()).find((node) => node.type === 'ContentTopButton' && node.props.label === '기록 추가하기').props.onPress();
  const editor = scenario('habit', ui.pushes[0].params).render();
  assert.equal(editor.props.onBeforeClose(), true);
  assert(nodes(ui.render()).some((node) => node.type === 'ContentTopButton' && node.props.label === '기록 추가하기'));
});

test('rapid save taps dispatch one write and prevent dismissal until saving finishes', async () => {
  const ui = scenario('habit', { mode: 'new' });
  let editor = ui.render();
  nodes(editor)
    .find((node) => node.type === 'TextInput')
    .props.onChangeText('메모');
  editor = ui.render();
  editor.props.headerButton.props.onPress();
  editor.props.headerButton.props.onPress();
  assert.equal(ui.writes.length, 1);
  assert.equal(ui.writes[0].input.type, 'MEMO');
  assert.equal(ui.writes[0].input.memo, '메모');
  assert.equal(ui.render().props.onBeforeClose(), false);
  ui.release();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(ui.render().props.closeRequested, true);
});


for (const scope of ['habit', 'sober'] as const) test(`${scope} photo selection adds and saves one attachment`, async () => {
  const ui = scenario(scope, { mode: 'new' });
  let editor = ui.render();
  nodes(editor).find((node) => node.type === 'TextInput').props.onChangeText('메모');
  nodes(editor).find((node) => node.type === 'ImageAttachments').props.onPick();
  await new Promise((resolve) => setImmediate(resolve));
  editor = ui.render();
  const images = nodes(editor).find((node) => node.type === 'ImageAttachments').props.images;
  assert.equal(images.length, 1);
  assert.equal(images[0].file, 'photo.jpg');
  editor.props.headerButton.props.onPress();
  assert.equal(ui.writes.length, 1);
  assert.equal(ui.writes[0].input.images.length, 1);
  ui.release();
});

test('empty record content prompts for text without sending a write', () => {
  const ui = scenario('habit', { mode: 'new' });
  ui.render().props.headerButton.props.onPress();
  const alert = nodes(ui.render()).find((node) => node.props.accessibilityRole === 'alert');
  assert.equal(alert.props.children, '내용을 입력해주세요.');
  assert.equal(ui.writes.length, 0);
});
