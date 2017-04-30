const contentful = require('../../src/contentful');
const draftTrimmer = require('../../src/draft-trimmer');
const MockEntryBuilder = require('../mock/mock-entry-builder');
const {testAsync} = require('../helper');

describe('draftTrimmer', function () {

    describe('trim', function () {
        let entries;

        beforeEach(function () {
            entries = [];

            spyOn(contentful, 'getEntries').and.returnValue(new Promise(resolve => resolve(entries)));
            spyOn(contentful, 'deleteEntity').and.returnValue(new Promise(resolve => resolve()));
            spyOn(contentful, 'isInGracePeriod').and.returnValue(false);
        });

        it('deletes drafts', testAsync(async function () {
            entries.push(
                MockEntryBuilder.create('model-id').get(),
                MockEntryBuilder.create('model-id').get()
            );

            for (const entry of entries) {
                entry.isPublished = () => false;
            }

            const stats = await draftTrimmer.trim(entries);

            for (const entry of entries) {
                expect(contentful.deleteEntity).toHaveBeenCalledWith(entry);
            }

            expect(stats).toEqual({deletedCount: 2});
        }));

        it('keeps published entries', testAsync(async function () {
            entries.push(
                MockEntryBuilder.create('model-id').get(),
                MockEntryBuilder.create('model-id').get()
            );

            entries[0].isPublished = () => true;
            entries[1].isPublished = () => false;

            const stats = await draftTrimmer.trim(entries);

            expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[0]);
            expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[1]);

            expect(stats).toEqual({deletedCount: 1});
        }));

        it('keeps drafts in grace period', testAsync(async function () {
            entries.push(
                MockEntryBuilder.create('model-id').get(),
                MockEntryBuilder.create('model-id').get()
            );

            for (const entry of entries) {
                entry.isPublished = () => false;
            }

            contentful.isInGracePeriod.and.callFake(entry => entry === entries[0]);

            const stats = await draftTrimmer.trim(entries);

            expect(contentful.deleteEntity).not.toHaveBeenCalledWith(entries[0]);
            expect(contentful.deleteEntity).toHaveBeenCalledWith(entries[1]);

            expect(stats).toEqual({deletedCount: 1});
        }));
    });
});



