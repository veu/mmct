const AssetTrimmer = require('./asset-trimmer');
const contentful = require('./contentful');
const OutdatedEntryTrimmer = require('./outdated-entry-trimmer');

const reportError = (error) => {
    try {
        error = JSON.parse(error.message);
    } catch (ignore) {}
    console.error('Error: ' + error.message);
};

module.exports = {
    trimOrphanedAssets: async function (spaceId, token, gracePeriod, isDryRun) {
        contentful.config.gracePeriod = gracePeriod;
        contentful.config.isDryRun = isDryRun;

        try {
            const space = await contentful.getSpace(spaceId, token);
            const assetTrimmer = new AssetTrimmer();
            const stats = await assetTrimmer.trim(space);

            console.log(`Deleted ${stats.deletedCount} unused assets.`);
        } catch (e) {
            reportError(e);
        }
    },

    trimOutdatedEntries: async function (spaceId, token, field, gracePeriod, isDryRun) {
        contentful.config.gracePeriod = gracePeriod;
        contentful.config.isDryRun = isDryRun;

        try {
            const space = await contentful.getSpace(spaceId, token);
            const entryTrimmer = new OutdatedEntryTrimmer(field);
            const stats = await entryTrimmer.trim(space);

            console.log(`Deleted ${stats.deletedCount} entries.`);
        } catch (e) {
            reportError(e);
        }
    }
};