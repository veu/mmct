const mock = require('mock-require');
const MockAssetBuilder = require('../mock/mock-asset-builder');
const Promise = require('sync-p');

describe('AssetTrimmer', function () {
    const assets = [
        MockAssetBuilder.create().withId('asset1').get(),
        MockAssetBuilder.create().withId('asset2').get()
    ];
    const entries = ['entry'];
    const space = 'space';

    let assetTrimmer;
    let assetIdCollector;
    let contentful = {};
    let entryTraverser;

    beforeEach(function () {
        contentful.deleteEntity = jasmine.createSpy('contentful.deleteEntity');
        contentful.getAssets = jasmine.createSpy('contentful.getAssets').and.returnValue(assets);
        contentful.getEntries = jasmine.createSpy('contentful.getEntries').and.returnValue(new Promise((resolve) => resolve(entries)));
        contentful.isInGracePeriod = jasmine.createSpy('contentful.isInGracePeriod').and.returnValue(false);

        entryTraverser = {
            traverse: jasmine.createSpy('entryTraverser.traverse')
        };

        assetIdCollector = {};

        mock('../../src/contentful', contentful);
        mock('../../src/asset-id-collector', class { constructor() { return assetIdCollector; }});
        mock('../../src/entry-traverser', class { constructor() { return entryTraverser; }});

        const AssetTrimmer = require('../../src/asset-trimmer');
        assetTrimmer = new AssetTrimmer();
    });

    afterEach(function () {
        mock.stopAll();
    });

    it('deletes orphaned assets', function () {
        assetIdCollector.assetIds = new Set();

        assetTrimmer.trim(space);

        expect(entryTraverser.traverse).toHaveBeenCalledWith(entries, assetIdCollector);
        expect(contentful.getEntries).toHaveBeenCalledWith(space);
        expect(contentful.getAssets).toHaveBeenCalledWith(space);

        for (const asset of assets) {
            expect(contentful.isInGracePeriod).toHaveBeenCalledWith(asset);
            expect(contentful.deleteEntity).toHaveBeenCalledWith(asset);
        }

        expect(assetTrimmer.stats.deletedCount).toBe(2);
    });

   it('keeps used asset', function () {
        assetIdCollector.assetIds = new Set(['asset2']);

        assetTrimmer.trim(space);

        expect(contentful.deleteEntity).toHaveBeenCalledWith(assets[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(assets[1]);

        expect(assetTrimmer.stats.deletedCount).toBe(1);
    });

    it('skips orphaned asset in grace period', function () {
        assetIdCollector.assetIds = new Set();
        contentful.isInGracePeriod = jasmine.createSpy('contentful.isInGracePeriod').and.callFake(asset => asset === assets[1]);

        assetTrimmer.trim(space);
        
        expect(contentful.deleteEntity).toHaveBeenCalledWith(assets[0]);
        expect(contentful.deleteEntity).not.toHaveBeenCalledWith(assets[1]);

        expect(assetTrimmer.stats.deletedCount).toBe(1);
    });
});