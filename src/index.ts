import barrelLoaderRust from './barrel-loader';

declare const module: { exports?: unknown };

const isCjs = typeof module !== 'undefined' && typeof module.exports !== 'undefined';

if (isCjs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  (module as any).exports = barrelLoaderRust;
}

export { barrelLoaderRust };
export * from './barrel-loader.types';
export default barrelLoaderRust;
