const contentful = require('./contentful');

const textTypes = ['Text', 'Symbol'];

module.exports = class EntryWriter {

    async fillDefaultValue(space, modelId, fieldName, value) {
        this.stats = {
            updatedCount: 0
        };

        await this.getLocales(space, modelId, fieldName);

        const entries = await contentful.getEntries(space, {content_type: modelId});
        await this.setDefaultValues(entries, fieldName, value);

        return this.stats;
    }

    async getLocales(space, modelId, fieldName) {
        const contentType = await this.getContentType(space, modelId);

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

        const locales = await space.getLocales();
        const relevantLocales = locales.items.filter(locale => field.localized || locale.default);

        this.localeCodes = relevantLocales.map(locale => locale.code);
    }

    async getContentType(space, id) {
        try {
            return await space.getContentType(id);
        } catch (e) {
            if (e.name === 'NotFound') {
                throw new Error(`Content model ‘${id}’ does not exist`);
            }

            throw e;
        }
    }

    async setDefaultValues(entries, fieldName, value) {
        for (const entry of entries) {
            await this.setDefaultValue(entry, fieldName, value);
        }
    }

    async setDefaultValue(entry, fieldName, value) {
        if (entry.fields[fieldName] !== undefined) {
            return;
        }

        this.stats.updatedCount ++;

        entry.fields[fieldName] = {};
        for (const locale of this.localeCodes) {
            entry.fields[fieldName][locale] = value;
        }

        await contentful.updateEntity(entry);
    }
}