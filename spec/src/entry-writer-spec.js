const EntryWriter = require('../../src/entry-writer');
const contentful = require('../../src/contentful');
const MockContentTypeBuilder = require('../mock/mock-content-type-builder');
const MockEntryBuilder = require('../mock/mock-entry-builder');

describe('EntryWriter', function () {
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

    describe('fillDefaultValue', function () {
        let entryWriter;

        let contentType;
        let entries;
        let fieldName;
        let modelId;
        let space;
        let value;

        beforeEach(function () {
            entryWriter = new EntryWriter();        

            modelId = 'model-id';
            fieldName = 'fieldName';
            value = 'value';

            entries = [];

            spyOn(contentful, 'getEntries').and.callFake(() => entries);
            spyOn(contentful, 'updateEntity');

            contentType = MockContentTypeBuilder.create('model-id').withField(fieldName, 'Symbol').get();
            space = {
                getContentType: () => contentType,
                getLocales: jasmine.createSpy('space.getLocales').and.callFake(() => ({
                    items: [
                        {code: 'en', default: true},
                        {code: 'fr'}
                    ]
                }))
            };
        });

        it('updates entries with the correct value', testAsync(async function () {
            entries.push(
                MockEntryBuilder.create().get(),
                MockEntryBuilder.create().get()
            );

            const stats = await entryWriter.fillDefaultValue(space, modelId, fieldName, value);

            for (const entry of entries) {
                expect(entry.fields[fieldName]).toEqual({'en': value});
                expect(contentful.updateEntity).toHaveBeenCalledWith(entry);
            }

            expect(stats.updatedCount).toBe(2);
        }));

        it('updates all languages for a localized field', testAsync(async function () {
            entries.push(
                MockEntryBuilder.create().get(),
                MockEntryBuilder.create().get()
            );

            contentType.fields.find(field => field.id === fieldName).localized = true;

            await entryWriter.fillDefaultValue(space, modelId, fieldName, value);

            for (const entry of entries) {
                expect(entry.fields[fieldName]).toEqual({'en': value, 'fr': value});
            }
        }));

        it('ignores entries already containing the field', testAsync(async function () {
            entries.push(
                MockEntryBuilder.create().withField(fieldName, 'some value').get()
            );

            const stats = await entryWriter.fillDefaultValue(space, modelId, fieldName, value);

            expect(entries[0].fields[fieldName]).toEqual({'en': 'some value'});
            expect(contentful.updateEntity).not.toHaveBeenCalled();
            expect(stats.updatedCount).toBe(0);
        }));

        it('throws proper error if content type does not exist', testAsync(async function () {
            space.getContentType = () => {
                throw {name: 'NotFound'};
            };

            try {
                await entryWriter.fillDefaultValue(space, modelId, fieldName, value);

                fail('Expected entryWriter.fillDefaultValue to throw an exception.');
            } catch (e) {
                expect(e.message).toEqual(jasmine.stringMatching(modelId));
            }
        }));

        it('throws if field is missing in content type', testAsync(async function () {
            contentType = MockContentTypeBuilder.create('model-id').get();

            try {
                await entryWriter.fillDefaultValue(space, modelId, fieldName, value);

                fail('Expected entryWriter.fillDefaultValue to throw an exception.');
            } catch (e) {
                expect(e.message).toEqual(jasmine.stringMatching(fieldName));
            }
        }));

        it('throws if field type is not text', testAsync(async function () {
            contentType = MockContentTypeBuilder.create('model-id').withField(fieldName, 'Link').get();

            try {
                await entryWriter.fillDefaultValue(space, modelId, fieldName, value);

                fail('Expected entryWriter.fillDefaultValue to throw an exception.');
            } catch (e) {
                expect(e.message).toEqual(jasmine.stringMatching(fieldName));
            }
        }));

        it('throws if editing field is disabled', testAsync(async function () {
            contentType.fields.find(field => field.id === fieldName).disabled = true;

            try {
                await entryWriter.fillDefaultValue(space, modelId, fieldName, value);

                fail('Expected entryWriter.fillDefaultValue to throw an exception.');
            } catch (e) {
                expect(e.message).toEqual(jasmine.stringMatching(fieldName));
            }
        }));
    });
});