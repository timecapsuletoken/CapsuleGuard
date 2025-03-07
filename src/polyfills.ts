import { Buffer } from 'buffer';

// Make Buffer available globally
window.Buffer = Buffer;

// Polyfill for process.env
if (typeof window.process === 'undefined') {
  window.process = { env: {} } as any;
}

// Polyfill for global
if (typeof window.global === 'undefined') {
  window.global = window;
}

console.log('Polyfills initialized:', {
  hasBuffer: typeof window.Buffer !== 'undefined',
  hasProcess: typeof window.process !== 'undefined',
  hasGlobal: typeof window.global !== 'undefined',
}); 