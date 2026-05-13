export class ParseError extends Error {
  readonly position: number;
  readonly source: string;

  constructor(message: string, position: number, source: string) {
    super(message);
    this.name = 'ParseError';
    this.position = position;
    this.source = source;
  }
}
