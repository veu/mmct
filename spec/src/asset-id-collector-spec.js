const AssetIdCollector = require('../../src/asset-id-collector');
const MockEntryBuilder = require('../mock/mock-entry-builder');

describe('AssetIdCollector', function () {
    it('collects asset ID', function () {
        const assetIdCollector = new AssetIdCollector();

        const entry = MockEntryBuilder.create().withLink('testLink', 'Asset', '123').get();
        const link = entry.fields['testLink']['en'].sys;

        assetIdCollector.visitLink(link);

        expect([...assetIdCollector.assetIds]).toEqual(['123']);
    });
});