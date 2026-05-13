export interface Delimiter {
  left: string;
  right: string;
  display: boolean;
}

export interface TrustContext {
  command: string;
  url: string;
  protocol: string;
}

export interface KernOptions {
  displayMode?: boolean;
  throwOnError?: boolean;
  errorColor?: string;
  macros?: Record<string, string>;
  output?: 'mathml' | 'html' | 'htmlAndMathml';
  trust?: boolean | ((context: TrustContext) => boolean);
  strict?: boolean | 'ignore' | 'warn' | 'error';
  delimiters?: Delimiter[];
}

export interface ResolvedOptions {
  displayMode: boolean;
  throwOnError: boolean;
  errorColor: string;
  macros: Record<string, string>;
  output: 'mathml' | 'html' | 'htmlAndMathml';
  trust: boolean | ((context: TrustContext) => boolean);
  strict: boolean | 'ignore' | 'warn' | 'error';
  delimiters: Delimiter[];
}

export function resolveOptions(opts?: KernOptions): ResolvedOptions {
  return {
    displayMode: opts?.displayMode ?? false,
    throwOnError: opts?.throwOnError ?? true,
    errorColor: opts?.errorColor ?? '#cc0000',
    macros: opts?.macros ?? {},
    output: opts?.output ?? 'mathml',
    trust: opts?.trust ?? false,
    strict: opts?.strict ?? 'warn',
    delimiters: opts?.delimiters ?? [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
  };
}
