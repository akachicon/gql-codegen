export function formatMessageFactory(packageName: string) {
  return (message: string) => `[${packageName}]: ${message}`;
}
