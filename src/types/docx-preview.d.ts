declare module 'docx-preview' {
  export function renderAsync(
    arrayBuffer: ArrayBuffer,
    container: HTMLElement,
    style?: Record<string, unknown>,
    options?: { className?: string; inWrapper?: boolean },
  ): Promise<void>;
}
