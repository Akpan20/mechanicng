import { Request, Response, NextFunction } from 'express'

const isDev = process.env.NODE_ENV !== 'production'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err.stack)

  const status = (err as any).status || 500
  const message = isDev ? err.message : 'An unexpected error occurred'

  res.status(status).json({ error: message })
}