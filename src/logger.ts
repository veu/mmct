import {logToGraylog} from './graylog';

enum Level {
    Emergency = 1,
    Alert = 2,
    Critical = 3,
    Error = 4,
    Warning = 5,
    Notice = 6,
    Info = 7,
    Debug = 8,
}

export function emergency(message: string, context: Error|object) {
    log(Level.Emergency, message, context);
}

export function alert(message: string, context: Error|object) {
    log(Level.Alert, message, context);
}

export function critical(message: string, context: Error|object) {
    log(Level.Critical, message, context);
}

export function error(message: string, context: Error|object) {
    log(Level.Error, message, context);
}

export function warning(message: string, context: Error|object) {
    log(Level.Warning, message, context);
}

export function notice(message: string, context: Error|object) {
    log(Level.Notice, message, context);
}

export function info(message: string, context: Error|object) {
    log(Level.Info, message, context);
}

export function debug(message: string, context: Error|object) {
    log(Level.Debug, message, context);
}

function log(level: Level, message: string, context: Error|object) {
    logToConsole(level, message, context);
    logToGraylog(level, message, context);
}

function logToConsole(level: Level, message: any, context?: Error|object) {
    if (context) {
        if (level <= Level.Warning) {
            console.error(message + '\n', context);
        } else {
            console.log(message + '\n', context);
        }

        return;
    }

    if (level <= Level.Warning) {
        console.error(message);
    } else {
        console.log(message);
    }
}
