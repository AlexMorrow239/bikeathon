type Fields = Record<string, unknown>;

function emit(
  stream: 'log' | 'warn' | 'error',
  level: string,
  scope: string | undefined,
  msg: string,
  fields?: Fields
) {
  const tag = scope ? `[${scope}] [${level}]` : `[${level}]`;
  const payload = fields && Object.keys(fields).length > 0 ? ` ${JSON.stringify(fields)}` : '';
  console[stream](`${tag} ${msg}${payload}`);
}

export interface Logger {
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
}

export function createLogger(scope?: string): Logger {
  return {
    info: (msg, fields) => emit('log', 'INFO', scope, msg, fields),
    warn: (msg, fields) => emit('warn', 'WARN', scope, msg, fields),
    error: (msg, fields) => emit('error', 'ERROR', scope, msg, fields),
  };
}

export const logger = createLogger();
