import * as contentful from '../../src/contentful';
import {Space, WebhookDefinition} from 'contentful-management';
import {buildMockWebhook} from '../mock/mock-webhook-builder';
import {markAllWebhooks, unmarkAllWebhooks} from '../../src/webhook-writer';

describe('webhookWriter', function () {
    let space: Space;
    let webhooks: WebhookDefinition[];
    const markHeader = {key: 'key', value: 'value'};

    beforeEach(function () {
        webhooks = [];

        spyOn(contentful, 'updateEntity');

        space = jasmine.createSpyObj('space', ['getWebhooks']);
        (space.getWebhooks as jasmine.Spy).and.returnValue({
            items: webhooks
        });
    });

    describe('markAllWebhooks', function () {
        it('adds header to all webhooks', async function () {
            webhooks.push(
                buildMockWebhook().get(),
                buildMockWebhook().withHeader({key: 'another', value: 'header'}).get(),
            );

            const stats = await markAllWebhooks(space, markHeader.key, markHeader.value);

            expect(stats.markedCount).toBe(stats.totalCount);

            for (const webhook of webhooks) {
                expect(webhook.headers).toContain(markHeader);
                expect(contentful.updateEntity).toHaveBeenCalledWith(webhook);
            }
        });

        it('does not update marked webhooks', async function () {
            webhooks.push(
                buildMockWebhook().get(),
                buildMockWebhook().withHeader(markHeader).get(),
            );

            const stats = await markAllWebhooks(space, markHeader.key, markHeader.value);

            expect(stats.markedCount).toBe(1);

            expect(contentful.updateEntity).toHaveBeenCalledWith(webhooks[0]);
            expect(contentful.updateEntity).not.toHaveBeenCalledWith(webhooks[1]);
        });
    });

    describe('unmarkAllWebhooks', function () {
        it('removes header from all webhooks', async function () {
            webhooks.push(
                buildMockWebhook().withHeader(markHeader).get(),
                buildMockWebhook().withHeader(markHeader).get(),
            );

            const stats = await unmarkAllWebhooks(space, markHeader.key, markHeader.value);

            expect(stats.unmarkedCount).toBe(stats.totalCount);

            for (const webhook of webhooks) {
                expect(webhook.headers).toEqual([]);
                expect(contentful.updateEntity).toHaveBeenCalledWith(webhook);
            }
        });

        it('does not update webhooks without the header', async function () {
            webhooks.push(
                buildMockWebhook().withHeader(markHeader).get(),
                buildMockWebhook().get(),
            );

            const stats = await unmarkAllWebhooks(space, markHeader.key, markHeader.value);

            expect(stats.unmarkedCount).toBe(1);

            expect(contentful.updateEntity).toHaveBeenCalledWith(webhooks[0]);
            expect(contentful.updateEntity).not.toHaveBeenCalledWith(webhooks[1]);
        });
    });
});
