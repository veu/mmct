import {createAssetIdCollector} from '../../src/asset-id-collector';
import {Link} from 'contentful-management';
import {buildMockEntry} from '../mock/mock-entry-builder';

describe('AssetIdCollector', function () {
    it('collects asset ID', function () {
        const assetIdCollector = createAssetIdCollector();

        const entry = buildMockEntry().withLink('testLink', 'Asset', '123').get();
        const link = (<Link<any>>entry.fields['testLink']['en'])    ;

        assetIdCollector.visitLink(link);

        expect(Array.from(assetIdCollector.assetIds)).toEqual(['123']);
    });
});
