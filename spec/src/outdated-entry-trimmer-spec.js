const mock = require('mock-require');
const MockEntryBuilder = require('../mock/mock-entry-builder');
const Promise = require('sync-p');

describe('OutdatedEntryTrimmer', function () {
    const space = 'space';

    let outdatedEntryTrimmer;
    let linkedEntryIdCollector;
    let contentful = {};
    let entryTraverser;
    let entries;

    function defineLinkedEntries(entryLinks) {
        entryTraverser.traverse = jasmine.createSpy('entryTraverser.traverse').and.callFake(entries => {
            const entryIds = [];
            for (const entry of entries) {
                if (entryLinks.has(entry.sys.id)) {
                    entryIds.push(...entryLinks.get(entry.sys.id));
                }
            }
            linkedEntryIdCollector.entryIds = new Set(entryIds);
        });
    }

    beforeEach(function () {
        entries = [];

        contentful.deleteEntity = jasmine.createSpy('contentful.deleteEntity');
        contentful.getEntries = jasmine.createSpy('contentful.getEntries').and.returnValue(new Promise((resolve) => resolve(entries)));
        contentful.isInGracePeriod = jasmine.createSpy('contentful.isInGracePeriod').and.returnValue(false);

        entryTraverser = {
            traverse: jasmine.createSpy('entryTraverser.traverse')
        };

        linkedEntryIdCollector = {};

        mock('../../src/contentful', contentful);
        mock('../../src/linked-entry-id-collector', class { constructor() { return linkedEntryIdCollector; }});
        mock('../../src/entry-traverser', class { constructor() { return entryTraverser; }});

        const OutdatedEntryTrimmer = require('../../src/outdated-entry-trimmer');
        outdatedEntryTrimmer = new OutdatedEntryTrimmer('endDate');
    });

    afterEach(function () {
        mock.stopAll();
    });

    it('deletes outdated entries', function () {
        entries.push(
            MockEntryBuilder.create().withField('endDate', new Date(new Date() - 1)).get(),
            MockEntryBuilder.create().withField('endDate', new Date(new Date() - 1e4)).get()
        );

        linkedEntryIdCollector.entryIds = new Set();

        outdatedEntryTrimmer.trim(space);

        expect(entryTraverser.traverse).toHaveBeenCalledWith(entries, linkedEntryIdCollector);

        for (const entry of entries) {
            expect(contentful.deleteEntity).toHaveBeenCalledWith(entry);
        }

        expect(outdatedEntryTrimmer.stats.deletedCount).toBe(2);
    });

    it('keeps current entries', function () {
        entries.push(
            MockEntryBuilder.create().withField('endDate', new Date(new Date() - 1)).get(),
            MockEntryBuilder.create().withField('endDate', new Date(+new Date() + 1e4)).get()
        );

        linkedEntryIdCollector.entryIds = new Set();

        outdatedEntryTrimmer.trim(space);

        expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[1]);

        expect(outdatedEntryTrimmer.stats.deletedCount).toBe(1);
    });

    it('keeps entries without a date', function () {
        entries.push(
            MockEntryBuilder.create()
        );

        linkedEntryIdCollector.entryIds = new Set();

        outdatedEntryTrimmer.trim(space);

        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[0]);

        expect(outdatedEntryTrimmer.stats.deletedCount).toBe(0);
    });

    it('skips outdated entries in grace period', function () {
        entries.push(
            MockEntryBuilder.create().withField('endDate', new Date(new Date() - 1)).get(),
            MockEntryBuilder.create().withField('endDate', new Date(new Date() - 1e4)).get()
        );

        contentful.isInGracePeriod = jasmine.createSpy('contentful.isInGracePeriod').and.callFake(entry => entry === entries[1]);

        linkedEntryIdCollector.entryIds = new Set();

        outdatedEntryTrimmer.trim(space);

        expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[1]);

        expect(outdatedEntryTrimmer.stats.deletedCount).toBe(1);
    });

    it('deletes entries linked in outdated entries', function () {
        entries.push(
            MockEntryBuilder.create().withId('outdated').withField('endDate', new Date(new Date() - 1)).get(),
            MockEntryBuilder.create().withId('linked').get()
        );

        defineLinkedEntries(new Map([
            ['outdated', ['linked']]
        ]));

        outdatedEntryTrimmer.trim(space);

        for (const entry of entries) {
            expect(contentful.deleteEntity).toHaveBeenCalledWith(entry);
        }
    });

    it('deletes entries linked indirectly in outdated entries', function () {
        entries.push(
            MockEntryBuilder.create().withId('outdated').withField('endDate', new Date(new Date() - 1)).get(),
            MockEntryBuilder.create().withId('linked1').get(),
            MockEntryBuilder.create().withId('linked2').get()
        );

        defineLinkedEntries(new Map([
            ['outdated', ['linked1']],
            ['linked1', ['linked2']]
        ]));

        outdatedEntryTrimmer.trim(space);

        expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[2]);
    });

    it('keeps entries linked in current entries', function () {
        entries.push(
            MockEntryBuilder.create().withId('outdated').withField('endDate', new Date(new Date() - 1)).get(),
            MockEntryBuilder.create().withId('current').withField('endDate', new Date(+new Date() + 1e4)).get(),
            MockEntryBuilder.create().withId('linked').get()
        );

        defineLinkedEntries(new Map([
            ['outdated', ['linked']],
            ['current', ['linked']],
        ]));

        outdatedEntryTrimmer.trim(space);

        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[2]);
    });

    it('keeps entries linked indirectly in current entries', function () {
        entries.push(
            MockEntryBuilder.create().withId('outdated').withField('endDate', new Date(new Date() - 1)).get(),
            MockEntryBuilder.create().withId('current').withField('endDate', new Date(+new Date() + 1e4)).get(),
            MockEntryBuilder.create().withId('linked1').get(),
            MockEntryBuilder.create().withId('linked2').get()
        );

        defineLinkedEntries(new Map([
            ['outdated', ['linked2']],
            ['current', ['linked1']],
            ['linked1', ['linked2']]
        ]));

        outdatedEntryTrimmer.trim(space);

        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[3]);
    });
});
