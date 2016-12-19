module.exports = {
    config: {
        dryRun: false,
        gracePeriod: 0,
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