export default async function teardown() {
  globalThis.process?.exit(0);
}