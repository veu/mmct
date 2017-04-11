const LinkedEntryIdCollector = require('../../src/linked-entry-id-collector');
const MockEntryBuilder = require('../mock/mock-entry-builder');

describe('LinkedEntryIdCollector', function () {
    it('collects linked entry ID', function () {
        const linkedEntryIdCollector = new LinkedEntryIdCollector();

        const entry = MockEntryBuilder.create().withLink('testLink', 'Entry', '123').get();
        const link = entry.fields['testLink']['en-US'].sys;

        linkedEntryIdCollector.visitLink(link);

        expect([...linkedEntryIdCollector.entryIds]).toEqual(['123']);
    });
});