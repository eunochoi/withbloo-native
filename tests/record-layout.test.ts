import { mockI18n, formatDisplayDate } from './helpers/i18n';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const jsx = (type: unknown, props: any) => ({ type, props });
function load(file: string, modules: Record<string, any> = {}) {
  const exports: Record<string, any> = {};
  runInNewContext(
    ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    {
      exports,
      require: (name: string) => {
        if (name.endsWith('/i18n/format')) return { formatDisplayDate };
        if (name.endsWith('/i18n/react')) return mockI18n();
        if (name in modules) return modules[name];
        if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
        if (name === 'react-native')
          return {
            View: 'View',
            ScrollView: 'ScrollView',
            Pressable: 'Pressable',
            KeyboardAvoidingView: 'KeyboardAvoidingView',
            Image: 'Image',
          };
        if (name === 'react-native-safe-area-context')
          return { useSafeAreaInsets: () => ({ top: 32, bottom: 24 }) };
        if (name.includes('AppThemeProvider'))
          return { useAppTheme: () => ({ colors: { accent: '#00F' }, iconSizes: { md: 24 } }) };
        if (name === './ColorTransition')
          return { ColorView: 'ColorView', ColorKeyboardAvoidingView: 'ColorKeyboardAvoidingView' };
        if (name === './Text' || name === '../Text') return { Text: 'Text' };
        if (name === './ScrollableName' || name === '../ScrollableName') return { ScrollableName: 'ScrollableName' };
        if (name === './AppIcon' || name === '../AppIcon') return { AppIcon: 'AppIcon' };
        if (name === './ScrollEdgeFade') return { ScrollEdgeFade: 'ScrollEdgeFade' };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  return exports;
}

test('record form keeps overlays and the header outside its clipped scroll area', () => {
  const calls: string[] = [];
  let allowClose = false;
  const { RecordFormLayout } = load('../src/components/RecordFormLayout.tsx', {
    react: { useRef: (current: unknown) => ({ current }), useEffect: () => {} },
    'expo-router': { useRouter: () => ({ canGoBack: () => false, replace: (route: string) => calls.push(route) }) },
    'expo-router/react-navigation': { useIsFocused: () => true },
    './AnimatedScrollView': { KeyboardAwareAnimatedScrollView: 'ScrollView' },
    './SheetHeader': { SheetHeader: 'SheetHeader' },
    './NoticeProvider': { NoticeHost: 'NoticeHost' },
    '../hooks/useScrollFade': { useScrollFade: () => ({}) },
  });
  const render = () => RecordFormLayout({
    title: '일기 작성',
    backRoute: '/diary',
    onBeforeClose: () => allowClose,
    overlays: 'picker',
    children: 'fields',
    scrollEnabled: false,
  });
  const [layout, overlay] = render().props.children;
  const [header, viewport] = layout.props.children;
  assert.equal(header.type, 'SheetHeader');
  assert.match(viewport.props.className, /overflow-hidden/);
  const [scroll, topFade, bottomFade] = viewport.props.children;
  assert.equal(scroll.props.scrollEnabled, false);
  assert.equal(scroll.props.children.props.children, 'fields');
  assert.equal(topFade.props.edge, 'top');
  assert.equal(bottomFade.props.edge, 'bottom');
  assert.equal(overlay, 'picker');
  header.props.onClose();
  assert.deepEqual(calls, []);
  allowClose = true;
  header.props.onClose();
  assert.deepEqual(calls, ['/diary']);
});

test('shared header respects custom back guards, history and per-screen fallback routes', () => {
  const calls: string[] = [];
  let hasHistory = false;
  const { RecordHeader } = load('../src/components/RecordHeader.tsx', {
    'expo-router': {
      useRouter: () => ({
        canGoBack: () => hasHistory,
        back: () => calls.push('back'),
        replace: (route: string) => calls.push(route),
      }),
    },
  });
  for (const route of ['/diary', '/habit', '/sober', '/']) {
    const header = RecordHeader({ title: '제목', backRoute: route });
    header.props.children[0].props.onPress();
  }
  assert.deepEqual(calls, ['/diary', '/habit', '/sober', '/']);
  hasHistory = true;
  RecordHeader({ title: '제목' }).props.children[0].props.onPress();
  RecordHeader({
    title: '제목',
    onBack: () => calls.push('guard'),
  }).props.children[0].props.onPress();
  assert.deepEqual(calls.slice(-2), ['back', 'guard']);
});

test('sheet header retains its close button, action and scrollable title', () => {
  const { SheetHeader } = load('../src/components/SheetHeader.tsx');
  const nodes = (tree: any): any[] =>
    Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children)] : [];
  let closed = 0;
  const action = jsx('HeaderAction', {});
  const tree = nodes(SheetHeader({
    title: '제목',
    scrollableTitle: true,
    onClose: () => closed++,
    headerButton: action,
  }));
  const closeButtons = tree.filter((node) => node.type === 'Pressable');
  assert.equal(closeButtons.length, 2);
  assert.equal(closeButtons[1].props.children.props.name, 'chevron-left');
  for (const button of closeButtons) button.props.onPress();
  assert.equal(closed, 2);
  const locked = nodes(SheetHeader({ title: '제목', onClose: () => closed++, handleDisabled: true }));
  assert(locked.filter((node) => node.type === 'Pressable').every((button) => button.props.disabled));
  assert(tree.includes(action));
  assert.equal(tree.find((node) => node.type === 'ScrollableName').props.children, '제목');
});
