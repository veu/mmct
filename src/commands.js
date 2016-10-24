const AssetTrimmer = require('./asset-trimmer');
const contentful = require('contentful-management');

module.exports = {
    assets: function (spaceId, token, gracePeriod, isDryRun) {
        contentful.createClient({accessToken: token})
            .getSpace(spaceId)
            .then(space => {
                const assetTrimmer = new AssetTrimmer();
                return assetTrimmer.trim(space, gracePeriod, isDryRun);
            })
            .then(stats => {
                console.log(`Deleted ${stats.deletedCount} unused assets.`);
            })
            .catch(error => {
                try {
                    error = JSON.parse(error.message);
                } catch (ignore) {}
                console.error('Error: ' + error.message);
            });
    }
};