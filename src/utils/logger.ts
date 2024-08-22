import { isDev } from './misc';

const logger = (data: unknown) => {
  if (isDev()) {
    console.log(data);
  }
};

export { logger };
