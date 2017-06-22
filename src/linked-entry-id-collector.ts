import {Link} from 'contentful-management';
import {Visitor} from './visitor';

class LinkedEntryIdCollector implements Visitor {
    public entryIds: Set<string>;

    constructor() {
        this.entryIds = new Set();
    }

    visitLink(link: Link<any>) {
        if (link.sys.linkType === 'Entry') {
            this.entryIds.add(link.sys.id);
        }
    }
}

export function createLinkedEntryIdCollector() {
    return new LinkedEntryIdCollector();
}
