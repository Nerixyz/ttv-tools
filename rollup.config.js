import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

export default [
  {
    input: ['src/background/twitch.ts', 'src/content-script.ts'],
    output: {
      dir: 'dist',
    },
    plugins: [
      typescript({ tsconfig: 'tsconfig.json' }),
      copy({
        targets: [{ src: 'manifest.json', dest: 'dist' }],
      }),
    ],
  },
  {
    input: 'src/context/context-script.ts',
    output: {
      dir: 'dist',
    },
    plugins: [typescript({ tsconfig: 'tsconfig.json' })],
  },
];
