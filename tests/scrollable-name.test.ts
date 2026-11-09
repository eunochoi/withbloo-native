import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');

test('ellipsis follows measured character boundaries and disappears at the end', () => {
  const state: any[] = [0, 0, 0, 0, { name: 'abcdef', widths: [] }];
  let index = 0;
  const exports: any = {};
  const jsx = (type: unknown, props: any) => ({ type, props });
  runInNewContext(ts.transpileModule(readFileSync(new URL('../src/components/ScrollableName.tsx', import.meta.url), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, Intl,
    require: (id: string) => {
      if (id === 'react') return { useRef: () => ({ current: null }), useState: () => { const i = index++; return [state[i], (value: any) => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; }, useEffect: () => {} };
      if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (id === 'react-native') return { View: 'View', ScrollView: 'ScrollView' };
      if (id === './Text') return { Text: 'Text' };
      throw new Error(id);
    },
  });
  const render = () => { index = 0; return exports.ScrollableName({ children: 'abcdef' }); };
  let tree = render();
  tree.props.children[0].props.onLayout({ nativeEvent: { layout: { width: 40 } } });
  tree.props.children[0].props.onContentSizeChange(60);
  tree = render();
  const [marker, prefixes] = tree.props.children[1].props.children;
  marker.props.onTextLayout({ nativeEvent: { lines: [{ width: 10 }] } });
  prefixes.forEach((prefix: any, i: number) => prefix.props.onTextLayout({ nativeEvent: { lines: [{ width: (i + 1) * 10 }] } }));
  tree = render();
  assert.equal(tree.props.children[2].props.style.left, 30);
  tree.props.children[0].props.onScroll({ nativeEvent: { contentOffset: { x: 5 } } });
  tree = render();
  assert.equal(tree.props.children[2].props.style.left, 25);
  tree.props.children[0].props.onScroll({ nativeEvent: { contentOffset: { x: 20 } } });
  assert.equal(render().props.children[2], false);
});
