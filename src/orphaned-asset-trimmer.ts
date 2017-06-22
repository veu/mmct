import {createAssetIdCollector} from './asset-id-collector';
import * as contentful from './contentful';
import {Asset, Entry, Space} from 'contentful-management';
import * as entryTraverser from './entry-traverser';

export async function trimOrphanedAssets(space: Space) {
    const usedAssetIds = collectAssetIds(await contentful.getEntries(space));
    const assets = await contentful.getAssets(space);
    const unusedAssets = assets.filter(asset => !isInUse(asset, usedAssetIds));
    await deleteAssets(unusedAssets);

    return {
        deletedCount: unusedAssets.length
    };
}

function collectAssetIds(entries: Entry[]) {
    const assetIdCollector = createAssetIdCollector();

    entryTraverser.traverseEntries(entries, assetIdCollector);

    return assetIdCollector.assetIds;
}

function isInUse(asset: Asset, usedAssetIds: Set<string>) {
    if (usedAssetIds.has(asset.sys.id)) {
        return true;
    }

    if (contentful.isInGracePeriod(asset)) {
        return true;
    }

    return false;
}

async function deleteAssets(assets: Asset[]) {
    for (const asset of assets) {
        await contentful.deleteEntity(asset);
    }
}
