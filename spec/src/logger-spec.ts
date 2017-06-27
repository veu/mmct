import * as graylog from '../../src/graylog';
import * as logger from '../../src/logger';

describe('logger', function () {
    const context = {
        key: 'value',
    };

    beforeEach(function () {
        spyOn(console, 'log');
        spyOn(console, 'error');
        spyOn(graylog, 'logToGraylog');
    });

    describe('emergency', function () {
        it('logs to console and graylog', function () {
            logger.emergency('test');

            expect(console.error).toHaveBeenCalledWith('test');
            expect(graylog.logToGraylog).toHaveBeenCalledWith(1, 'test', undefined);
        });

        it('passes context', function () {
            logger.emergency('test', context);

            expect(console.error).toHaveBeenCalledWith('test\n', context);
            expect(graylog.logToGraylog).toHaveBeenCalledWith(1, 'test', context);
        });
    });

    describe('alert', function () {
        it('logs to console and graylog', function () {
            logger.alert('test');

            expect(console.error).toHaveBeenCalledWith('test');
            expect(graylog.logToGraylog).toHaveBeenCalledWith(2, 'test', undefined);
        });

        it('passes context', function () {
            logger.alert('test', context);

            expect(console.error).toHaveBeenCalledWith('test\n', context);
            expect(graylog.logToGraylog).toHaveBeenCalledWith(2, 'test', context);
        });
    });

    describe('critical', function () {
        it('logs to console and graylog', function () {
            logger.critical('test');

            expect(console.error).toHaveBeenCalledWith('test');
            expect(graylog.logToGraylog).toHaveBeenCalledWith(3, 'test', undefined);
        });

        it('passes context', function () {
            logger.critical('test', context);

            expect(console.error).toHaveBeenCalledWith('test\n', context);
            expect(graylog.logToGraylog).toHaveBeenCalledWith(3, 'test', context);
        });
    });

    describe('error', function () {
        it('logs to console and graylog', function () {
            logger.error('test');

            expect(console.error).toHaveBeenCalledWith('test');
            expect(graylog.logToGraylog).toHaveBeenCalledWith(4, 'test', undefined);
        });

        it('passes context', function () {
            logger.error('test', context);

            expect(console.error).toHaveBeenCalledWith('test\n', context);
            expect(graylog.logToGraylog).toHaveBeenCalledWith(4, 'test', context);
        });
    });

    describe('warning', function () {
        it('logs to console and graylog', function () {
            logger.warning('test');

            expect(console.error).toHaveBeenCalledWith('test');
            expect(graylog.logToGraylog).toHaveBeenCalledWith(5, 'test', undefined);
        });

        it('passes context', function () {
            logger.warning('test', context);

            expect(console.error).toHaveBeenCalledWith('test\n', context);
            expect(graylog.logToGraylog).toHaveBeenCalledWith(5, 'test', context);
        });
    });

    describe('notice', function () {
        it('logs to console and graylog', function () {
            logger.notice('test');

            expect(console.log).toHaveBeenCalledWith('test');
            expect(graylog.logToGraylog).toHaveBeenCalledWith(6, 'test', undefined);
        });

        it('passes context', function () {
            logger.notice('test', context);

            expect(console.log).toHaveBeenCalledWith('test\n', context);
            expect(graylog.logToGraylog).toHaveBeenCalledWith(6, 'test', context);
        });
    });

    describe('info', function () {
        it('logs to console and graylog', function () {
            logger.info('test');

            expect(console.log).toHaveBeenCalledWith('test');
            expect(graylog.logToGraylog).toHaveBeenCalledWith(7, 'test', undefined);
        });

        it('passes context', function () {
            logger.info('test', context);

            expect(console.log).toHaveBeenCalledWith('test\n', context);
            expect(graylog.logToGraylog).toHaveBeenCalledWith(7, 'test', context);
        });
    });

    describe('debug', function () {
        it('logs to console and graylog', function () {
            logger.debug('test');

            expect(console.log).toHaveBeenCalledWith('test');
            expect(graylog.logToGraylog).toHaveBeenCalledWith(8, 'test', undefined);
        });

        it('passes context', function () {
            logger.debug('test', context);

            expect(console.log).toHaveBeenCalledWith('test\n', context);
            expect(graylog.logToGraylog).toHaveBeenCalledWith(8, 'test', context);
        });
    });
});
