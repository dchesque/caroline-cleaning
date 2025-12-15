// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
    level: LogLevel
    message: string
    timestamp: string
    context?: Record<string, any>
}

class Logger {
    private isDev = process.env.NODE_ENV === 'development'

    private log(level: LogLevel, message: string, context?: Record<string, any>) {
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            context,
        }

        if (this.isDev) {
            // Console colorido em dev
            const colors = {
                debug: '\x1b[36m',
                info: '\x1b[32m',
                warn: '\x1b[33m',
                error: '\x1b[31m',
            }
            console.log(
                `${colors[level]}[${level.toUpperCase()}]\x1b[0m ${message}`,
                context || ''
            )
        } else {
            // JSON em produção (para agregadores de log)
            console.log(JSON.stringify(entry))
        }
    }

    debug(message: string, context?: Record<string, any>) {
        if (this.isDev) this.log('debug', message, context)
    }

    info(message: string, context?: Record<string, any>) {
        this.log('info', message, context)
    }

    warn(message: string, context?: Record<string, any>) {
        this.log('warn', message, context)
    }

    error(message: string, context?: Record<string, any>) {
        this.log('error', message, context)
    }
}

export const logger = new Logger()
