// Centralized logging utility for the Smart Search Component

// Log levels enumeration
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

// Log entry interface
export interface LogEntry {
    readonly timestamp: string;
    readonly level: LogLevel;
    readonly message: string;
    readonly context?: string;
    readonly error?: Error;
    readonly data?: unknown;
}

// Logger singleton class
class Logger {
    private static instance: Logger;
    private logLevel: LogLevel = LogLevel.INFO;
    private enableConsoleOutput: boolean = true;
    private logHistory: LogEntry[] = [];
    private readonly maxHistorySize: number = 100;

    private constructor() {}

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    public setConsoleOutput(enabled: boolean): void {
        this.enableConsoleOutput = enabled;
    }

    public debug(message: string, context?: string, data?: unknown): void {
        this.log(LogLevel.DEBUG, message, context, undefined, data);
    }

    public info(message: string, context?: string, data?: unknown): void {
        this.log(LogLevel.INFO, message, context, undefined, data);
    }

    public warn(message: string, context?: string, data?: unknown): void {
        this.log(LogLevel.WARN, message, context, undefined, data);
    }

    public error(message: string, context?: string, error?: Error, data?: unknown): void {
        this.log(LogLevel.ERROR, message, context, error, data);
    }

    private log(level: LogLevel, message: string, context?: string, error?: Error, data?: unknown): void {
        if (level < this.logLevel) {
            return;
        }

        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            error,
            data
        };

        this.addToHistory(logEntry);

        if (this.enableConsoleOutput) {
            this.outputToConsole(logEntry);
        }
    }

    private addToHistory(entry: LogEntry): void {
        this.logHistory.push(entry);
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory.shift();
        }
    }

    private outputToConsole(entry: LogEntry): void {
        const prefix = `[${entry.timestamp}] ${LogLevel[entry.level]}`;
        const contextStr = entry.context ? ` [${entry.context}]` : '';
        const fullMessage = `${prefix}${contextStr}: ${entry.message}`;

        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(fullMessage, entry.data);
                break;
            case LogLevel.INFO:
                console.info(fullMessage, entry.data);
                break;
            case LogLevel.WARN:
                console.warn(fullMessage, entry.data);
                break;
            case LogLevel.ERROR:
                console.error(fullMessage, entry.error, entry.data);
                break;
        }
    }

    public getHistory(): readonly LogEntry[] {
        return [...this.logHistory];
    }

    public clearHistory(): void {
        this.logHistory = [];
    }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions
export const logDebug = (message: string, context?: string, data?: unknown) => 
    logger.debug(message, context, data);

export const logInfo = (message: string, context?: string, data?: unknown) => 
    logger.info(message, context, data);

export const logWarn = (message: string, context?: string, data?: unknown) => 
    logger.warn(message, context, data);

export const logError = (message: string, context?: string, error?: Error, data?: unknown) => 
    logger.error(message, context, error, data);
