import {Link} from 'contentful-management';
import {Visitor} from './visitor';

class AssetIdCollector implements Visitor {
    public assetIds: Set<string>;

    constructor() {
        this.assetIds = new Set();
    }

    visitLink(link: Link<any>): void {
        if (link.sys.linkType === 'Asset') {
            this.assetIds.add(link.sys.id);
        }
    }
}

export function createAssetIdCollector(): AssetIdCollector {
    return new AssetIdCollector();
}
