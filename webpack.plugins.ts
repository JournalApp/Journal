import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import dotenv from 'dotenv';
import { EnvironmentPlugin } from 'webpack';

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: {
      infrastructure: 'webpack-infrastructure',
      issues: 'console',
    },
  }),
  new EnvironmentPlugin({
    ...dotenv.config().parsed, // <-- this line
  }),
];
