const mock = require('mock-require');
const contentful = require('../../src/contentful');
const MockEntryBuilder = require('../mock/mock-entry-builder');
const entryTraverser = require('../../src/entry-traverser');

describe('orphanedEntryTrimmer', function () {
    function testAsync(runAsync) {
        return function (done) {
            runAsync().then(
                done,
                function (e) {
                    fail(e);
                    done();
                }
            );
        };
    }

    const entries = [
        MockEntryBuilder.create('model').withId('entry1').get(),
        MockEntryBuilder.create('model').withId('entry2').get()
    ];
    const space = 'space';

    let entryTrimmer;
    let entryIdCollector;

    beforeEach(function () {
        spyOn(contentful, 'deleteEntity');
        spyOn(contentful, 'getEntries').and.returnValue(new Promise((resolve) => resolve(entries)));
        spyOn(contentful, 'isInGracePeriod').and.returnValue(false);

        spyOn(entryTraverser, 'traverse');

        entryIdCollector = {
            entryIds: new Set()
        };

        mock('../../src/linked-entry-id-collector', class { constructor() { return entryIdCollector; }});

        entryTrimmer = require('../../src/orphaned-entry-trimmer');
    });

    afterEach(function () {
        mock.stopAll();
    });

    it('deletes orphaned entries', testAsync(async function () {
        const stats = await entryTrimmer.trim(space, 'model');

        expect(entryTraverser.traverse).toHaveBeenCalledWith(entries, entryIdCollector);
        expect(contentful.getEntries).toHaveBeenCalledWith(space);

        for (const entry of entries) {
            expect(contentful.isInGracePeriod).toHaveBeenCalledWith(entry);
            expect(contentful.deleteEntity).toHaveBeenCalledWith(entry);
        }

        expect(stats.deletedCount).toBe(2);
    }));

    it('keeps entries of other content models', testAsync(async function () {
        const stats = await entryTrimmer.trim(space, 'different-model');

        for (const entry of entries) {
            expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entry);
        }

        expect(stats.deletedCount).toBe(0);
    }));

   it('keeps used entry', testAsync(async function () {
        entryIdCollector.entryIds.add('entry2');

        const stats = await entryTrimmer.trim(space, 'model');

        expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[1]);

        expect(stats.deletedCount).toBe(1);
    }));

    it('skips orphaned entry in grace period', testAsync(async function () {
        contentful.isInGracePeriod.and.callFake(entry => entry === entries[1]);

        const stats = await entryTrimmer.trim(space, 'model');

        expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[1]);

        expect(stats.deletedCount).toBe(1);
    }));
});
