import {Asset, AssetData, Link} from 'contentful-management';
import {cloneDeep} from 'lodash';

const user: Link<'User'> = {
    sys: {
        type: 'Link',
        linkType: 'User',
        id: 'user123'
    }
};

const basicAsset: AssetData = {
    sys: {
        space: {
            sys: {
                type: 'Link',
                linkType: 'Space',
                id: 'space123'
            }
        },
        id: 'asset123',
        type: 'Asset',
        createdAt: '2016-10-22T07:56:05.062Z',
        updatedAt: '2016-10-22T07:56:08.757Z',
        createdBy: user,
        updatedBy: user,
        publishedCounter: 1,
        version: 3,
        publishedBy: user,
        publishedVersion: 2,
        firstPublishedAt: '2016-10-22T07:56:08.751Z',
        publishedAt: '2016-10-22T07:56:08.751Z'
    },
    fields: {
        title: {
            'en': 'Mock Asset'
        },
        file: {
            'en': {
                url: '//images.contentful.com/a/b/c/asset-name.png',
                details: {
                    size: 1234,
                    image: {
                        width: 128,
                        height: 256
                    }
                },
                fileName: 'asset-name.png',
                contentType: 'image/png'
            }
        }
    }
};

class MockAssetBuilder {
    private asset: AssetData;
    private language: string;

    constructor() {
        this.asset = cloneDeep(basicAsset);

        this.language = 'en';
    }

    withId(id: string) {
        this.asset.sys.id = id;

        return this;
    }

    withDescription(value: string) {
        if (!this.asset.fields.description) {
            this.asset.fields.description = {};
        }
        this.asset.fields.description[this.language] = value;

        return this;
    }

    get(): Asset {
        return <Asset>this.asset;
    }
}

export function buildMockAsset() {
    return new MockAssetBuilder();
}
