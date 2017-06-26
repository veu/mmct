import {getGraylogSettings, GraylogSettings} from './config';
import {forOwn} from 'lodash';

export async function logToGraylog(level: number, message: string, context?: Error|object) {
    const settings = await getGraylogSettings();

    if (settings === undefined) {
        return;
    }

    const payload = {
        'short_message': message,
        'facility': settings.facility,
        'level': level,
    };

    addContext(payload, context);

    const gelf = getGelf(settings);

    gelf.emit('gelf.log', payload);
}

function addContext(payload: any, context?: Error|object) {
    if (context === undefined) {
        return;
    }

    if (context instanceof Error) {
        payload.ctxt_exception = context.stack || context.message;

        return;
    }

    forOwn(context, (value, key) => {
        payload['ctxt_' + key] = JSON.stringify(value);
    });
}

interface GelfEmitter {
    emit: (event: 'gelf.log', message: any) => void
}

let gelf: GelfEmitter;

function getGelf(settings: GraylogSettings): GelfEmitter {
    if (gelf === undefined) {
        gelf = setUpGelf(settings);
    }

    return gelf;
}

function setUpGelf(settings: GraylogSettings): GelfEmitter {
    const Gelf = require('gelf');

    return new Gelf({
        graylogHostname: settings.host,
        graylogPort: settings.port,
        connection: 'wan',
        maxChunkSizeWan: 1420,
        maxChunkSizeLan: 8154,
    });
}
