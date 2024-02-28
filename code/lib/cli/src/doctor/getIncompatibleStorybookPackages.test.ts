import { describe, it, expect, vi } from 'vitest';
import type { AnalysedPackage } from './getIncompatibleStorybookPackages';
import {
  getIncompatibleStorybookPackages,
  getIncompatiblePackagesSummary,
  checkPackageCompatibility,
} from './getIncompatibleStorybookPackages';
import type { JsPackageManager } from '@storybook/core-common';

import * as doctorUtils from './utils';

vi.mock('chalk', () => {
  return {
    default: {
      yellow: (str: string) => str,
      cyan: (str: string) => str,
      bold: (str: string) => str,
    },
  };
});

vi.mock('./utils', () => ({
  getPackageJsonPath: vi.fn(() => Promise.resolve('package.json')),
  getPackageJsonOfDependency: vi.fn(() => Promise.resolve({})),
  PackageJsonNotFoundError: Error,
}));

const packageManagerMock = {
  getAllDependencies: () =>
    Promise.resolve({
      '@storybook/addon-essentials': '7.0.0',
    }),
  latestVersion: vi.fn(() => Promise.resolve('8.0.0')),
} as Partial<JsPackageManager>;

describe('checkPackageCompatibility', () => {
  it('returns that an package is incompatible', async () => {
    const packageName = 'my-storybook-package';
    vi.mocked(doctorUtils.getPackageJsonOfDependency).mockResolvedValueOnce({
      name: packageName,
      version: '1.0.0',
      dependencies: {
        '@storybook/core-common': '7.0.0',
      },
    } as any);
    const result = await checkPackageCompatibility(packageName, {
      currentStorybookVersion: '8.0.0',
      packageManager: packageManagerMock as JsPackageManager,
    });
    expect(result).toEqual({
      packageName: 'my-storybook-package',
      packageVersion: '1.0.0',
      hasIncompatibleDependencies: true,
      homepage: undefined,
      availableUpdate: undefined,
    });
  });

  it('returns that an package is compatible', async () => {
    const packageName = 'my-storybook-package';
    vi.mocked(doctorUtils.getPackageJsonOfDependency).mockResolvedValueOnce({
      name: packageName,
      version: '1.0.0',
      dependencies: {
        '@storybook/core-common': '8.0.0',
      },
    } as any);
    const result = await checkPackageCompatibility(packageName, {
      currentStorybookVersion: '8.0.0',
      packageManager: packageManagerMock as JsPackageManager,
    });
    expect(result).toEqual({
      packageName: 'my-storybook-package',
      packageVersion: '1.0.0',
      hasIncompatibleDependencies: false,
      homepage: undefined,
      availableUpdate: undefined,
    });
  });

  it('returns that an package is incompatible and because it is core, can be upgraded', async () => {
    const packageName = '@storybook/addon-essentials';
    vi.mocked(doctorUtils.getPackageJsonOfDependency).mockResolvedValueOnce({
      name: packageName,
      version: '7.0.0',
      dependencies: {
        '@storybook/core-common': '7.0.0',
      },
    } as any);
    const result = await checkPackageCompatibility(packageName, {
      currentStorybookVersion: '8.0.0',
      packageManager: packageManagerMock as JsPackageManager,
    });
    expect(result).toEqual({
      packageName: '@storybook/addon-essentials',
      packageVersion: '7.0.0',
      hasIncompatibleDependencies: true,
      homepage: undefined,
      availableUpdate: '8.0.0',
    });
  });
});

describe('getIncompatibleStorybookPackages', () => {
  it('returns an array of incompatible packages', async () => {
    vi.mocked(doctorUtils.getPackageJsonOfDependency).mockResolvedValueOnce({
      name: '@storybook/addon-essentials',
      version: '7.0.0',
      dependencies: {
        '@storybook/core-common': '7.0.0',
      },
    } as any);

    const result = await getIncompatibleStorybookPackages({
      currentStorybookVersion: '8.0.0',
      packageManager: packageManagerMock as JsPackageManager,
    });

    expect(result).toEqual([
      {
        packageName: '@storybook/addon-essentials',
        packageVersion: '7.0.0',
        hasIncompatibleDependencies: true,
        homepage: undefined,
        availableUpdate: '8.0.0',
      },
    ]);
  });
});

describe('getIncompatiblePackagesSummary', () => {
  it('generates a summary message for incompatible packages', () => {
    const analysedPackages: AnalysedPackage[] = [
      {
        packageName: 'storybook-react',
        packageVersion: '1.0.0',
        hasIncompatibleDependencies: true,
      },
      {
        packageName: '@storybook/addon-essentials',
        packageVersion: '7.0.0',
        hasIncompatibleDependencies: true,
        availableUpdate: '8.0.0',
      },
    ];
    const summary = getIncompatiblePackagesSummary(analysedPackages, '8.0.0');
    expect(summary).toMatchInlineSnapshot(`
      "The following packages are incompatible with Storybook 8.0.0 as they depend on different major versions of Storybook packages:
      - storybook-react@1.0.0
      - @storybook/addon-essentials@7.0.0 (8.0.0 available!)


      Please consider updating your packages or contacting the maintainers for compatibility details.
      For more on Storybook 8 compatibility, see the linked Github issue:
      https://github.com/storybookjs/storybook/issues/26031"
    `);
  });
});
