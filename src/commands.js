const contentful = require('./contentful');
const getStdin = require('get-stdin');
const entryWriter = require('./entry-writer');
const orphanedAssetTrimmer = require('./orphaned-asset-trimmer');
const outdatedEntryTrimmer = require('./outdated-entry-trimmer');

const reportError = (error) => {
    try {
        error = JSON.parse(error.message);
    } catch (ignore) {}
    console.error('Error: ' + error.message);
};

module.exports = {
    fillDefaultValue: async function (spaceId, token, modelId, field) {
        try {
            console.log('Reading from stdin…');
            const value = await getStdin();
            const space = await contentful.getSpace(spaceId, token);
            const stats = await entryWriter.fillDefaultValue(space, modelId, field, value);

            console.log(`Updated ${stats.updatedCount} entries.`);

        } catch (e) {
            reportError(e);
        }
    },

    trimOrphanedAssets: async function (spaceId, token, gracePeriod, isDryRun) {
        contentful.config.gracePeriod = gracePeriod;
        contentful.config.isDryRun = isDryRun;

        try {
            const space = await contentful.getSpace(spaceId, token);
            const stats = await orphanedAssetTrimmer.trim(space);

            console.log(`Deleted ${stats.deletedCount} orphaned assets.`);
        } catch (e) {
            reportError(e);
        }
    },

    trimOutdatedEntries: async function (spaceId, token, field, gracePeriod, isDryRun) {
        contentful.config.gracePeriod = gracePeriod;
        contentful.config.isDryRun = isDryRun;

        try {
            const space = await contentful.getSpace(spaceId, token);
            const stats = await outdatedEntryTrimmer.trim(space);

            console.log(`Deleted ${stats.deletedCount} outdated entries.`);
        } catch (e) {
            reportError(e);
        }
    }
};
