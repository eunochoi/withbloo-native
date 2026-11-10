import { mockI18n, formatDisplayDate } from './helpers/i18n';
import assert from 'node:assert/strict';
import test from 'node:test';
import { moveItem } from '../src/components/sortable/order';

test('reordering shifts intervening items in both directions without mutating the draft', () => {
  const input = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(moveItem(input, 0, 4), ['b', 'c', 'd', 'e', 'a']);
  assert.deepEqual(moveItem(input, 4, 1), ['a', 'e', 'b', 'c', 'd']);
  assert.deepEqual(input, ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(moveItem(input, -1, 2), input);
  assert.deepEqual(moveItem(input, 1, 5), input);
});

test('moving through several slots always projects from the original order', () => {
  const original = ['a', 'b', 'c', 'd'];
  const first = moveItem(original, 1, 3);
  const returning = moveItem(original, 1, 0);
  assert.deepEqual(first, ['a', 'c', 'd', 'b']);
  assert.deepEqual(returning, ['b', 'a', 'c', 'd']);
  assert.deepEqual(moveItem(original, 1, 1), original);
});

// Exercise page callbacks without mounting native gesture / SQLite modules.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const jsx = (type: unknown, props: any) => ({ type, props });
function nodes(tree: any): any[] {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children), ...nodes(tree.props?.footer)];
}
function renderer(path: string, states: any[], saved: any[] = [], active = { value: false }, query?: any) {
  let cursor = 0;
  const exports: any = {};
  const habits = [1, 2, 3].map((id) => ({ id, name: `habit ${id}` }));
  runInNewContext(
    ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    {
      exports,
      require: (name: string) => {
        if (name.endsWith('/i18n/react')) return mockI18n();
        if (name.endsWith('/i18n/format')) return { formatDisplayDate };
        if (name.endsWith('/NoticeProvider'))
          return { useNotice: () => ({ showNotice: () => {} }) };
        if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
        if (name === 'react')
          return {
            useState: (initial: any) => {
              const index = cursor++;
              if (states[index] === undefined) states[index] = initial;
              return [
                states[index],
                (next: any) => {
                  states[index] = typeof next === 'function' ? next(states[index]) : next;
                },
              ];
            },
            useCallback: (fn: any) => fn,
            useEffect: () => {},
          };
        if (name === 'react-native-sortables')
          return { __esModule: true, default: { Grid: 'Grid', Handle: 'Handle' }, useItemContext: () => ({ isActive: active }) };
        if (name === 'react-native-reanimated')
          return { __esModule: true, default: { View: 'AnimatedView' }, useAnimatedRef: () => ({ current: null }), useAnimatedStyle: (style: any) => style() };
        if (name === 'react-native') return { View: 'View', Pressable: 'Pressable', Switch: 'Switch' };
        if (name === '@tanstack/react-query')
          return { useQuery: () => query ?? ({ data: habits, isPending: false, isError: false }) };
        if (name === 'expo-router') return { useRouter: () => ({}) };
        if (name === 'expo-router/react-navigation') return { usePreventRemove: () => {} };
        if (name === 'expo-sqlite') return { useSQLiteContext: () => ({}) };
        if (name === 'react-native-safe-area-context')
          return { useSafeAreaInsets: () => ({ bottom: 0 }) };
        if (name.endsWith('AppThemeProvider'))
          return { useAppTheme: () => ({ rem: 15, colors: { accent: '#112233', accentDeep: '#334455' } }) };
        if (name.endsWith('SettingsProvider'))
          return {
            useSettings: () => ({
              settings: { habitOrder: [], habitSort: 'CUSTOM', habitPriorityFirst: false, soberSort: 'CUSTOM', soberOrder: [], soberPriorityFirst: false, soberRecordSort: 'DESC' },
              updateSettings: async (value: any) => {
                saved.push(value);
              },
            }),
          };
        if (name.endsWith('/db/habit')) return { sortHabits: (items: any[]) => items };
        if (name.endsWith('/db/sober')) return { sortSobers: (items: any[]) => items };
        if (name.endsWith('/queries')) return { habitQueries: { list: () => ({}) }, soberQueries: { list: () => ({}) } };
        if (name.endsWith('useScrollFade')) return { useScrollFade: () => ({}) };
        if (name.endsWith('sortable/order')) return { moveItem };
        if (name.endsWith('domain/constants')) return { DIARY_IMAGE_MAX_COUNT: 5 };
        const component = name.split('/').at(-1)!;
        return { [component]: component };
      },
    },
  );
  return (name: string, props?: any) => {
    cursor = 0;
    return exports[name](props);
  };
}

test('photo grid keeps add tile outside draggable data and passes the drop order to the form', () => {
  const render = renderer('src/components/ImageAttachments.tsx', []);
  const moves: number[][] = [];
  const dragging: boolean[] = [];
  const props = {
    images: [
      { file: 'a', uri: 'a' },
      { file: 'b', uri: 'b' },
    ],
    busy: false,
    onReorder: (from: number, to: number) => moves.push([from, to]),
    onDragging: (value: boolean) => dragging.push(value),
  };
  let tree = render('ImageAttachments', props);
  const grid = nodes(tree).find((node) => node.type === 'Grid');
  assert.equal(grid.props.data, props.images);
  assert.equal(grid.props.autoScrollDirection, 'horizontal');
  assert.equal(grid.props.overDrag, 'none');
  grid.props.onDragStart();
  tree = render('ImageAttachments', props);
  assert.equal(
    nodes(tree).find((node) => node.props.accessibilityLabel === '이미지 추가').props.disabled,
    true,
  );
  grid.props.onDragEnd({ fromIndex: 0, toIndex: 1 });
  assert.deepEqual(moves, [[0, 1]]);
  assert.deepEqual(dragging, [true, false]);
  assert.equal(
    nodes(render('ImageAttachments', { ...props, busy: true })).find((node) => node.type === 'Grid')
      .props.sortEnabled,
    false,
  );
});

test('habit drag styling highlights only the active row and keeps a visible handle', () => {
  const active = { value: false };
  const render = renderer('src/screens/habit/HabitManualSortItem.tsx', [], [], active);
  const props = { habit: { id: 1, name: 'habit', priority: 1 }, index: 0, count: 1, disabled: false, onMove: () => {} };
  const row = render('HabitManualSortItem', props);
  assert.equal(row.props.style.backgroundColor, 'transparent');
  const handle = nodes(row).find((node) => node.props.accessibilityRole === 'button');
  assert.match(handle.props.className, /h-12 w-12/);
  assert.equal(handle.props.children.props.size, 18.75);
  active.value = true;
  assert.equal(render('HabitManualSortItem', props).props.style.backgroundColor, '#1122331A');
});

test('habit grid uses modal scrolling and saves the returned order', async () => {
  const saved: any[] = [];
  const picker = renderer('src/screens/habit/HabitSortPicker.tsx', [[3, 1, 2], 'CUSTOM', false, 'DESC', false, false, false], saved);
  const props = { visible: true, onClose: () => {} };
  const tree = picker('HabitSortPicker', props);
  const sheet = nodes(tree).find((node) => node.type === 'BottomSheetModal');
  const list = nodes(tree).find((node) => node.type === 'HabitManualSortList');
  assert.equal(sheet.props.scrollFade, true);
  assert.equal(sheet.props.scrollRef, list.props.scrollRef);
  assert.equal(list.props.disabled, false);
  const renderList = renderer('src/screens/habit/HabitManualSortList.tsx', []);
  const grid = nodes(renderList('HabitManualSortList', list.props)).find((node) => node.type === 'Grid');
  assert.equal(grid.props.scrollableRef, sheet.props.scrollRef);
  grid.props.onDragStart();
  assert.equal(nodes(picker('HabitSortPicker', props)).find((node) => node.type === 'BottomSheetModal').props.scrollEnabled, false);
  grid.props.onDragEnd({ data: [{ id: 3 }, { id: 2 }, { id: 1 }] });
  const button = nodes(picker('HabitSortPicker', props)).find((node) => node.type === 'BottomSheetModal').props.headerButton;
  assert.equal(button.props.disabled, false);
  button.props.onPress();
  await Promise.resolve();
  assert.deepEqual(JSON.parse(JSON.stringify(saved)), [{ habitSort: 'CUSTOM', habitPriorityFirst: false, habitOrder: [3, 2, 1] }]);
});

test('automatic habit sorting remains usable while manual order is loading or has failed', async () => {
  for (const query of [
    { data: undefined, isPending: true, isError: false },
    { data: undefined, isPending: false, isError: true },
  ]) {
    const saved: any[] = [];
    const states: any[] = [null, 'DESC', false, 'DESC', false, false, false];
    const render = renderer('src/screens/habit/HabitSortPicker.tsx', states, saved, { value: false }, query);
    const props = { visible: true, onClose: () => {} };
    let tree = render('HabitSortPicker', props);
    assert.equal(nodes(tree).some((node) => node.type === 'QueryState'), false);
    const sheet = nodes(tree).find((node) => node.type === 'BottomSheetModal');
    assert.equal(sheet.props.scrollFade, true);
    assert.equal(sheet.props.headerButton.props.disabled, false);
    sheet.props.headerButton.props.onPress();
    await Promise.resolve();
    assert.deepEqual(JSON.parse(JSON.stringify(saved)), [{ habitSort: 'DESC', habitPriorityFirst: false }]);
    states[1] = 'CUSTOM';
    states[4] = false;
    tree = render('HabitSortPicker', props);
    assert.equal(nodes(tree).some((node) => node.type === 'QueryState'), true);
    assert.equal(nodes(tree).find((node) => node.type === 'BottomSheetModal').props.headerButton.props.disabled, true);
  }
});


test('habit sort radio choices select one mode and retain the standard choice', () => {
  const states: any[] = [[1, 2, 3], 'CUSTOM', false, 'ASC', false, false, false];
  const render = renderer('src/screens/habit/HabitSortPicker.tsx', states);
  const props = { visible: true, onClose: () => {} };
  let tree = render('HabitSortPicker', props);
  let radios = nodes(tree).filter((node) => node.props.accessibilityRole === 'radio');
  assert.equal(radios.length, 2);
  assert.equal(radios[0].props.accessibilityState.checked, false);
  assert.equal(radios[1].props.accessibilityState.checked, true);
  radios[0].props.onPress();
  assert.equal(states[1], 'ASC');
  tree = render('HabitSortPicker', props);
  radios = nodes(tree).filter((node) => node.props.accessibilityRole === 'radio');
  assert.equal(radios[0].props.accessibilityState.checked, true);
  assert.equal(radios[1].props.accessibilityState.checked, false);
  radios[1].props.onPress();
  assert.equal(states[1], 'CUSTOM');
});

test('custom order can be applied without changes', () => {
  const states: any[] = [[1, 2, 3], 'CUSTOM', false, 'DESC', false, false, false, false];
  const render = renderer('src/screens/habit/HabitSortPicker.tsx', states);
  const props = { visible: true, onClose: () => {} };
  let tree = render('HabitSortPicker', props);
  assert.equal(nodes(tree).find((node) => node.type === 'BottomSheetModal').props.headerButton.props.disabled, false);
  nodes(tree).filter((node) => node.props.accessibilityRole === 'radio')[1].props.onPress();
  tree = render('HabitSortPicker', props);
  assert.equal(nodes(tree).find((node) => node.type === 'BottomSheetModal').props.headerButton.props.disabled, false);
});


test('sober custom order saves dragged IDs and blocks apply during drag', async () => {
  const saved: any[] = [];
  const states: any[] = [[3, 1, 2], 'CUSTOM', false, 'DESC', 'DESC', false, false, false, false];
  const render = renderer('src/screens/sober/SoberSortPicker.tsx', states, saved);
  const props = { visible: true, onClose: () => {} };
  const tree = render('SoberSortPicker', props);
  const list = nodes(tree).find((node) => node.type === 'SoberManualSortList');
  list.props.onDraggingChange(true);
  assert.equal(nodes(render('SoberSortPicker', props)).find((node) => node.type === 'BottomSheetModal').props.headerButton.props.disabled, true);
  list.props.onOrderChange([3, 2, 1]);
  list.props.onDraggingChange(false);
  const button = nodes(render('SoberSortPicker', props)).find((node) => node.type === 'BottomSheetModal').props.headerButton;
  assert.equal(button.props.disabled, false);
  button.props.onPress();
  await Promise.resolve();
  assert.deepEqual(JSON.parse(JSON.stringify(saved)), [{ soberSort: 'CUSTOM', soberPriorityFirst: false, soberRecordSort: 'DESC', soberOrder: [3, 2, 1] }]);
});
