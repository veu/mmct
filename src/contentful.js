const _ = require('lodash');
const awaiting = require('awaiting');
const EntityLink = require('./entity-link');

const minDelay = 100;

let lastApiCall = +new Date();

async function apiIsReady() {
    const now = +new Date();

    if (now - lastApiCall > minDelay) {
        lastApiCall = now;

        return;
    }

    lastApiCall += minDelay;
    await awaiting.delay(lastApiCall - now);
}

const getAgeInDays = function (entity) {
    const updatedAt = +new Date(entity.sys.updatedAt);
    const age = (+new Date() - updatedAt);

    return age / (24 * 60 * 60 * 1000);
};

async function getAssets(space, options) {
    await apiIsReady();
    const response = await space.getAssets(options);

    options.skip += options.limit;

    if (options.skip >= response.total) {
        return response.items;
    }

    const assets = await getAssets(space, options);

    return response.items.concat(assets);
}

async function getEntries(space, options) {
    await apiIsReady();
    const response = await space.getEntries(options);

    options.skip += options.limit;

    if (options.skip >= response.total) {
        return response.items;
    }

    const entries = await getEntries(space, options);

    return response.items.concat(entries);
}

module.exports = {
    config: {
        entityBatchLimit: 1000,
        isDryRun: false,
        gracePeriod: 0,
    },

    getSpace: async function (spaceId, accessToken) {
        const contentfulManagement = require('contentful-management');
        const client = contentfulManagement.createClient({accessToken});

        await apiIsReady();
        try {
            return await client.getSpace(spaceId);
        } catch (e) {
            throw new Error('Could not connect to space. Please check your credentials.');
        }
    },

    getAssets: async function (space, options = {}) {
        options = _.clone(options);
        options.skip = options.skip || 0;
        options.limit = this.config.entityBatchLimit;

        return await getAssets(space, options);
    },

    getEntries: async function (space, options = {}) {
        options = _.clone(options);
        options.skip = options.skip || 0;
        options.limit = this.config.entityBatchLimit;

        return await getEntries(space, options);
    },

    deleteEntity: async function (entity) {
        const link = new EntityLink(entity);
        const age = Math.floor(getAgeInDays(entity));

        console.log(`deleting ${age} day${age>1 ? 's' : ''} old ${entity.sys.type.toLowerCase()} ${link}`);

        if (this.config.isDryRun) {
            return;
        }

        if (entity.isPublished()) {
            await apiIsReady();
            await entity.unpublish();
        }

        await apiIsReady();
        await entity.delete();
    },

    isInGracePeriod: function (entity) {
        return getAgeInDays(entity) <= this.config.gracePeriod;
    },

    updateEntity: async function (entity) {
        const link = new EntityLink(entity);

        console.log(`updating ${entity.sys.type.toLowerCase()} ${link}`);

        await apiIsReady();
        await entity.update();
    },
};
