import { mockI18n, formatDisplayDate, soberI18n } from './helpers/i18n';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { URL } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
type Node = { type: string; props: any };

// Run the real picker handlers and re-render its draft state without native UI.
function picker(mode: 'AUTO' | 'MANUAL', days: number | null) {
  let language: 'ko' | 'en' = 'ko';
  const states: unknown[] = [];
  let cursor = 0;
  const exports: Record<string, Function> = {};
  const jsx = (type: string, props: any): Node => ({ type, props });
  runInNewContext(
    ts.transpileModule(
      readFileSync(new URL('../src/screens/sober/SoberGoalPicker.tsx', import.meta.url), 'utf8'),
      {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name.endsWith('/i18n/react')) return mockI18n(() => language);
        if (name.endsWith('/i18n/format')) return { formatDisplayDate };
        if (name.endsWith('/i18n/sober')) return soberI18n;
        if (name.endsWith('/AppThemeProvider'))
          return { useAppTheme: () => ({ colors: { accent: '#678' }, iconSizes: { md: 18 } }) };
        if (name === 'react')
          return {
            useEffect: () => undefined,
            useRef: () => ({ current: null }),
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in states)) states[index] = initial;
              return [
                states[index],
                (value: unknown) => {
                  states[index] = value;
                },
              ];
            },
          };
        if (name === 'react-native') return { Switch: 'Switch', ScrollView: 'ScrollView', TextInput: 'TextInput', View: 'View' };
        if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
        if (name.endsWith('/domain/sober')) return require('../src/domain/sober');
        if (name.endsWith('/domain/limits')) return require('../src/domain/limits');
        const component = name.split('/').at(-1)!;
        return { [component]: component };
      },
    },
  );
  const applied: unknown[][] = [];
  const render = () => {
    cursor = 0;
    const shell = exports.SoberGoalPicker({
      mode,
      days,
      onClose: () => undefined,
      onApply: (...args: unknown[]) => applied.push(args),
    });
    const nodes: Node[] = [];
    const walk = (value: any) => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value?.props) {
        nodes.push(value);
        walk(value.props.children);
      }
    };
    walk(shell);
    const header = nodes.find((node) => node.type === 'SheetHeader')!;
    return {
      shell,
      title: header.props.title,
      switches: nodes.filter((node) => node.type === 'Switch'),
      options: nodes.filter((node) => node.type === 'PickerOption'),
      input: nodes.find((node) => node.type === 'TextInput')!,
      apply: header.props.headerButton,
      close: header.props.onClose,
    };
  };
  return {
    render,
    applied,
    setLanguage: (value: 'ko' | 'en') => {
      language = value;
    },
  };
}

test('goal methods share one sheet and preserve their drafts when switching', () => {
  const ui = picker('AUTO', null);
  let view = ui.render();
  assert.equal(view.shell.type, 'SheetModal');
  assert.equal(view.title, '목표 설정');
  assert.deepEqual(view.switches.map((toggle) => toggle.props.accessibilityLabel), [
    '자동 목표', '기간 설정', '직접 입력',
  ]);
  assert.equal(view.options.length, 9);
  assert.equal(view.input.props.editable, false);

  view.switches[1].props.onValueChange(true);
  ui.render().options.find((option) => option.props.accessibilityLabel === '1개월')!.props.onPress();
  ui.render().switches[2].props.onValueChange(true);
  view = ui.render();
  assert.equal(view.input.props.editable, true);
  view.input.props.onChangeText('12');
  ui.render().switches[1].props.onValueChange(true);
  view = ui.render();
  assert.equal(view.options.find((option) => option.props.selected)!.props.accessibilityLabel, '1개월');
  assert.equal(view.input.props.value, '12');
  assert.deepEqual(ui.applied, []);
  view.apply.props.onPress();
  assert.deepEqual(ui.applied, [['MANUAL', 30]]);
});

test('closing a draft does not apply it and automatic goals clear manual days', () => {
  const ui = picker('MANUAL', 30);
  assert.equal(ui.render().switches[1].props.value, true);
  ui.render().switches[2].props.onValueChange(true);
  ui.render().input.props.onChangeText('99');
  ui.render().close();
  assert.deepEqual(ui.applied, []);
  ui.render().switches[0].props.onValueChange(true);
  ui.render().apply.props.onPress();
  assert.deepEqual(ui.applied, [['AUTO', null]]);
});

test('custom goals preserve saved days and validate before applying', () => {
  const ui = picker('MANUAL', 12);
  assert.equal(ui.render().input.props.value, '12');
  assert.equal(ui.render().switches[2].props.value, true);
  for (const value of ['', '0', '-1', '1.5', '36501', 'abc', ' 7']) {
    ui.render().input.props.onChangeText(value);
    const { apply } = ui.render();
    assert.equal(apply.props.disabled, true);
    apply.props.onPress();
  }
  assert.deepEqual(ui.applied, []);
  for (const value of ['1', '36500', '00007']) {
    ui.render().input.props.onChangeText(value);
    const { apply } = ui.render();
    assert.equal(apply.props.disabled, false);
    apply.props.onPress();
    assert.deepEqual(ui.applied.at(-1), ['MANUAL', Number(value)]);
  }
});

test('English uses a short title and changing languages keeps custom days', () => {
  const ui = picker('AUTO', null);
  ui.setLanguage('en');
  assert.equal(ui.render().title, 'Set goal');
  ui.render().switches[2].props.onValueChange(true);
  assert.equal(ui.render().input.props.accessibilityLabel, 'Custom goal days');
  ui.render().input.props.onChangeText('123');
  ui.setLanguage('ko');
  assert.equal(ui.render().input.props.value, '123');
  ui.render().apply.props.onPress();
  assert.deepEqual(ui.applied, [['MANUAL', 123]]);
});
