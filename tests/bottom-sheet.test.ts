import { mockI18n } from './helpers/i18n';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import tokens from '../src/theme/tokens.json';

const require = createRequire(import.meta.url);
const ts = require('typescript');

// Execute the actual component and motion hook with controlled gesture events and animation completion.
function harness(
  initialVisible = true,
  reducedMotion = false,
  maxHeight?: number,
  options: {
    scrollFade?: boolean;
    fixedHeight?: boolean;
    fillContent?: boolean;
    keyboardAware?: boolean;
    presentation?: 'modal' | 'screen';
    dimBackdrop?: boolean;
    dismissOnBack?: boolean;
    dismissible?: boolean;
    onBeforeClose?: () => boolean;
    onOpening?: () => void;
    onOpened?: () => void;
    scrollEnabled?: boolean;
    footer?: unknown;
    contentHeader?: unknown;
    contentFullBleed?: boolean;
    list?: any;
    renderBody?: (close: any, scroll: any) => unknown;
  } = {},
) {
  const slots: any[] = [];
  let cursor = 0;
  let dirty = false;
  let effects: (() => void)[] = [];
  const frames: (() => void)[] = [];
  let close: (action?: () => void) => boolean;
  let closes = 0;
  let visible = initialVisible;
  let tree: any;
  let hardwareBack: (() => boolean) | undefined;
  const depsEqual = (a?: unknown[], b?: unknown[]) =>
    a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const memo = (factory: () => any, deps: unknown[]) => {
    const index = cursor++;
    if (!slots[index] || !depsEqual(slots[index].deps, deps))
      slots[index] = { value: factory(), deps };
    return slots[index].value;
  };
  const effect = (fn: () => any, deps: unknown[]) => {
    const index = cursor++;
    if (!slots[index] || !depsEqual(slots[index].deps, deps)) {
      const previous = slots[index];
      slots[index] = { deps };
      effects.push(() => {
        previous?.cleanup?.();
        slots[index].cleanup = fn();
      });
    }
  };
  const animations: any[] = [];
  const timers = new Map<number, () => void>();
  let timerSequence = 0;
  const scrollCommands: number[] = [];
  function shared(initial: any) {
    const index = cursor++;
    if (slots[index]) return slots[index];
    let value = initial;
    const cell: any = {
      animation: undefined,
      get value() {
        return value;
      },
      set value(next: any) {
        if (next?.kind) {
          const animation = { ...next, cell, from: value };
          cell.animation = animation;
          animations.push(animation);
        } else {
          cell.animation = undefined;
          value = next;
        }
      },
    };
    return (slots[index] = cell);
  }
  const animate = (kind: string) => (target: number, config: any, callback?: Function) => ({
    kind,
    target,
    config,
    callback,
  });
  const complete = (animation: any, finished = true) => {
    if (animation.cell.animation === animation) {
      animation.cell.animation = undefined;
      if (finished) animation.cell.value = animation.target;
    }
    animation.callback?.(finished);
  };
  const gesture = (kind: string) => {
    const instance: any = { kind, handlers: {}, config: {} };
    for (const name of [
      'onTouchesDown',
      'onTouchesMove',
      'onTouchesUp',
      'onStart',
      'onUpdate',
      'onEnd',
      'onFinalize',
    ])
      instance[name] = (fn: Function) => {
        instance.handlers[name] = fn;
        return instance;
      };
    for (const name of [
      'enabled',
      'manualActivation',
      'maxPointers',
      'shouldCancelWhenOutside',
      'requireExternalGestureToFail',
    ])
      instance[name] = (value: any) => {
        instance.config[name] = value;
        return instance;
      };
    return instance;
  };
  const exports: any = {};
  const jsx = (type: unknown, props: any, key?: string) =>
    typeof type === 'function' ? type(props) : { type, props, key };
  const sheetModules: Record<string, any> = {};
  const context: any = {
    exports,
    setTimeout: (fn: () => void) => {
      const id = ++timerSequence;
      timers.set(id, fn);
      return id;
    },
    clearTimeout: (id: number) => timers.delete(id),
    requestAnimationFrame: (fn: () => void) => {
      frames.push(fn);
      return frames.length;
    },
    cancelAnimationFrame: () => {},
    require: (name: string) => {
      if (name.endsWith('/i18n/react')) return mockI18n();
      if (name.endsWith('/NoticeProvider')) return { NoticeHost: () => null };
      const sheetModule = sheetModules[name.split('/').at(-1)!];
      if (sheetModule) return sheetModule;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react')
        return {
          createElement: (type: unknown, props: any, ...children: unknown[]) => jsx(type, { ...props, children: children.length === 1 ? children[0] : children }, props?.key),
          useRef: (value: any) => {
            const i = cursor++;
            return slots[i] ?? (slots[i] = { current: value });
          },
          useState: (value: any) => {
            const i = cursor++;
            if (!(i in slots)) slots[i] = value;
            return [
              slots[i],
              (next: any) => {
                if (!Object.is(slots[i], next)) {
                  slots[i] = next;
                  dirty = true;
                }
              },
            ];
          },
          useMemo: memo,
          useCallback: (fn: any, deps: unknown[]) => memo(() => fn, deps),
          useEffect: effect,
          useLayoutEffect: effect,
        };
      if (name.endsWith('useScrollFade'))
        return {
          useScrollFade: () => ({
            topVisible: true,
            bottomVisible: true,
            onScroll: () => {},
            onLayout: () => {},
            onContentSizeChange: () => {},
            onScrollOffset: memo(() => () => {}, []),
          }),
        };
      if (name.endsWith('ScrollEdgeFade')) return { ScrollEdgeFade: 'ScrollEdgeFade' };
      if (name.includes('tokens.json')) return { __esModule: true, default: tokens };
      if (name.includes('AppThemeProvider'))
        return {
          useAppTheme: () => ({ colors: {}, rem: 15, reducedMotion, iconSizes: { md: 20 } }),
        };
      if (name === 'react-native-safe-area-context')
        return { useSafeAreaInsets: () => ({ top: 24, bottom: 30, left: 0, right: 0 }) };
      if (name === 'react-native')
        return {
          Modal: 'Modal',
          KeyboardAvoidingView: 'KeyboardAvoidingView',
          View: 'View',
          ScrollView: 'ScrollView',
          Pressable: 'Pressable',
          useWindowDimensions: () => ({ height: 800 }),
          Keyboard: { isVisible: () => false, dismiss: () => {}, addListener: () => ({ remove: () => {} }) },
          AccessibilityInfo: { announceForAccessibility: () => {} },
          BackHandler: {
            addEventListener: (_name: string, callback: () => boolean) => {
              hardwareBack = callback;
              return {
                remove: () => {
                  hardwareBack = undefined;
                },
              };
            },
          },
        };
      if (name === 'react-native-gesture-handler')
        return {
          GestureDetector: 'GestureDetector',
          GestureHandlerRootView: 'GestureHandlerRootView',
          Gesture: { Pan: () => gesture('pan'), Native: () => gesture('native') },
        };
      if (name.endsWith('AnimatedFlatList')) return { AnimatedFlatList: 'MemoList' };
      if (name.endsWith('AnimatedScrollView')) return { AnimatedScrollView: 'ScrollView', KeyboardAwareAnimatedScrollView: 'KeyboardAwareScrollView' };
      if (name.endsWith('useBottomSheetMotion')) return hookExports;
      if (name === 'react-native-reanimated')
        return {
          __esModule: true,
          default: { View: 'AnimatedView' },
          ReduceMotion: { Always: 'always', System: 'system' },
          useSharedValue: shared,
          useAnimatedRef: () => memo(() => ({}), []),
          useAnimatedStyle: (fn: Function) => ({ current: fn }),
          useAnimatedScrollHandler: (handlers: any) => handlers.onScroll,
          scrollTo: (_ref: any, _x: number, y: number) => scrollCommands.push(y),
          cancelAnimation: (cell: any) => {
            cell.animation = undefined;
          },
          withTiming: animate('timing'),
          withSpring: animate('spring'),
        };
      if (name === 'react-native-worklets')
        return { scheduleOnRN: (fn: any, ...args: any[]) => fn(...args) };
      return {
        ColorView: 'ColorView',
        ColorPressable: 'ColorPressable',
        Text: 'Text',
        AppIcon: 'AppIcon',
      };
    },
  };
  const hookExports: any = {};
  const compile = (path: string) =>
    ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
  runInNewContext(compile('../src/components/bottom-sheet/useBottomSheetMotion.ts'), {
    ...context,
    exports: hookExports,
  });
  for (const path of [
    '../src/components/bottom-sheet/useBottomSheetLifecycle.ts',
    '../src/components/bottom-sheet/BottomSheetHeader.tsx',
    '../src/components/bottom-sheet/BottomSheetList.tsx',
    '../src/components/bottom-sheet/BottomSheetScroll.tsx',
    '../src/components/bottom-sheet/BottomSheetScrollViewport.tsx',
    '../src/components/bottom-sheet/BottomSheetBackdrop.tsx',
    '../src/components/bottom-sheet/BottomSheetContent.tsx',
  ]) {
    const moduleExports = {};
    runInNewContext(compile(path), { ...context, exports: moduleExports });
    sheetModules[
      path
        .split('/')
        .at(-1)!
        .replace(/\.tsx?$/, '')
    ] = moduleExports;
  }
  runInNewContext(compile('../src/components/bottom-sheet/BottomSheetModal.tsx'), context);
  function render() {
    do {
      dirty = false;
      cursor = 0;
      tree = exports.BottomSheetModal({
        visible,
        title: '선택',
        maxHeight,
        ...options,
        onClose: () => {
          closes++;
        },
        children: (fn: typeof close) => {
          close = fn;
          return null;
        },
      });
      const pending = effects;
      effects = [];
      pending.forEach((fn) => fn());
    } while (dirty);
    return tree;
  }
  function find(node: any, predicate: (node: any) => boolean): any {
    if (!node || typeof node !== 'object') return undefined;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat()) {
      const match = find(child, predicate);
      if (match) return match;
    }
  }
  let gestureState = 'began';
  const pan = () => find(tree, (node) => node.props?.gesture?.kind === 'pan').props.gesture;
  const manager = {
    activate: () => {
      gestureState = 'active';
      pan().handlers.onStart();
    },
    fail: () => {
      gestureState = 'failed';
      pan().handlers.onFinalize();
    },
  };
  const touchEvent = (x: number, y: number) => ({
    numberOfTouches: 1,
    allTouches: [{ absoluteX: x, absoluteY: y }],
  });
  render();
  return {
    render,
    back() {
      return hardwareBack?.();
    },
    get tree() {
      return tree;
    },
    get closes() {
      return closes;
    },
    setVisible(value: boolean) {
      visible = value;
      render();
    },
    show() {
      tree.props.onShow();
      render();
    },
    layout(value = 400) {
      this.sheet().props.children.props.onLayout({ nativeEvent: { layout: { height: value } } });
    },
    completeOpen() {
      this.layout();
      this.completeBackdrop();
      this.completeEnter();
    },
    entryAnimation() {
      return animations.findLast(
        (animation) =>
          animation.target === 0 && animation.config.duration === tokens.motion.pickerOpen,
      );
    },
    completeEnter() {
      complete(this.entryAnimation());
      render();
    },
    completeBackdrop() {
      complete(animations.findLast((animation) => animation.target === 1));
      render();
    },
    latestAnimation() {
      return animations.at(-1);
    },
    completeAnimation(finished = true) {
      complete(animations.at(-1), finished);
      render();
    },
    complete,
    offset(y: number) {
      this.scroll().props.onScroll({ contentOffset: { y } });
    },
    begin(x = 0, y = 0) {
      gestureState = 'began';
      pan().handlers.onTouchesDown(touchEvent(x, y), manager);
    },
    move(x: number, y: number) {
      if (gestureState === 'failed') return;
      pan().handlers.onTouchesMove(touchEvent(x, y), manager);
      if (gestureState === 'active') pan().handlers.onUpdate({ absoluteX: x, absoluteY: y });
    },
    end(success = true) {
      if (gestureState === 'failed') return;
      pan().handlers.onTouchesUp({}, manager);
      if (gestureState === 'active') pan().handlers.onEnd({}, success);
      pan().handlers.onFinalize();
      render();
    },
    get gestureState() {
      return gestureState;
    },
    get scrollCommands() {
      return scrollCommands;
    },
    get pan() {
      return pan();
    },
    get native() {
      return find(tree, (node) => node.props?.gesture?.kind === 'native').props.gesture;
    },
    get y() {
      return this.sheet().props.style.current().transform[0].translateY;
    },
    close(action?: () => void) {
      return close(action);
    },
    scroll() {
      return find(tree, (node) => node.type === 'ScrollView' || node.type === 'KeyboardAwareScrollView' || node.type === 'MemoList');
    },
    sheet() {
      return find(tree, (node) => node.key?.startsWith('sheet-'));
    },
    openingFallback() {
      const pending = [...timers.values()];
      timers.clear();
      pending.forEach((fn) => fn());
      render();
    },
    pendingOpeningFallback() {
      return [...timers.values()].at(-1)!;
    },
    flushFrames() {
      frames.splice(0).forEach((fn) => fn());
    },
    unmount() {
      slots.forEach((slot) => slot?.cleanup?.());
    },
  };
}

test('sheet waits for onShow, retains its body through close, and dispatches accepted work exactly once', () => {
  const h = harness();
  assert.equal(h.sheet(), undefined);
  assert.equal(h.tree.props.animationType, 'none');
  h.show();
  h.layout();
  assert.equal(h.sheet().props.entering, undefined);
  assert.equal(h.entryAnimation().config.duration, tokens.motion.pickerOpen);
  h.completeEnter();
  let actions = 0;
  assert.equal(
    h.close(() => actions++),
    true,
  );
  assert.equal(
    h.close(() => actions++),
    false,
  );
  h.render();
  assert.ok(h.sheet());
  assert.equal(h.sheet().props.pointerEvents, 'none');
  assert.equal(h.latestAnimation().config.duration, tokens.motion.pickerClose);
  const exit = h.latestAnimation();
  assert.equal(h.tree.props.visible, true);
  assert.equal(h.closes, 0);
  h.completeAnimation();
  assert.equal(h.tree.props.visible, false);
  assert.equal(h.closes, 1);
  assert.equal(actions, 0);
  h.flushFrames();
  assert.equal(actions, 1);
  h.complete(exit);
  h.flushFrames();
  assert.equal(actions, 1);
  h.setVisible(false);
  assert.equal(h.closes, 1);
});

test('rapid reopen ignores the previous close and its deferred action', () => {
  const h = harness();
  h.show();
  h.completeOpen();
  let actions = 0;
  h.close(() => actions++);
  const oldExit = h.latestAnimation();
  h.setVisible(false);
  h.setVisible(true);
  assert.ok(h.sheet());
  h.complete(oldExit);
  h.render();
  h.flushFrames();
  assert.equal(h.tree.props.visible, true);
  assert.equal(h.closes, 0);
  assert.equal(actions, 0);
});

test('hidden mount does not close; closing before onShow needs no missing animation', () => {
  const h = harness(false);
  assert.equal(h.closes, 0);
  h.setVisible(true);
  h.setVisible(false);
  assert.equal(h.tree.props.visible, false);
  assert.equal(h.closes, 1);
});

test('reduced motion applies to open and close; interrupted close never dispatches an action', () => {
  const h = harness(true, true);
  h.show();
  h.layout();
  assert.equal(h.entryAnimation().config.reduceMotion, 'always');
  h.completeEnter();
  let actions = 0;
  h.close(() => actions++);
  assert.equal(h.latestAnimation().config.reduceMotion, 'always');
  h.completeAnimation(false);
  h.flushFrames();
  assert.equal(h.tree.props.visible, false);
  assert.equal(actions, 0);
});

test('unmount and reopen prevent stale close work from running', () => {
  const h = harness();
  h.show();
  h.completeOpen();
  let actions = 0;
  h.close(() => actions++);
  h.completeAnimation();
  h.setVisible(false);
  h.setVisible(true);
  h.flushFrames();
  assert.equal(actions, 0);
  const next = harness();
  next.show();
  next.completeOpen();
  next.close(() => actions++);
  next.unmount();
  next.completeAnimation();
  next.flushFrames();
  assert.equal(next.closes, 0);
  assert.equal(actions, 0);
});

test('accepted work survives the normal picker unmount caused by onClose', () => {
  const h = harness();
  h.show();
  h.completeOpen();
  let actions = 0;
  h.close(() => actions++);
  h.completeAnimation();
  h.unmount();
  h.flushFrames();
  assert.equal(h.closes, 1);
  assert.equal(actions, 1);
});

test('sheets use the same safe screen-height limit', () => {
  const h = harness();
  h.show();
  assert.equal(h.sheet().props.children.props.style.maxHeight, 760);
});

test('ordinary sheet uses keyboard-aware scroll without a keyboard-avoiding wrapper', () => {
  const h = harness();
  h.show();
  const viewport = h.tree.props.children.props.children;
  const scroll = h.scroll();
  assert.equal(viewport.type, 'View');
  assert.equal(scroll.type, 'KeyboardAwareScrollView');
  assert.equal(scroll.props.mode, 'layout');
  assert.equal(scroll.props.bottomOffset, 16);
  assert.equal(scroll.props.keyboardShouldPersistTaps, 'handled');
  assert.equal(scroll.props.keyboardDismissMode, 'none');
  assert.equal(scroll.props.contentContainerStyle.paddingBottom, 60);
});

test('route sheet keeps its header outside its keyboard-aware scroll area', () => {
  const h = harness(true, false, undefined, { presentation: 'screen', fixedHeight: true });
  const scroll = h.scroll();
  assert.equal(scroll.type, 'KeyboardAwareScrollView');
  assert.equal(scroll.props.mode, 'layout');
  assert.equal(scroll.props.bottomOffset, 16);
  assert.equal(scroll.props.onFocus, undefined);
  assert.equal(scroll.props.onBlur, undefined);
  assert.equal(typeof scroll.props.ref, 'function');
  assert.ok(h.sheet());
});

test('explicit fixed-height sheets share the 95-percent maximum in either presentation', () => {
  for (const presentation of ['screen', 'modal'] as const) {
    const h = harness(true, false, undefined, { fixedHeight: true, presentation });
    if (presentation === 'modal') h.show();
    const surface = h.sheet().props.children;
    const expectedHeight = 800 * 0.95;
    assert.equal(surface.props.style.height, expectedHeight);
    assert.equal(surface.props.style.maxHeight, expectedHeight);
    assert(surface.props.children[2].props.className.includes('flex-1'));
    assert(h.scroll().props.className.includes('flex-1'));
  }
});

test('automatic sheets retain a bounded viewport and scroll fades', () => {
  const h = harness(true, false, undefined, { scrollFade: true });
  h.show();
  const surface = h.sheet().props.children;
  assert.equal(surface.props.style.height, undefined);
  assert.equal(surface.props.style.maxHeight, 760);
  assert.equal(h.scroll().type, 'KeyboardAwareScrollView');
  assert(h.scroll().props.className.includes('shrink'));
});

test('ordinary sheets keep scroll gestures separate from header dismissal', () => {
  const h = harness();
  h.show();
  h.completeOpen();
  assert.equal(h.scroll().type, 'KeyboardAwareScrollView');
  assert.equal(h.scroll().props.bounces, false);
  h.begin();
  h.move(0, 60);
  assert.equal(h.gestureState, 'active');
  h.end(false);
  h.completeAnimation();
  assert.equal(h.closes, 0);
});

test('list sheets create the shared virtualized list and forward data and loading callbacks', () => {
  const loadMore = () => {};
  const data = [{ id: 1 }];
  const h = harness(true, false, undefined, { fixedHeight: true, list: { data, renderItem: () => null, onEndReached: loadMore } });
  h.show();
  const list = h.scroll();
  assert.equal(list.type, 'MemoList');
  assert.equal(list.props.data, data);
  assert.equal(list.props.onEndReached, loadMore);
  assert.equal(list.props.contentContainerStyle.paddingBottom, 60);
  assert.equal(list.props.nestedScrollEnabled, true);
});

test('picker content stays fixed above the scroll area', () => {
  const contentHeader = { type: 'IconCategories', props: {} };
  const h = harness(true, false, undefined, { fixedHeight: true, scrollFade: true, contentHeader });
  h.show();
  const scroll = h.scroll();
  assert.equal(scroll.props.stickyHeaderIndices, undefined);
  assert.equal(h.sheet().props.children.props.children[1].props.children, contentHeader);
});

test('upward and horizontal touches remain scrolls; a stationary tap never becomes a sheet drag', () => {
  const h = harness();
  h.show();
  h.completeOpen();
  h.begin();
  h.move(0, -20);
  assert.equal(h.gestureState, 'failed');
  h.begin();
  h.move(30, 10);
  assert.equal(h.gestureState, 'failed');
  h.begin();
  h.move(2, 3);
  assert.equal(h.gestureState, 'began');
  h.end();
  assert.equal(h.gestureState, 'failed');
  assert.equal(h.y, 0);
  assert.equal(h.closes, 0);
  assert.deepEqual(h.scrollCommands, []);
});

test('release distance decides dismissal; passing the line and dragging back restores the sheet', () => {
  const h = harness();
  h.show();
  h.completeOpen();
  h.begin();
  h.move(0, 140);
  h.move(0, 79);
  h.end();
  assert.equal(h.latestAnimation().kind, 'spring');
  h.completeAnimation();
  assert.equal(h.y, 0);
  assert.equal(h.closes, 0);
  h.begin();
  h.move(0, 80); // 20 percent of the measured 400-point sheet.
  h.end();
  assert.equal(h.latestAnimation().kind, 'timing');
  assert.equal(h.latestAnimation().from, 80);
  assert(h.latestAnimation().target >= 400);
  assert.equal(h.closes, 0);
  assert.equal(h.sheet().props.pointerEvents, 'none');
  let applied = 0;
  assert.equal(
    h.close(() => applied++),
    false,
  );
  h.completeAnimation();
  h.flushFrames();
  assert.equal(h.tree.props.visible, false);
  assert.equal(h.closes, 1);
  assert.equal(applied, 0);
});

test('OS cancellation past the threshold restores instead of dismissing', () => {
  const h = harness(true, true);
  h.show();
  h.completeOpen();
  h.begin();
  h.move(0, 160);
  h.end(false);
  assert.equal(h.latestAnimation().kind, 'spring');
  assert.equal(h.latestAnimation().config.reduceMotion, 'always');
  h.completeAnimation();
  assert.equal(h.y, 0);
  assert.equal(h.closes, 0);
});

test('short sheets use their actual height rather than the maximum allowed height', () => {
  const h = harness(true, false, 720);
  h.show();
  h.layout(200);
  h.completeEnter();
  h.begin();
  h.move(0, 40); // 20 percent of the measured 200-point sheet.
  h.end();
  assert.equal(h.latestAnimation().kind, 'timing');
  h.completeAnimation();
  assert.equal(h.closes, 1);
});

test('Android back while a touch is undecided cannot interrupt the accepted close', () => {
  const h = harness();
  h.show();
  h.completeOpen();
  h.begin();
  h.tree.props.onRequestClose();
  h.move(0, 140);
  assert.equal(h.gestureState, 'failed');
  assert.equal(h.latestAnimation().kind, 'timing');
  h.completeAnimation();
  assert.equal(h.closes, 1);
  assert.equal(h.tree.props.visible, false);
});

test('opening uses translation without waiting for layout and closing has a safe unmeasured distance', () => {
  const h = harness();
  h.show();
  assert.ok(h.sheet());
  assert.equal(h.sheet().props.entering, undefined);
  assert.equal(h.y, 830);
  assert.equal(h.entryAnimation().target, 0);
  // The backdrop fades through one shared opacity without waiting for sheet measurement.
  const viewport = h.tree.props.children.props.children;
  assert.equal(viewport.props.children[0].props.entering, undefined);
  assert.equal(viewport.props.children[0].props.style.current().opacity, 0);
  h.completeBackdrop();
  assert.equal(viewport.props.children[0].props.style.current().opacity, 0);
  h.completeEnter();
  assert.equal(viewport.props.children[0].props.style.current().opacity, 1);
  assert.equal(h.close(), true);
  assert(h.latestAnimation().target >= 800);
  h.completeAnimation();
  assert.equal(h.closes, 1);
});

test('content growth during first opening keeps the translation target at zero and updates dismissal height', () => {
  const h = harness();
  for (let opening = 0; opening < 2; opening++) {
    if (opening) h.setVisible(true);
    h.show();
    const entry = h.entryAnimation();
    h.layout(300); // Loading content.
    h.layout(640); // Loaded habit flow before the opening finishes.
    assert.equal(h.entryAnimation(), entry);
    assert.equal(entry.target, 0);
    assert.equal(h.sheet().props.style.current().originY, undefined);
    h.completeEnter();
    assert.equal(h.y, 0);
    h.layout(700); // A later content change also stays bottom-aligned.
    assert.equal(h.y, 0);
    h.close();
    assert.equal(h.latestAnimation().target, 730);
    h.completeAnimation();
    h.setVisible(false);
  }
  assert.equal(h.closes, 2);
});

test('route sheets mount without a native Modal and use the shared keyboard-aware viewport', () => {
  const h = harness(true, false, undefined, { presentation: 'screen', fixedHeight: true });
  assert.notEqual(h.tree.type, 'Modal');
  assert.equal(h.scroll().type, 'KeyboardAwareScrollView');
  h.completeOpen();
  assert.ok(h.sheet());
});

test('route sheet Android back waits for its close animation and inactive routes do not handle back', () => {
  const h = harness(true, false, 720, { presentation: 'screen' });
  h.completeOpen();
  assert.equal(h.back(), true);
  assert.equal(h.closes, 0);
  h.completeAnimation();
  assert.equal(h.closes, 1);
  const inactive = harness(true, false, 720, { presentation: 'screen', dismissOnBack: false });
  assert.equal(inactive.back(), undefined);
});

test('busy route dismissal restores the sheet instead of hiding the guarded page', () => {
  let busy = true;
  let blocked = 0;
  const h = harness(true, false, 720, {
    presentation: 'screen',
    onBeforeClose: () => {
      if (!busy) return true;
      blocked++;
      return false;
    },
  });
  h.completeOpen();
  h.begin();
  h.move(0, 150);
  h.end();
  assert.equal(blocked, 1);
  assert.equal(h.latestAnimation().kind, 'spring');
  h.completeAnimation();
  assert.equal(h.y, 0);
  assert.equal(h.closes, 0);
  assert.ok(h.sheet());
  busy = false;
  assert.equal(h.back(), true);
  h.completeAnimation();
  assert.equal(h.closes, 1);
});

test('form drag lock disables the sheet pan and the footer stays outside the scroll viewport', () => {
  const h = harness(true, false, 720, {
    presentation: 'screen',
    scrollEnabled: false,
    footer: 'save',
  });
  assert.equal(h.pan.config.enabled, false);
  assert.equal(h.scroll().props.scrollEnabled, false);
  const footer = h.sheet().props.children.props.children.at(-1);
  assert.equal(footer.props.children, 'save');
  assert.equal(footer.props.style.paddingBottom, 45);
  assert.equal(footer.props.className, 'pb-4');
  assert.equal(h.scroll().props.contentContainerStyle, undefined);
  assert.equal(h.scroll().props.contentContainerClassName, 'gap-7 py-8');
});

test('full-bleed sheets keep sticky content and footer within their insets', () => {
  const contentHeader = { type: 'Tabs', props: {} };
  const h = harness(true, false, undefined, { contentFullBleed: true, contentHeader, footer: 'save' });
  h.show();
  const surface = h.sheet().props.children;
  assert(!surface.props.className.includes('px-[5%]'));
  const scroll = h.scroll();
  assert.equal(scroll.props.stickyHeaderIndices, undefined);
  assert.equal(surface.props.children[1].props.children, contentHeader);
  assert.equal(surface.props.children[3].props.children, 'save');
});

test('footer actions use the shared close lifecycle and dispatch once after dismissal', () => {
  let applied = 0;
  const h = harness(true, false, 720, {
    footer: (close: (action: () => void) => boolean) => ({
      onPress: () => close(() => applied++),
    }),
  });
  h.show();
  h.completeOpen();
  const action = h.sheet().props.children.props.children.at(-1).props.children;
  assert.equal(action.onPress(), true);
  assert.equal(action.onPress(), false);
  assert.equal(applied, 0);
  h.completeAnimation();
  h.flushFrames();
  assert.equal(h.closes, 1);
  assert.equal(applied, 1);
});

test('saved route sheet remains mounted until the controlled closing animation completes', () => {
  const h = harness(true, false, 720, { presentation: 'screen' });
  h.completeOpen();
  h.setVisible(false);
  assert.equal(h.closes, 0);
  assert.ok(h.sheet());
  h.completeAnimation();
  assert.equal(h.closes, 1);
  assert.equal(h.tree, null);
});

test('cold-start route recovers movement and closing without any native animation callback', () => {
  let opening = true;
  let opened = 0;
  const h = harness(true, false, 720, {
    presentation: 'screen',
    onBeforeClose: () => !opening,
    onOpened: () => {
      opening = false;
      opened++;
    },
  });
  assert.equal(h.close(), false);
  h.openingFallback();
  assert.equal(opened, 1);
  h.begin();
  h.move(0, 20);
  assert.equal(h.gestureState, 'active');
  h.end(false);
  h.completeAnimation();
  h.completeEnter();
  assert.equal(opened, 1);
  assert.equal(h.close(), true);
  h.completeAnimation();
  assert.equal(h.closes, 1);
});

test('opening fallback cannot complete a closed, unmounted or newer route session', () => {
  let opened = 0;
  const h = harness(true, false, 720, {
    presentation: 'screen',
    onOpened: () => opened++,
  });
  const oldFallback = h.pendingOpeningFallback();
  h.setVisible(false);
  oldFallback();
  assert.equal(opened, 0);
  h.completeAnimation();
  h.setVisible(true);
  oldFallback();
  assert.equal(opened, 0);
  h.openingFallback();
  assert.equal(opened, 1);
  const unmounted = harness(true, false, 720, {
    presentation: 'screen',
    onOpened: () => opened++,
  });
  unmounted.unmount();
  unmounted.openingFallback();
  assert.equal(opened, 1);
});

test('route opening callbacks follow the sheet entry rather than backdrop completion', () => {
  const events: string[] = [];
  const h = harness(true, false, 720, {
    presentation: 'screen',
    onOpening: () => events.push('opening'),
    onOpened: () => events.push('opened'),
  });
  assert.deepEqual(events, ['opening']);
  h.completeBackdrop();
  assert.deepEqual(events, ['opening']);
  h.completeEnter();
  h.completeEnter();
  assert.deepEqual(events, ['opening', 'opened']);
});

test('fallback recovers a cancelled translation and stale entry cannot release a new session', () => {
  let opened = 0;
  const h = harness(true, false, 720, {
    presentation: 'screen',
    onOpened: () => opened++,
  });
  const oldEntry = h.entryAnimation();
  h.complete(oldEntry, false);
  assert.equal(opened, 0);
  h.openingFallback();
  assert.equal(opened, 1);
  h.setVisible(false);
  h.completeAnimation();
  h.setVisible(true);
  h.complete(oldEntry);
  assert.equal(opened, 1);
  h.completeEnter();
  assert.equal(opened, 2);
});

test('blocked dismissal during entry preserves the opening callback and subsequent close', () => {
  let opening = true;
  const h = harness(true, false, 720, {
    presentation: 'screen',
    onBeforeClose: () => !opening,
    onOpened: () => {
      opening = false;
    },
  });
  h.back();
  assert.equal(h.closes, 0);
  h.completeEnter();
  assert.equal(opening, false);
  h.back();
  h.completeAnimation();
  assert.equal(h.closes, 1);
});

test('controlled dismissal requested during entry retries after the opening lock releases', () => {
  let opening = true;
  const h = harness(true, false, 720, {
    presentation: 'screen',
    onBeforeClose: () => !opening,
    onOpened: () => {
      opening = false;
    },
  });
  h.setVisible(false);
  assert.equal(h.closes, 0);
  h.completeEnter();
  h.completeAnimation();
  assert.equal(h.closes, 1);
});

test('a nested route sheet keeps a transparent dismiss target without adding a second dim backdrop', () => {
  for (const dimBackdrop of [true, false]) {
    const h = harness(true, false, undefined, { presentation: 'screen', dimBackdrop });
    h.completeOpen();
    const findBackdrop = (node: any): any => {
      if (Array.isArray(node)) return node.map(findBackdrop).find(Boolean);
      if (!node || typeof node !== 'object') return undefined;
      if (node.type === 'Pressable' && node.props.className?.includes('absolute inset-0'))
        return node;
      return findBackdrop(node.props?.children);
    };
    const backdrop = findBackdrop(h.tree);
    assert.equal(backdrop.props.className.includes('bg-theme-overlay/10'), dimBackdrop);
    backdrop.props.onPress();
    assert.equal(h.closes, 0);
    h.completeAnimation();
    assert.equal(h.closes, 1);
  }
});

test('first-run sheets disable user dismissal while retaining scroll and completion close', () => {
  let completed = false;
  const h = harness(true, false, 720, {
    dismissible: false,
    fixedHeight: true,
    onBeforeClose: () => completed,
  });
  h.show();
  h.completeOpen();
  assert.equal(h.pan.config.enabled, false);
  assert.equal(h.scroll().props.scrollEnabled, true);
  const header = h.sheet().props.children.props.children[0];
  assert.equal(header.props.children[0], undefined);
  h.tree.props.onRequestClose();
  assert.equal(h.closes, 0);
  assert.equal(h.close(), false);
  completed = true;
  assert.equal(h.close(), true);
  h.completeAnimation();
  assert.equal(h.closes, 1);
});

test('ordinary sheets use the common scroll area instead of a custom body', () => {
  const h = harness();
  h.show();
  assert.equal(h.scroll().type, 'KeyboardAwareScrollView');
});

test('sheet header remains draggable while content uses keyboard-aware scrolling', () => {
  const h = harness(true, false, undefined, { presentation: 'screen', fixedHeight: true });
  h.completeOpen();
  assert.equal(h.scroll().type, 'KeyboardAwareScrollView');
  h.begin();
  h.move(0, 60);
  assert.equal(h.gestureState, 'active');
});

test('header dismissal still runs the shared close lifecycle', () => {
  const h = harness();
  h.show();
  h.completeOpen();
  h.begin();
  h.move(0, 300);
  h.end();
  h.completeAnimation();
  assert.equal(h.closes, 1);
});

test('custom-body dismissal respects first-run and busy close guards', () => {
  const renderBody = (_close: unknown, scroll: any) => ({
    type: 'ScrollView',
    props: { onScroll: scroll.onScroll },
  });
  const firstRun = harness(true, false, 720, { dismissible: false, renderBody });
  firstRun.show();
  firstRun.completeOpen();
  assert.equal(firstRun.pan.config.enabled, false);
  firstRun.tree.props.onRequestClose();
  assert.equal(firstRun.closes, 0);
  const busy = harness(true, false, 720, { onBeforeClose: () => false, renderBody });
  busy.show();
  busy.completeOpen();
  busy.begin();
  busy.move(0, 100);
  busy.end();
  busy.completeAnimation();
  assert.equal(busy.closes, 0);
  assert.equal(busy.y, 0);
});
