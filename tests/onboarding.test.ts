import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { mockI18n } from './helpers/i18n';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const jsx = (type: unknown, props: any) => ({ type, props });
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
function nodes(tree: any, type: string): any[] {
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, type));
  if (!tree || typeof tree !== 'object') return [];
  return [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
}
function load(file: string, dependencies: Record<string, any>) {
  const exports: any = {};
  runInNewContext(
    ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    {
      exports,
      require: (name: string) => {
        if (name.endsWith('.png')) return name;
        assert(name in dependencies, `Unexpected dependency: ${name}`);
        return dependencies[name];
      },
    },
  );
  return exports;
}
function hooks() {
  const slots: any[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  const react = {
    createElement: (type: any, props: any, ...children: any[]) =>
      jsx(type, { ...props, children: children.length === 1 ? children[0] : children }),
    Children: {
      toArray: (children: any) =>
        [children].flat(Infinity).filter((child) => child != null && child !== false),
    },
    createContext: (value: any) => ({ value, Provider: 'Provider' }),
    useContext: (context: any) => context.value,
    forwardRef: (render: any) => (props: any) => render(props, props.ref),
    useImperativeHandle: (ref: any, create: any) => {
      ref.current = create();
    },
    useState: (initial: any) => {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [
        slots[i],
        (value: any) => {
          slots[i] = typeof value === 'function' ? value(slots[i]) : value;
        },
      ];
    },
    useRef: (value: any) => {
      const i = cursor++;
      return slots[i] ?? (slots[i] = { current: value });
    },
    useEffect: (effect: any, deps: any[]) => {
      const i = cursor++;
      if (!slots[i] || deps.some((value, index) => !Object.is(value, slots[i].deps[index]))) {
        slots[i]?.cleanup?.();
        slots[i] = { deps };
        effects.push(() => {
          slots[i].cleanup = effect();
        });
      }
    },
  };
  return {
    react,
    render: (callback: () => any) => {
      cursor = 0;
      effects = [];
      const tree = callback();
      effects.forEach((effect) => effect());
      return tree;
    },
  };
}
function sheetHarness(platform = 'android') {
  const h = hooks();
  let completed = false;
  let failRead = false;
  let persist = async () => {};
  let saveSettings = async (_patch: unknown) => {};
  let writes = 0;
  let closes = 0;
  let pendingClose: (() => void) | undefined;
  let root: any;
  const urls: string[] = [];
  const notices: any[] = [];
  const module = load('../src/screens/onboarding/OnboardingSheet.tsx', {
    react: h.react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
      Platform: { OS: platform },
      View: 'View',
      Linking: {
        openURL: async (url: string) => {
          urls.push(url);
        },
      },
    },
    '../../i18n/react': mockI18n(),
    '../../components/BottomSheetModal': { BottomSheetModal: 'Sheet' },
    '../../components/Button': { Button: 'Button' },
    '../../components/Text': { Text: 'Text' },
    '../../components/NoticeProvider': {
      useNotice: () => ({ showNotice: (notice: any) => notices.push(notice) }),
    },
    '../../onboarding/storage': {
      hasCompletedOnboarding: async () => {
        if (failRead) throw new Error('storage');
        return completed;
      },
      completeOnboarding: async () => {
        await persist();
        completed = true;
        writes++;
      },
    },
    '../../settings/SettingsProvider': {
      useSettings: () => ({
        settings: {},
        updateSettings: (patch: unknown) => saveSettings(patch),
      }),
    },
    '../../components/AnimatedScrollView': { AnimatedScrollView: 'ScrollView' },
    '../../theme/AppThemeProvider': { useAppTheme: () => ({ reducedMotion: false }) },
    'react-native-reanimated': {
      default: { View: 'AnimatedView' },
      __esModule: true,
      FadeIn: { duration: (ms: number) => ms },
      FadeOut: { duration: (ms: number) => ms },
    },
    ...Object.fromEntries(
      ['WelcomePage', 'ThemePage', 'UsagePage', 'CalendarGuidePage', 'BackupPage', 'StartPage'].map(
        (name) => ['./' + name, { [name]: name }],
      ),
    ),
  });
  const close = (after?: () => void) => {
    if (!root.props.onBeforeClose()) return;
    closes++;
    pendingClose = after;
  };
  const render = (firstRun = true) => {
    root = h.render(() => module.OnboardingSheet({ firstRun, onClose: () => {} }));
    const body = root.props.renderScrollView({});
    const footer = root.props.footer(close);
    return {
      root,
      body,
      buttons: nodes(footer, 'Button'),
      footer,
      theme: body.props.children.props.children,
    };
  };
  return {
    render,
    gate: (ready: boolean) => h.render(() => module.FirstRunOnboarding({ ready })),
    setCompleted: (value: boolean) => {
      completed = value;
    },
    failRead: () => {
      failRead = true;
    },
    setPersist: (value: () => Promise<void>) => {
      persist = value;
    },
    setSaveSettings: (value: (patch: unknown) => Promise<void>) => {
      saveSettings = value;
    },
    closeDone: () => pendingClose?.(),
    urls,
    notices,
    get writes() {
      return writes;
    },
    get closes() {
      return closes;
    },
  };
}
function lastPage(h: ReturnType<typeof sheetHarness>, firstRun = true) {
  for (let index = 0; index < 5; index++) h.render(firstRun).buttons.at(-1).props.onPress();
  return h.render(firstRun);
}

test('first-run gate waits for readiness, skips completed onboarding and shows on storage failure', async () => {
  const h = sheetHarness();
  assert.equal(h.gate(false), null);
  h.gate(true);
  await tick();
  assert(h.gate(true));
  const completed = sheetHarness();
  completed.setCompleted(true);
  completed.gate(true);
  await tick();
  assert.equal(completed.gate(true), null);
  const failed = sheetHarness();
  failed.failRead();
  failed.gate(true);
  await tick();
  assert(failed.gate(true));
});

test('both platforms show the same six pages with surface fades and button-only navigation', () => {
  for (const platform of ['android', 'ios']) {
    const h = sheetHarness(platform);
    const types: string[] = [];
    for (let index = 0; index < 6; index++) {
      const { root, body, footer, buttons } = h.render();
      types.push(body.props.children.props.children.type);
      assert.equal(root.props.contentKey, index);
      assert.equal(root.props.scrollFade, true);
      assert.equal(root.props.contentFullBleed, true);
      assert.equal(body.type, 'ScrollView');
      assert.equal(nodes(footer, 'Pressable').length, 0);
      if (index < 5) buttons.at(-1).props.onPress();
    }
    assert.deepEqual(types, [
      'WelcomePage',
      'ThemePage',
      'UsagePage',
      'CalendarGuidePage',
      'BackupPage',
      'StartPage',
    ]);
  }
});

test('previous and next change only the current page without writing completion', () => {
  const h = sheetHarness();
  h.render().buttons.at(-1).props.onPress();
  assert.equal(h.render().root.props.contentKey, 1);
  h.render().buttons[0].props.onPress();
  assert.equal(h.render().root.props.contentKey, 0);
  assert.equal(h.render().buttons.length, 1);
  assert.equal(h.writes, 0);
});

test('completion waits for storage, prevents duplicate writes, and only then closes', async () => {
  const h = sheetHarness();
  let resolve!: () => void;
  h.setPersist(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  const current = lastPage(h);
  assert.equal(current.buttons.at(-1).props.label, '시작하기');
  const first = current.buttons.at(-1).props.onPress();
  current.buttons.at(-1).props.onPress();
  assert.equal(h.render().root.props.scrollEnabled, false);
  assert.equal(h.closes, 0);
  resolve();
  await first;
  assert.equal(h.writes, 1);
  assert.equal(h.closes, 1);
});

test('failed completion remains open, reports the error and can be retried', async () => {
  const h = sheetHarness();
  h.setPersist(async () => {
    throw new Error('storage');
  });
  await lastPage(h).buttons.at(-1).props.onPress();
  assert.equal(h.closes, 0);
  assert.equal(h.writes, 0);
  assert(nodes(h.render().footer, 'Text').some((node) => node.props.accessibilityRole === 'alert'));
  h.setPersist(async () => {});
  await h.render().buttons.at(-1).props.onPress();
  assert.equal(h.writes, 1);
  assert.equal(h.closes, 1);
});

test('replaying onboarding closes without changing completion', async () => {
  const h = sheetHarness();
  const current = lastPage(h, false);
  assert.equal(current.buttons.at(-1).props.label, '닫기');
  await current.buttons.at(-1).props.onPress();
  assert.equal(h.writes, 0);
  assert.equal(h.closes, 1);
});

test('settings persistence disables both wrapper and footer and leaves completion untouched', async () => {
  const h = sheetHarness();
  let resolve!: () => void;
  h.setSaveSettings(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  const pending = h.render().theme.props.onChange({ fontSize: 'large' });
  const saving = h.render();
  assert.equal(saving.root.props.scrollEnabled, false);
  assert(saving.buttons.every((button) => button.props.disabled));
  resolve();
  await pending;
  assert.equal(h.render().root.props.scrollEnabled, true);
  assert.equal(h.writes, 0);
});

test('settings failures are recoverable and keep the sheet open', async () => {
  const h = sheetHarness();
  h.setSaveSettings(async () => {
    throw new Error('save');
  });
  await h.render().theme.props.onChange({ fontSize: 'large' });
  const failed = h.render();
  assert.equal(failed.root.props.scrollEnabled, true);
  assert.equal(h.closes, 0);
  assert(nodes(failed.footer, 'Text').some((node) => node.props.accessibilityRole === 'alert'));
});

test('first-run drag dismissal stays guarded until completion', async () => {
  const h = sheetHarness();
  assert.equal(h.render().root.props.onBeforeClose(), false);
  await lastPage(h).buttons.at(-1).props.onPress();
  assert.equal(h.render().root.props.onBeforeClose(), true);
});

test('the common frame contains content and optional info without nesting another scroll view', () => {
  const { OnboardingFrame } = load('../src/screens/onboarding/OnboardingFrame.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View' },
    '../../components/InfoNotice': { InfoNotice: 'InfoNotice' },
    '../../components/Text': { Text: 'Text' },
  });
  for (const info of [undefined, 'Info']) {
    const tree = OnboardingFrame({
      title: 'Title',
      description: 'Description',
      info,
      children: 'Content',
    });
    assert.equal(nodes(tree, 'ScrollView').length, 0);
    assert.equal(nodes(tree, 'InfoNotice').length, info ? 1 : 0);
    assert.equal(tree.props.children[1].props.children[0], 'Content');
  }
});

test('native pages retain both languages and every non-welcome page uses the common frame', () => {
  for (const language of ['ko', 'en'] as const) {
    const h = hooks();
    const dependencies: Record<string, any> = {
      react: h.react,
      'react/jsx-runtime': { jsx, jsxs: jsx },
      'react-native': {
        View: 'View',
        ScrollView: 'ScrollView',
        Pressable: 'Pressable',
        Linking: { openURL: async () => {} },
        Image: Object.assign('Image', { resolveAssetSource: () => ({ width: 100, height: 30 }) }),
      },
      'react-native-reanimated': { default: { View: 'AnimatedView' }, __esModule: true },
      'react-native-svg': { default: 'Svg', Path: 'Path', __esModule: true },
      '../../i18n/react': mockI18n(language),
      '../../i18n/sober': require('../src/i18n/sober'),
      '../../theme/AppThemeProvider': {
        useAppTheme: () => ({
          rem: 15,
          colors: {},
          reducedMotion: false,
          iconSizes: { sm: 15, md: 22.5 },
        }),
      },
      '../../theme/accents': { ACCENT_KEYS: ['blue'] },
      '../../theme/colors': {
        ACCENT_PALETTES: Object.fromEntries(
          ['blue', 'green', 'purple', 'pink', 'yellow', 'grey'].map((key) => [
            key,
            { accent: '#000', accentDeep: '#000' },
          ]),
        ),
      },
      '../../components/Text': { Text: 'Text' },
      '../../components/AppIcon': { AppIcon: 'AppIcon' },
      '../../components/EmotionImage': { EmotionImage: 'EmotionImage' },
      '../../components/ScrollableName': { ScrollableName: 'ScrollableName' },
      '../../components/PickerOption': { PickerOption: 'PickerOption' },
      '../settings/EmotionIconStyleSelector': {
        EmotionIconStyleSelector: 'EmotionIconStyleSelector',
      },
      '../calendar/CalendarHabitProgress': { CalendarHabitProgress: 'CalendarHabitProgress' },
      '../calendar/CalendarRecordCounts': { CalendarRecordCounts: 'CalendarRecordCounts' },
      './OnboardingFrame': { OnboardingFrame: 'Frame' },
      './styles': {
        sectionClassName: 'section',
        sectionTitleClassName: 'title',
        sectionContentClassName: 'content',
        sectionTextClassName: 'text',
        exampleClassName: 'example',
      },
      '../../components/Wordmark': { Wordmark: 'Wordmark' },
      'phosphor-react-native/src/icons/ArrowsLeftRight': { ArrowsLeftRightIcon: 'LeftRightIcon' },
      '../../components/NoticeProvider': { useNotice: () => ({ showNotice: () => {} }) },
    };
    for (const name of [
      'WelcomePage',
      'ThemePage',
      'UsagePage',
      'CalendarGuidePage',
      'BackupPage',
      'StartPage',
    ]) {
      const component = load(`../src/screens/onboarding/${name}.tsx`, dependencies)[name];
      const tree = h.render(() =>
        component({
          settings: {
            themeAccent: 'blue',
            themeMode: 'light',
            fontSize: 'normal',
            emotionStyle: 'basic',
          },
          busy: false,
          onChange: async () => {},
          onOpenWeb: () => {},
        }),
      );
      if (name !== 'WelcomePage' && name !== 'StartPage') {
        assert.equal(tree.type, 'Frame');
        assert.equal(typeof tree.props.title, 'string');
        assert.equal(typeof tree.props.description, 'string');
        assert.equal(typeof tree.props.info, ['ThemePage', 'BackupPage'].includes(name) ? 'string' : 'undefined');
      }
      if (language === 'en') assert.doesNotMatch(JSON.stringify(tree), /[가-힣]/, name);
      if (name === 'UsagePage') assert.equal(nodes(tree, 'ScrollableName').length, 0);
      if (name === 'CalendarGuidePage') assert.equal(nodes(tree, 'EmotionImage').length, 4);
    }
  }
});

test('welcome selection replaces the cat image source for both positive and negative moods', () => {
  const h = hooks();
  const { WelcomePage } = load('../src/screens/onboarding/WelcomePage.tsx', {
    react: h.react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Image: 'Image', Pressable: 'Pressable' },
    'react-native-svg': { default: 'Svg', Path: 'Path', __esModule: true },
    '../../i18n/react': mockI18n(),
    '../../components/Text': { Text: 'Text' },
  });
  const render = () => h.render(() => WelcomePage());
  let tree = render();
  assert.equal(nodes(tree, 'Image').length, 1);
  assert.match(nodes(tree, 'Image')[0].props.source, /cat-blue\.png$/);
  nodes(tree, 'Pressable')[0].props.onPress();
  tree = render();
  assert.match(nodes(tree, 'Image')[0].props.source, /cat-blue-p\.png$/);
  assert.equal(nodes(tree, 'Pressable')[0].props.accessibilityState.selected, true);
  nodes(tree, 'Pressable')[2].props.onPress();
  tree = render();
  assert.match(nodes(tree, 'Image')[0].props.source, /cat-blue-n\.png$/);
  assert.equal(nodes(tree, 'Pressable')[2].props.accessibilityState.selected, true);
});
