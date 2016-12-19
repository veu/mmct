const AssetTrimmer = require('./asset-trimmer');
const contentful = require('./contentful');
const contentfulManagement = require('contentful-management');
const OutdatedEntryTrimmer = require('./outdated-entry-trimmer');

const reportError = (error) => {
    try {
        error = JSON.parse(error.message);
    } catch (ignore) {}
    console.error('Error: ' + error.message);
    console.log(error);
};

module.exports = {
    trimOrphanedAssets: function (spaceId, token, gracePeriod, isDryRun) {
        contentful.config.gracePeriod = gracePeriod;
        contentful.config.isDryRun = isDryRun;

        contentfulManagement.createClient({accessToken: token})
            .getSpace(spaceId)
            .then(space => {
                const assetTrimmer = new AssetTrimmer();
                return assetTrimmer.trim(space);
            })
            .then(stats => {
                console.log(`Deleted ${stats.deletedCount} unused assets.`);
            })
            .catch(reportError);
    },

    trimOutdatedEntries: function (spaceId, token, field, gracePeriod, isDryRun) {
        contentful.config.gracePeriod = gracePeriod;
        contentful.config.isDryRun = isDryRun;

        contentfulManagement.createClient({accessToken: token})
            .getSpace(spaceId)
            .then(space => {
                const trimmer = new OutdatedEntryTrimmer(field);
                return trimmer.trim(space);
            })
            .then(stats => {
                console.log(`Deleted ${stats.deletedCount} entries.`);
            })
            .catch(reportError);
    }
};