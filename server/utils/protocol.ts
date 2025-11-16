export function generateProtocol(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let protocol = '';
  for (let i = 0; i < 10; i++) {
    protocol += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return protocol;
}
