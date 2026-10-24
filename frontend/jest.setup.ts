import { webcrypto } from 'node:crypto';
import { TextDecoder, TextEncoder } from 'node:util';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder });
Object.defineProperty(globalThis, 'TextDecoder', { value: TextDecoder });
// SDK 17 validates byte arrays by realm; Node's TextEncoder must share this
// constructor with jsdom's globals rather than producing foreign byte arrays.
Object.defineProperty(globalThis, 'Uint8Array', { value: new TextEncoder().encode('').constructor });
