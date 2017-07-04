import {CustomWebhookHeader, Link, WebhookDefinition, WebhookDefinitionData} from 'contentful-management';
import {cloneDeep} from 'lodash';

export function buildMockWebhook(): MockWebhookBuilder {
    return new MockWebhookBuilder();
}

const user: Link<'User'> = {
    sys: {
        id: 'user123',
        linkType: 'User',
        type: 'Link',
    }
};

const basicWebhook: WebhookDefinitionData = {
    headers: [],
    httpBasicUsername: 'contentful_webhook',
    name: 'webhook123',
    topics: ['*.*'],
    url: 'http://example.loc',
    sys: {
        createdAt: '2017-06-29T16:21:21Z',
        createdBy: user,
        id: '<id>',
        type: 'WebhookDefinition',
        space: {
            sys: {
                id: 'space123',
                linkType: 'Space',
                type: 'Link',
            }
        },
        updatedAt: '2017-07-03T07:26:02Z',
        updatedBy: user,
        version: 8,
    }
};

let webhookCount = 0;

class MockWebhookBuilder {
    private webhook: WebhookDefinition;

    constructor() {
        this.webhook = cloneDeep(basicWebhook) as WebhookDefinition;
        this.webhook.sys.id = 'webhook' + (++webhookCount);

        this.webhook.update = jasmine.createSpy('webhook.update');
    }

    withHeader(header: CustomWebhookHeader): MockWebhookBuilder {
        this.webhook.headers.push(header);

        return this;
    }

    get(): WebhookDefinition {
        return this.webhook;
    }
}
