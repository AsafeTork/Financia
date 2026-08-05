// Node 24 web stream polyfills — must load before MSW
import { TransformStream, ReadableStream, WritableStream } from 'stream/web';

if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = TransformStream;
}
if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = ReadableStream;
}
if (typeof globalThis.WritableStream === 'undefined') {
  globalThis.WritableStream = WritableStream;
}
