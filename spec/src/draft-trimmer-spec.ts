import * as contentful from '../../src/contentful';
import {Entry, Space} from 'contentful-management';
import {trimDrafts} from '../../src/draft-trimmer';
import {buildMockEntry} from '../mock/mock-entry-builder';
import {testAsync} from '../helper';

describe('draftTrimmer', function () {

    describe('trim', function () {
        let entries: Entry[];
        const space = (<Space>{});

        beforeEach(function () {
            entries = [];

            spyOn(contentful, 'getEntries').and.returnValue(new Promise(resolve => resolve(entries)));
            spyOn(contentful, 'deleteEntity').and.returnValue(new Promise(resolve => resolve()));
            spyOn(contentful, 'isInGracePeriod').and.returnValue(false);
        });

        it('deletes drafts', testAsync(async function () {
            entries.push(
                buildMockEntry('model-id').get(),
                buildMockEntry('model-id').get()
            );

            for (const entry of entries) {
                entry.isPublished = () => false;
            }

            const stats = await trimDrafts(space);

            for (const entry of entries) {
                expect(contentful.deleteEntity).toHaveBeenCalledWith(entry);
            }

            expect(stats).toEqual({deletedCount: 2});
        }));

        it('keeps published entries', testAsync(async function () {
            entries.push(
                buildMockEntry('model-id').get(),
                buildMockEntry('model-id').get()
            );

            entries[0].isPublished = () => true;
            entries[1].isPublished = () => false;

            const stats = await trimDrafts(space);

            expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[0]);
            expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[1]);

            expect(stats).toEqual({deletedCount: 1});
        }));

        it('keeps drafts in grace period', testAsync(async function () {
            entries.push(
                buildMockEntry('model-id').get(),
                buildMockEntry('model-id').get()
            );

            for (const entry of entries) {
                entry.isPublished = () => false;
            }

            (<jasmine.Spy>contentful.isInGracePeriod).and.callFake((entry: Entry) => entry === entries[0]);

            const stats = await trimDrafts(space);

            expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[0]);
            expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[1]);

            expect(stats).toEqual({deletedCount: 1});
        }));
    });
});



