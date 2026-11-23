type Messages = { [key: string]: string | Messages };

// Every key path in a messages object, for example `home.title`, sorted.
export function messageKeys(messages: Messages, prefix = ''): string[] {
  return Object.entries(messages)
    .flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === 'string' ? [path] : messageKeys(value, path);
    })
    .sort();
}
