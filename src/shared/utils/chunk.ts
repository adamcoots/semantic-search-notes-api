export function chunk(text: string): string[] {
  return text
    .trim()
    .split('.')
    .filter((i) => i !== '');
}
