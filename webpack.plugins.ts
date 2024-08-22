import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: {
      infrastructure: 'webpack-infrastructure',
      issues: 'console',
    },
  }),
];
