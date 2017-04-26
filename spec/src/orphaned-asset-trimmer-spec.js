const mock = require('mock-require');
const contentful = require('../../src/contentful');
const MockAssetBuilder = require('../mock/mock-asset-builder');
const {testAsync} = require('../helper');

describe('orphanedAssetTrimmer', function () {
    const assets = [
        MockAssetBuilder.create().withId('asset1').get(),
        MockAssetBuilder.create().withId('asset2').get()
    ];
    const entries = ['entry'];
    const space = 'space';

    let assetTrimmer;
    let assetIdCollector;
    let entryTraverser;

    beforeEach(function () {
        spyOn(contentful, 'deleteEntity');
        spyOn(contentful, 'getAssets').and.returnValue(assets);
        spyOn(contentful, 'getEntries').and.returnValue(new Promise((resolve) => resolve(entries)));
        spyOn(contentful, 'isInGracePeriod').and.returnValue(false);

        entryTraverser = {
            traverse: jasmine.createSpy('entryTraverser.traverse')
        };

        assetIdCollector = {};

        mock('../../src/asset-id-collector', class { constructor() { return assetIdCollector; }});
        mock('../../src/entry-traverser', entryTraverser);

        assetTrimmer = require('../../src/orphaned-asset-trimmer');
    });

    afterEach(function () {
        mock.stopAll();
    });

    it('deletes orphaned assets', testAsync(async function () {
        assetIdCollector.assetIds = new Set();

        const stats = await assetTrimmer.trim(space);

        expect(entryTraverser.traverse).toHaveBeenCalledWith(entries, assetIdCollector);
        expect(contentful.getEntries).toHaveBeenCalledWith(space);
        expect(contentful.getAssets).toHaveBeenCalledWith(space);

        for (const asset of assets) {
            expect(contentful.isInGracePeriod).toHaveBeenCalledWith(asset);
            expect(contentful.deleteEntity).toHaveBeenCalledWith(asset);
        }

        expect(stats.deletedCount).toBe(2);
    }));

   it('keeps used asset', testAsync(async function () {
        assetIdCollector.assetIds = new Set(['asset2']);

        const stats = await assetTrimmer.trim(space);

        expect(contentful.deleteEntity).toHaveBeenCalledWith(assets[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(assets[1]);

        expect(stats.deletedCount).toBe(1);
    }));

    it('skips orphaned asset in grace period', testAsync(async function () {
        assetIdCollector.assetIds = new Set();
        contentful.isInGracePeriod.and.callFake(asset => asset === assets[1]);

        const stats = await assetTrimmer.trim(space);

        expect(contentful.deleteEntity).toHaveBeenCalledWith(assets[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(assets[1]);

        expect(stats.deletedCount).toBe(1);
    }));
});
