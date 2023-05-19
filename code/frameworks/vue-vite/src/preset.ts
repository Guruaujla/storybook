import path from 'path';
import type { PresetProperty } from '@storybook/types';
import { mergeConfig } from 'vite';
import type { StorybookConfig } from './types';
import { vueComponentMeta } from './plugins/vue-component-meta';

export const core: PresetProperty<'core', StorybookConfig> = async (config, options) => {
  const framework = await options.presets.apply<StorybookConfig['framework']>('framework');

  return {
    ...config,
    builder: {
      name: path.dirname(
        require.resolve(path.join('@storybook/builder-vite', 'package.json'))
      ) as '@storybook/builder-vite',
      options: typeof framework === 'string' ? {} : framework?.options.builder || {},
    },
    renderer: '@storybook/vue',
  };
};

export const typescript: PresetProperty<'typescript', StorybookConfig> = async (config) => ({
  ...config,
  skipBabel: true,
});

const ts: typeof import('typescript/lib/tsserverlibrary') = require('typescript');

let typescriptPresent;
try {
  require.resolve('typescript');
  typescriptPresent = true;
} catch (e) {
  typescriptPresent = false;
}
console.log('typescriptPresent', typescriptPresent, ' typescript ', typescript);

export const viteFinal: StorybookConfig['viteFinal'] = async (config, { presets }) => {
  console.log('presents ', presets);
  return mergeConfig(config, {
    plugins: [vueComponentMeta()],
    resolve: {
      alias: {
        vue: 'vue/dist/vue.esm.js',
      },
    },
  });
};
