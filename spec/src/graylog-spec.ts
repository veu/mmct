import * as config from '../../src/config';
import {GraylogSettings} from '../../src/config';
import {logToGraylog} from '../../src/graylog';
import SpyObj = jasmine.SpyObj;
import {basename} from 'path';
const Gelf = require('gelf');

describe('graylog', function () {
    let graylogSettings: GraylogSettings;

    describe('logToGraylog', function () {
        beforeEach(function () {
            spyOn(config, 'getGraylogSettings');
            spyOn(Gelf.prototype, 'emit');

            graylogSettings = {
                host: 'host',
                port: 12345,
                facility: 'facility',
            };
        });

        it('does nothing if graylog is disabled', async function () {
            await logToGraylog(1, 'message');

            expect(Gelf.prototype.emit).not.toHaveBeenCalled();
        });

        it('passes level and message', async function () {
            (config.getGraylogSettings as jasmine.Spy).and.returnValue(graylogSettings);

            await logToGraylog(1, 'message');

            expect(Gelf.prototype.emit).toHaveBeenCalledWith('gelf.log', jasmine.objectContaining({
                level: 1,
                short_message: 'message',
            }));
        });

        it('passes facility', async function () {
            (config.getGraylogSettings as jasmine.Spy).and.returnValue(graylogSettings);

            await logToGraylog(1, 'message');

            expect(Gelf.prototype.emit).toHaveBeenCalledWith('gelf.log', jasmine.objectContaining({
                facility: 'facility',
            }));
        });

        it('adds trace from Error context', async function () {
            (config.getGraylogSettings as jasmine.Spy).and.returnValue(graylogSettings);

            const context = new Error();

            await logToGraylog(1, 'message', context);

            expect(Gelf.prototype.emit).toHaveBeenCalledWith('gelf.log', jasmine.objectContaining({
                ctxt_exception: jasmine.stringMatching(basename(__filename)),
            }));
        });

        it('adds attributes of generic context', async function () {
            (config.getGraylogSettings as jasmine.Spy).and.returnValue(graylogSettings);

            const context = {
                key_a: 'value-a',
                key_b: 'value-b',
            };

            await logToGraylog(1, 'message', context);

            expect(Gelf.prototype.emit).toHaveBeenCalledWith('gelf.log', jasmine.objectContaining({
                ctxt_key_a: 'value-a',
                ctxt_key_b: 'value-b',
            }));
        });

        it('stringifies object attributes of generic context', async function () {
            (config.getGraylogSettings as jasmine.Spy).and.returnValue(graylogSettings);

            const context = {
                key: {
                    nested_key: 'nested-value',
                },
            };

            await logToGraylog(1, 'message', context);

            expect(Gelf.prototype.emit).toHaveBeenCalledWith('gelf.log', jasmine.objectContaining({
                ctxt_key: JSON.stringify({
                    nested_key: 'nested-value',
                }),
            }));
        });
    });
});
