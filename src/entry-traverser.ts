import {Entry, Field, Link, LocalizedField} from 'contentful-management';
import {forOwn} from 'lodash';
import {Visitor} from './visitor';

function traverseEntry(visitor: Visitor, entry: Entry) {
    if (visitor.visitEntry) {
        visitor.visitEntry(entry);
    }

    forOwn(entry.fields, (field, identifier) => traverseLocalizedField(visitor, field, identifier));
}

function traverseLocalizedField(visitor: Visitor, field: LocalizedField, identifier: string) {
    for (const locale of Object.keys(field)) {
        if (visitor.visitLocale) {
            visitor.visitLocale(field[locale], locale);
        }

        traverseField(visitor, field[locale], identifier);
    }
}

function traverseField(visitor: Visitor, field: Field, identifier: string) {
    if (typeof field === 'boolean') {
        if (visitor.visitBoolean) {
            visitor.visitBoolean(field, identifier);
        }

        return;
    }

    if (typeof field === 'number') {
        if (visitor.visitNumber) {
            visitor.visitNumber(field, identifier);
        }

        return;
    }

    if (typeof field === 'string') {
        if (visitor.visitString) {
            visitor.visitString(field, identifier);
        }

        return;
    }

    if (Array.isArray(field)) {
        if (visitor.visitArray) {
            visitor.visitArray(field, identifier);
        }

        field.forEach(child => traverseField(visitor, child, identifier));

        return;
    }

    if (visitFieldAsLink(visitor, <Link<any>>field, identifier)) {
        return;
    }

    throw new Error('Unknown field type');
}

function visitFieldAsLink(visitor: Visitor, field: Link<any>, identifier: string): boolean {
    if (field.sys && field.sys.type === 'Link') {
        if (visitor.visitLink) {
            visitor.visitLink(field, identifier);
        }

        return true;
    }

    return false;
}

export function traverseEntries(entries: Entry[], visitor: Visitor) {
    entries.forEach(entry => traverseEntry(visitor, entry));
}
