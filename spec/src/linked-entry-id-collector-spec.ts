
import {Link} from 'contentful-management';
import {createLinkedEntryIdCollector} from '../../src/linked-entry-id-collector';
import {buildMockEntry} from '../mock/mock-entry-builder';

describe('LinkedEntryIdCollector', function () {
    it('collects linked entry ID', function () {
        const linkedEntryIdCollector = createLinkedEntryIdCollector();

        const entry = buildMockEntry().withLink('testLink', 'Entry', '123').get();
        const link = <Link<'Entry'>>entry.fields['testLink']['en'];

        linkedEntryIdCollector.visitLink(link);

        expect(Array.from(linkedEntryIdCollector.entryIds)).toEqual(['123']);
    });
});
