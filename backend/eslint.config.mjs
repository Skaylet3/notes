// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  // Ignore list (flat config style)
  {
    ignores: [
      'node_modules',
      'dist',
      '**/*.d.ts',
      '*.log',
      // keep this file out of lint if you want
      'eslint.config.mjs',
    ],
  },

  // Base JS rules
  {
    files: ['**/*.{js,cjs,mjs}'],
    ...eslint.configs.recommended,
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'commonjs',
    },
  },

  // TypeScript rules **with type checking**
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked, // includes parser + type-aware rules
      eslintPluginPrettierRecommended,            // keep Prettier last in extends
    ],
    languageOptions: {
      parserOptions: {
        // Pick ONE of these. Prefer 'project' for reliability.
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,

        // If you're on typescript-eslint v7+ and want auto-detection instead:
        // projectService: true,
      },
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'commonjs',
    },
    rules: {
      // don’t over-disable; only relax what you must
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // Optional helpful ones:
      // '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      // '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
    },
  },
);
