import type { PostgrestError } from '@supabase/supabase-js';
import { getNodeString } from '@udecode/plate';

function isRenderer() {
  // running in a web browser
  if (typeof process === 'undefined') return true;

  // node-integration is disabled
  if (!process) return true;

  // We're in node.js somehow
  if (!process.type) return false;

  return process.type === 'renderer';
}

function shallowEqual(object1: Record<string, unknown>, object2: Record<string, unknown>) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }
  return true;
}

function arrayEquals(a: Array<string>, b: Array<string>) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
}

function isArrayEmpty(a: unknown[]) {
  return Array.isArray(a) && !a.length;
}

const countWords = (text: string): string[] => {
  return text
    .replace(/[\t\n\r.?!]/gm, ' ')
    .split(' ')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const countEntryWords = (content: object[]) => {
  if (Array.isArray(content)) {
    return countWords(content.map((n: any) => getNodeString(n)).join(' '));
  } else {
    return 0;
  }
};

const entryHasNoContent = (content: any[]) => {
  return content.some((n: any) => !getNodeString(n));
};

const setCssVars = (items: any, prefix = '-'): void => {
  Object.entries(items).flatMap(([key, value]: any) => {
    const varName = `${prefix}-${key}`;
    if (typeof value === 'object') {
      setCssVars(value, varName);
    } else {
      document.documentElement.style.setProperty(varName, value);
    }
  });
};

const createCssVar = (items: Record<string, unknown>, prefix = '-'): string[] => {
  return Object.entries(items).flatMap(([key, value]) => {
    const varName = `${prefix}-${key}`;
    if (typeof value === 'object' && value !== null) {
      return createCssVar(value as Record<string, unknown>, varName);
    }
    return `${varName}:${value}`;
  });
};


const createCssVars = (themeColors: Record<string, unknown>) => createCssVar(themeColors).join(';');

const alphaToHex = (alpha: number) => {
  if (alpha < 0) alpha = 0;
  if (alpha > 100) alpha = 100;
  const multiplier = 255 / 100;
  const val = Math.round(alpha * multiplier).toString(16);
  return val.length == 1 ? '0' + val : val;
};

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function isDev() {
  return process.env.NODE_ENV == 'development' || isTesting();
}

function isTesting() {
  if (isRenderer()) {
    return window.electronAPI.isTesting();
  } else {
    return process.argv.includes('testing');
  }
}

function isUnauthorized(error: PostgrestError) {
  if (error.message == 'JWT expired' || error.code == '42501') {
    return true;
  } else {
    return false;
  }
}

function isUniqueViolation(error: PostgrestError) {
  if (error.code == '23505') {
    return true;
  } else {
    return false;
  }
}

function isForeignKeyViolation(error: PostgrestError) {
  if (error.code == '23503') {
    return true;
  } else {
    return false;
  }
}

function randomInt(max: number) {
  // max number (exclusive)
  // e.g. max=3 -> 0,1,2
  return (max * Math.random()) << 0;
}

const awaitTimeout = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

const capitalize = (word: string) => {
  return word[0].toUpperCase() + word.substring(1);
};

const displayAmount = (amount: number) => {
  // prevent amount being -0
  if (amount == 0) {
    amount = 0;
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const a = formatter.format(amount / 100);
  if (a.slice(-3) == '.00') {
    return a.slice(0, -3);
  } else {
    return a;
  }
};

export {
  shallowEqual,
  arrayEquals,
  countWords,
  createCssVars,
  setCssVars,
  alphaToHex,
  ordinal,
  isDev,
  isTesting,
  isUnauthorized,
  isUniqueViolation,
  isForeignKeyViolation,
  randomInt,
  isArrayEmpty,
  entryHasNoContent,
  countEntryWords,
  awaitTimeout,
  capitalize,
  displayAmount,
};
