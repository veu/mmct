import {CustomWebhookHeader, Space, WebhookDefinition} from 'contentful-management';
import {updateEntity} from './contentful';
import {isEqual} from 'lodash';

export async function markAllWebhooks(space: Space, key: string, value: string) {
    const markHeader = {key, value};

    const webhooks = (await space.getWebhooks()).items;
    const unmarkedWebhooks = webhooks.filter(webhook => !hasHeader(webhook, markHeader));

    await markWebhooks(unmarkedWebhooks, markHeader);

    return {
        markedCount: unmarkedWebhooks.length,
        totalCount: webhooks.length,
    };
}

export async function unmarkAllWebhooks(space: Space, key: string, value: string) {
    const markHeader = {key, value};

    const webhooks = (await space.getWebhooks()).items;
    const markedWebhooks = webhooks.filter(webhook => hasHeader(webhook, markHeader));

    await unmarkWebhooks(markedWebhooks, markHeader);

    return {
        unmarkedCount: markedWebhooks.length,
        totalCount: webhooks.length,
    };
}

function hasHeader(webhook: WebhookDefinition, markHeader: CustomWebhookHeader): boolean {
    return webhook.headers.some(header => isEqual(header, markHeader));
}

async function markWebhooks(webhooks: WebhookDefinition[], markHeader: CustomWebhookHeader): Promise<void> {
    for(const webhook of webhooks) {
        webhook.headers.push(markHeader);
        await updateEntity(webhook);
    }
}

async function unmarkWebhooks(webhooks: WebhookDefinition[], markHeader: CustomWebhookHeader): Promise<void> {
    for (const webhook of webhooks) {
        webhook.headers = webhook.headers.filter(header => !isEqual(header, markHeader));
        await updateEntity(webhook);
    }
}
