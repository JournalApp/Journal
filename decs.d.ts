declare module '*.png'
declare module '*.sql'

declare module 'string-to-arraybuffer' {
  function str2ab(str: string): ArrayBuffer;
  export default str2ab;
}

declare module 'arraybuffer-to-string' {
  function ab2str(buffer: ArrayBuffer, encoding?: string): string;
  export default ab2str;
}

declare namespace NodeJS {
  interface Global {
    TestDate: typeof Date;
  }
}