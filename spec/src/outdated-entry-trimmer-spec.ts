import * as entryTraverser from '../../src/entry-traverser';
import {buildMockEntry} from '../mock/mock-entry-builder';
import * as contentful from '../../src/contentful';
import {Entry, Space} from 'contentful-management';
import * as linkedEntryIdCollector from '../../src/linked-entry-id-collector';
import {testAsync} from '../helper';
import {trimOutdatedEntries} from '../../src/outdated-entry-trimmer';

describe('outdatedEntryTrimmer', function () {

    const space: Space = (<Space>{});

    let entryIdCollector: {entryIds: Set<string>};
    let entries: Entry[];

    function addLinkedEntries(entryLinks: Map<string, string[]>) {
        (<jasmine.Spy>entryTraverser.traverseEntries).and.callFake((entries: Entry[]) => {
            for (const entry of entries) {
                if (entryLinks.has(entry.sys.id)) {
                    for (const link of entryLinks.get(entry.sys.id)) {
                        entryIdCollector.entryIds.add(link);
                    }
                }
            }
        });
    }

    beforeEach(function () {
        jasmine.clock().install();
        jasmine.clock().mockDate();

        entries = [];

        spyOn(contentful, 'deleteEntity');
        spyOn(contentful, 'getEntries').and.returnValue(new Promise((resolve) => resolve(entries)));
        spyOn(contentful, 'isInGracePeriod').and.returnValue(false);

        spyOn(entryTraverser, 'traverseEntries');

        entryIdCollector = {
            entryIds: new Set()
        };

        spyOn(linkedEntryIdCollector, 'createLinkedEntryIdCollector').and.returnValue(entryIdCollector);
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    it('deletes outdated entries', testAsync(async function () {
        entries.push(
            buildMockEntry().withField('endDate', new Date(+new Date() - 1).toISOString()).get(),
            buildMockEntry().withField('endDate', new Date(+new Date() - 1e4).toISOString()).get()
        );

        const stats = await trimOutdatedEntries(space, 'endDate');

        expect(entryTraverser.traverseEntries).toHaveBeenCalledWith(entries, entryIdCollector);

        for (const entry of entries) {
            expect(contentful.deleteEntity).toHaveBeenCalledWith(entry);
        }

        expect(stats.deletedCount).toBe(2);
    }));

    it('keeps current entries', testAsync(async function () {
        entries.push(
            buildMockEntry().withField('endDate', new Date(+new Date() - 1).toISOString()).get(),
            buildMockEntry().withField('endDate', new Date(+new Date() + 1e4).toISOString()).get()
        );

        const stats = await trimOutdatedEntries(space, 'endDate');

        expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[1]);

        expect(stats.deletedCount).toBe(1);
    }));

    it('keeps entries without a date', testAsync(async function () {
        entries.push(
            buildMockEntry().get()
        );

        const stats = await trimOutdatedEntries(space, 'endDate');

        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[0]);

        expect(stats.deletedCount).toBe(0);
    }));

    it('skips outdated entries in grace period', testAsync(async function () {
        entries.push(
            buildMockEntry().withField('endDate', new Date(+new Date() - 1).toISOString()).get(),
            buildMockEntry().withField('endDate', new Date(+new Date() - 1e4).toISOString()).get()
        );

        (<jasmine.Spy>contentful.isInGracePeriod).and.callFake((entry: Entry) => entry === entries[1]);

        const stats = await trimOutdatedEntries(space, 'endDate');

        expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[1]);

        expect(stats.deletedCount).toBe(1);
    }));

    it('deletes entries linked in outdated entries', testAsync(async function () {
        entries.push(
            buildMockEntry().withId('outdated').withField('endDate', new Date(+new Date() - 1).toISOString()).get(),
            buildMockEntry().withId('linked').get()
        );

        addLinkedEntries(new Map([
            ['outdated', ['linked']]
        ]));

        await trimOutdatedEntries(space, 'endDate');

        for (const entry of entries) {
            expect(contentful.deleteEntity).toHaveBeenCalledWith(entry);
        }
    }));

    it('deletes entries linked indirectly in outdated entries', testAsync(async function () {
        entries.push(
            buildMockEntry().withId('outdated').withField('endDate', new Date(+new Date() - 1).toISOString()).get(),
            buildMockEntry().withId('linked1').get(),
            buildMockEntry().withId('linked2').get()
        );

        addLinkedEntries(new Map([
            ['outdated', ['linked1']],
            ['linked1', ['linked2']]
        ]));

        await trimOutdatedEntries(space, 'endDate');

        expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[2]);
    }));

    it('keeps entries linked in current entries', testAsync(async function () {
        entries.push(
            buildMockEntry().withId('outdated').withField('endDate', new Date(+new Date() - 1).toISOString()).get(),
            buildMockEntry().withId('current').withField('endDate', new Date(+new Date() + 1e4).toISOString()).get(),
            buildMockEntry().withId('linked').get()
        );

        addLinkedEntries(new Map([
            ['outdated', ['linked']],
            ['current', ['linked']],
        ]));

        await trimOutdatedEntries(space, 'endDate');

        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[2]);
    }));

    it('keeps entries linked indirectly in current entries', testAsync(async function () {
        entries.push(
            buildMockEntry().withId('outdated').withField('endDate', new Date(+new Date() - 1).toISOString()).get(),
            buildMockEntry().withId('current').withField('endDate', new Date(+new Date() + 1e4).toISOString()).get(),
            buildMockEntry().withId('linked1').get(),
            buildMockEntry().withId('linked2').get()
        );

        addLinkedEntries(new Map([
            ['outdated', ['linked2']],
            ['current', ['linked1']],
            ['linked1', ['linked2']]
        ]));

        await trimOutdatedEntries(space, 'endDate');

        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[3]);
    }));

    it('can handle circular dependencies', testAsync(async function () {
        entries.push(
            buildMockEntry().withId('outdated').withField('endDate', new Date(+new Date() - 1).toISOString()).get(),
            buildMockEntry().withId('linked').get()
        );

        addLinkedEntries(new Map([
            ['outdated', ['linked']],
            ['linked', ['outdated']]
        ]));

        await trimOutdatedEntries(space, 'endDate');

        for (const entry of entries) {
            expect(contentful.deleteEntity).toHaveBeenCalledWith(entry);
        }
    }));

    it('deletes entries in reverse order to allow for resuming after failure', testAsync(async function () {
        entries.push(
            buildMockEntry().withId('outdated').withField('endDate', new Date(+new Date() - 1).toISOString()).get(),
            buildMockEntry().withId('linked1').get(),
            buildMockEntry().withId('linked2').get()
        );

        addLinkedEntries(new Map([
            ['outdated', ['linked1']],
            ['linked1', ['linked2']]
        ]));

        await trimOutdatedEntries(space, 'endDate');

        entries.reverse();

        const deletedEntries: Entry[] = (<jasmine.Spy>contentful.deleteEntity).calls.allArgs().map((args: any[]) => args[0]);

        expect(deletedEntries.map((entry: Entry) => entry.sys.id)).toEqual(entries.map(entry => entry.sys.id));
    }));
});
