import 'express';

declare module 'express' {
  interface Request {
    query: Record<string, string>;
  }
}
