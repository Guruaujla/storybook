import path from 'path';
import type { PluginOption } from 'vite';
import { createFilter } from 'vite';
import MagicString from 'magic-string';

import * as ts from 'typescript';

import type { MetaCheckerOptions } from 'vue-component-meta';
import { createComponentMetaCheckerByJsonConfig } from 'vue-component-meta';

export function vueComponentMeta(): PluginOption {
  const include = /\.(vue)$/;
  const filter = createFilter(include);

  const checkerOptions: MetaCheckerOptions = {
    forceUseTs: true,
    schema: { ignore: ['MyIgnoredNestedProps'] },
    printer: { newLine: 1 },
  };

  const checker = createComponentMetaCheckerByJsonConfig(
    path.join(__dirname, '../../../../'),
    checkerOptions,
    ts
  );
  return {
    name: 'storybook:vue-component-meta-plugin',
    async transform(src: string, id: string) {
      if (!filter(id)) return undefined;

      let metaSource;
      try {
        const meta = checker.getComponentMeta(id);

        metaSource = {
          exportName: checker.getExportNames(id)[0],
          displayName: id
            .split(path.sep)
            .slice(-1)
            .join('')
            .replace(/\.(vue)/, ''),
          ...meta,
          sourceFiles: id,
        };
        console.log(metaSource);
        metaSource = JSON.stringify(metaSource);
        const s = new MagicString(src);
        s.append(`;__component__.exports.__docgenInfo = ${metaSource}`);

        return {
          code: s.toString(),
          map: s.generateMap({ hires: true, source: id }),
        };
      } catch (e) {
        console.error(e);
        return undefined;
      }
    },
  };
}

function getTypescript() {
  // eslint-disable-next-line global-require
  const tss: typeof import('typescript/lib/tsserverlibrary') = require('typescript');
  return tss;
}
