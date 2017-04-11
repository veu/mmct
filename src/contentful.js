const EntityLink = require('./entity-link');
const Promise = require('sync-p');

const minDelay = 100;

let lastDeletion = +new Date();

const delay = function (time) {
    return new Promise(resolve => setTimeout(() => resolve(true), time));
};

const deleteEntity = function (entity) {
    const now = +new Date();

    if (now - lastDeletion > minDelay) {
        lastDeletion = now;
        return entity.delete();
    }

    lastDeletion += minDelay;
    return delay(lastDeletion - now).then(() => entity.delete());
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

    getAssets: function (space, assets = [], skip = 0, limit = 1000) {
        return space.getAssets({skip, limit}).then(response => {
            assets = assets.concat(response.items);
            if (response.total > skip + limit) {
                return this.getAssets(space, assets, skip + limit, limit);
            }
            return assets;
        });
    },

    getEntries: function (space, entries = [], skip = 0, limit = 1000) {
        return space.getEntries({skip, limit}).then(response => {
            entries = entries.concat(response.items);
            if (response.total > skip + limit) {
                return this.getEntries(space, entries, skip + limit, limit);
            }
            return entries;
        });
    },

    deleteEntity: function (entity) {
        const link = new EntityLink(entity);
        const age = Math.floor(getAgeInDays(entity));

        console.log(`deleting ${age} day${age>1 ? 's' : ''} old ${entity.sys.type.toLowerCase()} ${link}`);

        if (this.config.isDryRun) {
            return;
        }

        if (entity.isPublished()) {
            return entity.unpublish().then(() => deleteEntity(entity));
        }

        return deleteEntity(entity);
    },

    isInGracePeriod: function (entity) {
        return getAgeInDays(entity) <= this.config.gracePeriod;
    }
};