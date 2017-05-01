import {trimOrphanedAssets} from '../../src/orphaned-asset-trimmer';
import * as contentful from '../../src/contentful';
import {Asset, Space} from 'contentful-management';
import {buildMockAsset} from '../mock/mock-asset-builder';
import {testAsync} from '../helper';
import * as modAssetIdCollector from '../../src/asset-id-collector';
import * as entryTraverser from '../../src/entry-traverser';

describe('orphanedAssetTrimmer', function () {
    const assets = [
        buildMockAsset().withId('asset1').get(),
        buildMockAsset().withId('asset2').get()
    ];
    const entries = ['entry'];
    const space = (<Space>{});

    let assetTrimmer;
    let assetIdCollectorMock: any;
    let traverseEntries: any;

    beforeEach(function () {
        spyOn(contentful, 'deleteEntity');
        spyOn(contentful, 'getAssets').and.returnValue(assets);
        spyOn(contentful, 'getEntries').and.returnValue(new Promise((resolve) => resolve(entries)));
        spyOn(contentful, 'isInGracePeriod').and.returnValue(false);


        traverseEntries = jasmine.createSpy('traverseEntries');

        assetIdCollectorMock = {};

        spyOn(modAssetIdCollector, 'createAssetIdCollector').and.returnValue(assetIdCollectorMock);

        spyOn(entryTraverser, 'traverseEntries').and.callFake(traverseEntries);

        assetTrimmer = require('../../src/orphaned-asset-trimmer');
    });

    it('deletes orphaned assets', testAsync(async function () {
        assetIdCollectorMock.assetIds = new Set();

        const stats = await trimOrphanedAssets(space);

        expect(traverseEntries).toHaveBeenCalledWith(entries, assetIdCollectorMock);
        expect(contentful.getEntries).toHaveBeenCalledWith(space);
        expect(contentful.getAssets).toHaveBeenCalledWith(space);

        for (const asset of assets) {
            expect(contentful.isInGracePeriod).toHaveBeenCalledWith(asset);
            expect(contentful.deleteEntity).toHaveBeenCalledWith(asset);
        }

        expect(stats.deletedCount).toBe(2);
    }));

   it('keeps used asset', testAsync(async function () {
        assetIdCollectorMock.assetIds = new Set(['asset2']);

        const stats = await trimOrphanedAssets(space);

        expect(contentful.deleteEntity).toHaveBeenCalledWith(assets[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(assets[1]);

        expect(stats.deletedCount).toBe(1);
    }));

    it('skips orphaned asset in grace period', testAsync(async function () {
        assetIdCollectorMock.assetIds = new Set();
        (<jasmine.Spy>contentful.isInGracePeriod).and.callFake((asset: Asset) => asset === assets[1]);

        const stats = await trimOrphanedAssets(space);

        expect(contentful.deleteEntity).toHaveBeenCalledWith(assets[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(assets[1]);

        expect(stats.deletedCount).toBe(1);
    }));
});
