import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');

test('only overflowing names capture a tap and enable horizontal scrolling', () => {
  const state = [false, false];
  let stateIndex = 0;
  const exports: any = {};
  const jsx = (type: unknown, props: any) => ({ type, props });
  runInNewContext(
    ts.transpileModule(
      readFileSync(new URL('../src/components/ScrollableName.tsx', import.meta.url), 'utf8'),
      { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      require: (id: string) => {
        if (id === 'react')
          return {
            useState: () => {
              const index = stateIndex++;
              return [
                state[index],
                (value: boolean) => {
                  state[index] = value;
                },
              ];
            },
            useEffect: () => {},
          };
        if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
        if (id === 'react-native')
          return { View: 'View', Pressable: 'Pressable', ScrollView: 'ScrollView' };
        if (id === './Text') return { Text: 'Text' };
        throw new Error(id);
      },
    },
  );
  const render = () => {
    stateIndex = 0;
    return exports.ScrollableName({ children: 'A long habit name' });
  };
  let tree = render();
  assert.equal(tree.props.children[1].type, 'Text');
  tree.props.children[0].props.onTextLayout({ nativeEvent: { lines: [{}, {}] } });
  tree = render();
  assert.equal(tree.props.children[1].type, 'Pressable');
  let stopped = 0;
  tree.props.children[1].props.onPress({ stopPropagation: () => stopped++ });
  assert.equal(stopped, 1);
  tree = render();
  assert.equal(tree.props.children[1].type, 'ScrollView');
  assert.equal(tree.props.children[1].props.horizontal, true);
  tree.props.children[1].props.children.props.onPress({ stopPropagation: () => stopped++ });
  assert.equal(stopped, 2);
  tree = render();
  assert.equal(tree.props.children[1].type, 'Pressable');
});
