const EntityLink = require('./entity-link');
const Promise = require('sync-p');

const minDelay = 100;

let lastDeletion = +new Date();

const delay = function (time) {
    return new Promise(resolve => setTimeout(() => resolve(true), time));
};

const deleteEntity = async function (entity) {
    const now = +new Date();

    if (now - lastDeletion > minDelay) {
        lastDeletion = now;
        await entity.delete();

        return;
    }

    lastDeletion += minDelay;
    await delay(lastDeletion - now);
    await entity.delete();
};

const getAgeInDays = function (entity) {
    const updatedAt = +new Date(entity.sys.updatedAt);
    const age = (+new Date() - updatedAt);

    return age / (24 * 60 * 60 * 1000);
};

module.exports = {
    config: {
        isDryRun: false,
        gracePeriod: 0,
    },

    getSpace: async function (spaceId, accessToken) {
        const contentfulManagement = require('contentful-management');
        const client = contentfulManagement.createClient({accessToken});

        try {
            return await client.getSpace(spaceId);
        } catch (e) {
            throw new Error('Could not connect to space. Please check your credentials.');
        }
    },

    getAssets: async function (space, skip = 0, limit = 1000) {
        const response = await space.getAssets({skip, limit});

        if (skip + limit >= response.total) {
            return response.items;
        }

        const assets = await this.getAssets(space, skip + limit, limit);

        return response.items.concat(assets);
    },

    getEntries: async function (space, skip = 0, limit = 1000) {
        const response = await space.getEntries({skip, limit});

        if (skip + limit >= response.total) {
            return response.items;
        }

        const entries = await this.getEntries(space, skip + limit, limit);

        return response.items.concat(entries);
    },

    deleteEntity: async function (entity) {
        const link = new EntityLink(entity);
        const age = Math.floor(getAgeInDays(entity));

        console.log(`deleting ${age} day${age>1 ? 's' : ''} old ${entity.sys.type.toLowerCase()} ${link}`);

        if (this.config.isDryRun) {
            return;
        }

        if (entity.isPublished()) {
            await entity.unpublish();
        }

        await deleteEntity(entity);
    },

    isInGracePeriod: function (entity) {
        return getAgeInDays(entity) <= this.config.gracePeriod;
    }
};