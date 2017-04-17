const contentful = require('./contentful');

const textTypes = ['Text', 'Symbol'];

async function getLocales(space, modelId, fieldName) {
    const contentType = await getContentType(space, modelId);

    const field = contentType.fields.find(field => field.id === fieldName);

    if (field === undefined) {
        throw new Error(`Field ‘${fieldName}’ missing in content model ‘${contentType.name}’`);
    }

    if (!textTypes.includes(field.type)) {
        throw new Error(`Field ‘${fieldName}’ in content model ‘${contentType.name}’ is not a text field`);
    }

    if (field.disabled) {
        throw new Error(`Editing field ‘${fieldName}’ in content model ‘${contentType.name}’ is disabled`);
    }

    const locales = await contentful.getLocales(space);
    const relevantLocales = locales.items.filter(locale => field.localized || locale.default);

    return relevantLocales.map(locale => locale.code);
}

function createLocalizedValue(value, localeCodes) {
    defaultValue = {};
    for (const locale of localeCodes) {
        defaultValue[locale] = value;
    }

    return defaultValue;
}

async function getContentType(space, id) {
    try {
        return await contentful.getContentType(space, id);
    } catch (e) {
        if (e.name === 'NotFound') {
            throw new Error(`Content model ‘${id}’ does not exist`);
        }

        throw e;
    }
}

async function setLocalizedValues(entries, fieldName, localizedValue) {
    for (const entry of entries) {
        entry.fields[fieldName] = localizedValue;
        await contentful.updateEntity(entry);
    }
}

module.exports = {
    fillDefaultValue: async function (space, modelId, fieldName, value) {
        const localeCodes = await getLocales(space, modelId, fieldName);
        const localizedValue = createLocalizedValue(value, localeCodes);

        const entries = await contentful.getEntries(space, {content_type: modelId});
        const entriesToUpdate = entries.filter(entry => entry.fields[fieldName] === undefined);
        await setLocalizedValues(entriesToUpdate, fieldName, localizedValue);

        return {
            updatedCount: entriesToUpdate.length
        };
    }
}
