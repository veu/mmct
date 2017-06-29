import * as contentful from './contentful';
import {Entry, LocalizedField, Space} from 'contentful-management';

const textTypes = ['Text', 'Symbol'];

export async function copyValue(space: Space, modelId: string, srcFieldName: string, destFieldName: string) {
    await checkFieldCompatibility(space, modelId, srcFieldName, destFieldName);

    const entries = await contentful.getEntries(space, {content_type: modelId});
    await copyValues(entries, srcFieldName, destFieldName);

    return {
        updatedCount: entries.length
    };
}

export async function fillDefaultValue(space: Space, modelId: string, fieldName: string, value: string) {
    const localeCodes = await getLocales(space, modelId, fieldName);
    const localizedValue = createLocalizedValue(value, localeCodes);

    const entries = await contentful.getEntries(space, {content_type: modelId});
    const entriesToUpdate = entries.filter(entry => entry.fields[fieldName] === undefined);
    await setLocalizedValues(entriesToUpdate, fieldName, localizedValue);

    return {
        updatedCount: entriesToUpdate.length
    };
}

async function checkFieldCompatibility(space: Space, modelId: string, srcFieldName: string, destFieldName: string) {
    const contentType = await getContentType(space, modelId);

    const srcField = contentType.fields.find(field => field.id === srcFieldName);
    const destField = contentType.fields.find(field => field.id === destFieldName);

    if (srcField === undefined) {
        throw new Error(`Field ‘${srcFieldName}’ missing in content model ‘${contentType.name}’`);
    }

    if (destField === undefined) {
        throw new Error(`Field ‘${destFieldName}’ missing in content model ‘${contentType.name}’`);
    }

    if (destField.disabled) {
        throw new Error(`Editing field ‘${destFieldName}’ in content model ‘${contentType.name}’ is disabled`);
    }

    if (srcField.localized && !destField.localized) {
        throw new Error(`Can’t write localized field ‘${srcFieldName}’ into non-localized field ‘${destFieldName}’ in content model ‘${contentType.name}’`);
    }

    if (!srcField.localized && destField.localized) {
        throw new Error(`Can’t write non-localized field ‘${srcFieldName}’ into localized field ‘${destFieldName}’ in content model ‘${contentType.name}’`);
    }

    if (textTypes.indexOf(srcField.type) === -1) {
        throw new Error(`Field ‘${srcFieldName}’ is not a text field in content model ‘${contentType.name}’`);
    }

    if (textTypes.indexOf(destField.type) === -1) {
        throw new Error(`Field ‘${destFieldName}’ is not a text field in content model ‘${contentType.name}’`);
    }

    if (srcField.type === 'Text' && destField.type === 'Symbol') {
        throw new Error(`Long text field cannot be copied into short text field in content model ‘${contentType.name}’`);
    }
}

async function copyValues(entries: Entry[], srcFieldName: string, destFieldName: string) {
    for (const entry of entries) {
        entry.fields[destFieldName] = entry.fields[srcFieldName];
        await contentful.updateEntity(entry);
    }
}

async function getLocales(space: Space, modelId: string, fieldName: string) {
    const contentType = await getContentType(space, modelId);

    const field = contentType.fields.find(field => field.id === fieldName);

    if (field === undefined) {
        throw new Error(`Field ‘${fieldName}’ missing in content model ‘${contentType.name}’`);
    }

    if (textTypes.indexOf(field.type) === -1) {
        throw new Error(`Field ‘${fieldName}’ in content model ‘${contentType.name}’ is not a text field`);
    }

    if (field.disabled) {
        throw new Error(`Editing field ‘${fieldName}’ in content model ‘${contentType.name}’ is disabled`);
    }

    const locales = await space.getLocales();
    const relevantLocales = locales.items.filter(locale => field.localized || locale.default);

    return relevantLocales.map(locale => locale.code);
}

function createLocalizedValue(value: string, localeCodes: string[]): LocalizedField {
    let defaultValue: LocalizedField = {};

    for (const locale of localeCodes) {
        defaultValue[locale] = value;
    }

    return defaultValue;
}

async function getContentType(space: Space, id: string) {
    try {
        return await space.getContentType(id);
    } catch (e) {
        if (e.name === 'NotFound') {
            throw new Error(`Content model ‘${id}’ does not exist`);
        }

        throw e;
    }
}

async function setLocalizedValues(entries: Entry[], fieldName: string, localizedValue: LocalizedField) {
    for (const entry of entries) {
        entry.fields[fieldName] = localizedValue;
        await contentful.updateEntity(entry);
    }
}
