import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import nodeResolve from '@rollup/plugin-node-resolve';

export default [
  {
    input: ['src/background/twitch.ts', 'src/content-script.ts'],
    output: {
      dir: 'dist/build',
    },
    plugins: [
      typescript({ tsconfig: 'tsconfig.json' }),
      nodeResolve({extensions: ['.js','.ts']}),
      copy({
        targets: [{ src: 'manifest.json', dest: 'dist/build' }],
      }),
    ],
  },
  {
    input: 'src/context/context-script.ts',
    output: {
      dir: 'dist/build',
    },
    plugins: [typescript({ tsconfig: 'tsconfig.json' })],
  },
  {
    input: 'src/options/options.ts',
    output: {
      dir: 'dist/build/options',
    },
    plugins: [
      typescript({tsconfig: 'tsconfig.json'}),
      copy({
        targets: [{
          src: ['src/options/options.html', 'src/options/options.css'],
          dest: 'dist/build/options',
        }]
      }),
    ],
  },
];
