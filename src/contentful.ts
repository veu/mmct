import * as _ from 'lodash';
import {Asset, createClient, Entry, HttpQuery, Space} from 'contentful-management';
import EntityLink from './entity-link';
import {info} from './logger';

const getAgeInDays = function (entity: Asset | Entry): number {
    const updatedAt = +new Date(entity.sys.updatedAt);
    const age = (+new Date() - updatedAt);

    return age / (24 * 60 * 60 * 1000);
};

async function getAssetsBatchwise(space: Space, options: HttpQuery): Promise<Asset[]> {
    const response = await space.getAssets(options);

    options.skip += options.limit;

    if (options.skip >= response.total) {
        return response.items;
    }

    const assets = await getAssetsBatchwise(space, options);

    return response.items.concat(assets);
}

async function getEntriesBatchwise(space: Space, options: HttpQuery): Promise<Entry[]> {
    const response = await space.getEntries(options);

    options.skip += options.limit;

    if (options.skip >= response.total) {
        return response.items;
    }

    const entries = await getEntriesBatchwise(space, options);

    return response.items.concat(entries);
}

export const config = {
    entityBatchLimit: 1000,
    isDryRun: false,
    gracePeriod: 0,
};

export async function getSpace(spaceId: string, accessToken: string) {
    const client = createClient({accessToken});

    try {
        return await client.getSpace(spaceId);
    } catch (e) {
        throw new Error('Could not connect to space. Please check your credentials.');
    }
}

export async function getAssets(space: Space, options: HttpQuery = {}) {
    options = _.clone(options);
    options.skip = options.skip || 0;
    options.limit = this.config.entityBatchLimit;

    return await getAssetsBatchwise(space, options);
}

export async function getEntries(space: Space, options: HttpQuery = {}) {
    options = _.clone(options);
    options.skip = options.skip || 0;
    options.limit = this.config.entityBatchLimit;

    return await getEntriesBatchwise(space, options);
}

export async function deleteEntity(entity: Asset | Entry) {
    const link = new EntityLink(entity);
    const age = Math.floor(getAgeInDays(entity));

    info(`deleting ${age} day${age>1 ? 's' : ''} old ${entity.sys.type.toLowerCase()} ${link}`);

    if (this.config.isDryRun) {
        return;
    }

    if (entity.isPublished()) {
        await entity.unpublish();
    }

    await entity.delete();
}

export function isInGracePeriod(entity: Asset | Entry) {
    return getAgeInDays(entity) <= this.config.gracePeriod;
}

export async function updateEntity(entity: Asset | Entry) {
    const link = new EntityLink(entity);

    info(`Updating ${entity.sys.type.toLowerCase()} ${link}`);

    const updatedEntity = await entity.update();

    if (entity.isPublished() && !entity.isUpdated()) {
        await updatedEntity.publish();
    }
}

export async function getLocales(space: Space) {
    return await space.getLocales();
}

export async function getContentType(space: Space, contentTypeId: string) {
    return await space.getContentType(contentTypeId)
}
