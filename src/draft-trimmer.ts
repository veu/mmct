import * as contentful from './contentful';
import {Entry, Space} from 'contentful-management';

export async function trimDrafts(space: Space) {
    const entries = await contentful.getEntries(space);
    const deletableDrafts = getDeletableDrafts(entries);
    await deleteDrafts(deletableDrafts);

    return {
        deletedCount: deletableDrafts.length
    };
}

function getDeletableDrafts(entries: Entry[]) {
    return entries.filter(entry => {
        if (entry.isPublished()) {
            return false;
        }

        if (contentful.isInGracePeriod(entry)) {
            return false;
        }

        return true;
    });
}

async function deleteDrafts(drafts: Entry[]) {
    for (const draft of drafts) {
        await contentful.deleteEntity(draft);
    }
}
