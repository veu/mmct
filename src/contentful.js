module.exports = {
    config: {
        dryRun: false,
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
        if (this.config.isDryRun) {
            return;
        }

        if (entity.isPublished()) {
            return entity.unpublish().then(() => entity.delete());
        }

        return entity.delete();
    },

    getAgeInDays: function (entity) {
        const updatedAt = new Date(entity.sys.updatedAt);
        const age = (new Date() - updatedAt);

        return age / (24 * 60 * 60 * 1000);
    },

    isInGracePeriod: function (entity) {
        return this.getAgeInDays(entity) <= this.config.gracePeriod;
    }
};