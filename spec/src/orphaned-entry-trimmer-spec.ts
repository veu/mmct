import * as contentful from '../../src/contentful';
import {Entry, Space} from 'contentful-management';
import {buildMockEntry} from '../mock/mock-entry-builder';
import * as entryTraverser from '../../src/entry-traverser';
import * as linkedEntryIdCollector from '../../src/linked-entry-id-collector';
import {trimOrphanedEntries} from '../../src/orphaned-entry-trimmer';
import {testAsync} from '../helper';

describe('orphanedEntryTrimmer', function () {
    const entries = [
        buildMockEntry('model').withId('entry1').get(),
        buildMockEntry('model').withId('entry2').get()
    ];
    const space = (<Space>{});

    let entryIdCollector: any;

    beforeEach(function () {
        spyOn(contentful, 'deleteEntity');
        spyOn(contentful, 'getEntries').and.returnValue(new Promise((resolve) => resolve(entries)));
        spyOn(contentful, 'isInGracePeriod').and.returnValue(false);

        spyOn(entryTraverser, 'traverseEntries');

        entryIdCollector = {
            entryIds: new Set()
        };

        spyOn(linkedEntryIdCollector, 'createLinkedEntryIdCollector').and.returnValue(entryIdCollector);
    });

    it('deletes orphaned entries', testAsync(async function () {
        const stats = await trimOrphanedEntries(space, 'model');

        expect(entryTraverser.traverseEntries).toHaveBeenCalledWith(entries, entryIdCollector);
        expect(contentful.getEntries).toHaveBeenCalledWith(space);

        for (const entry of entries) {
            expect(contentful.isInGracePeriod).toHaveBeenCalledWith(entry);
            expect(contentful.deleteEntity).toHaveBeenCalledWith(entry);
        }

        expect(stats.deletedCount).toBe(2);
    }));

    it('keeps entries of other content models', testAsync(async function () {
        const stats = await trimOrphanedEntries(space, 'different-model');

        for (const entry of entries) {
            expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entry);
        }

        expect(stats.deletedCount).toBe(0);
    }));

   it('keeps used entry', testAsync(async function () {
        entryIdCollector.entryIds.add('entry2');

        const stats = await trimOrphanedEntries(space, 'model');

        expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[1]);

        expect(stats.deletedCount).toBe(1);
    }));

    it('skips orphaned entry in grace period', testAsync(async function () {
        (<jasmine.Spy>contentful.isInGracePeriod).and.callFake((entry: Entry) => entry === entries[1]);

        const stats = await trimOrphanedEntries(space, 'model');

        expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[1]);

        expect(stats.deletedCount).toBe(1);
    }));
});
