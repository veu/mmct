import * as contentful from '../../src/contentful';
import * as contentfulManagement from 'contentful-management';
import {Client, EntityResponse, Entry, Locale, Space} from 'contentful-management';
import {buildMockAsset} from '../mock/mock-asset-builder';
import {buildMockContentType} from '../mock/mock-content-type-builder'
import {buildMockEntry} from '../mock/mock-entry-builder';
import {testAsync} from '../helper';
import * as logger from '../../src/logger';

describe('contentful helper', function () {
    let testTime = 0;
    let space: Space;

    beforeEach(function () {
        jasmine.clock().install();
        jasmine.clock().mockDate();
        jasmine.clock().tick(testTime += 1000);

        space = jasmine.createSpyObj('space', ['getAssets', 'getContentType', 'getEntries', 'getLocales']);
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    describe('getSpace', function () {
        let client: Client;

        beforeEach(function () {
            client = {
                getSpace: jasmine.createSpy('client.getSpace')
            };

            spyOn(contentfulManagement, 'createClient').and.callFake(() => client);
        });

        it('passes credentials', testAsync(async function () {
            const spaceId = 'space-id';
            const accessToken = 'token';

            await contentful.getSpace(spaceId, accessToken);

            expect(contentfulManagement.createClient).toHaveBeenCalledWith({accessToken});
            expect(client.getSpace).toHaveBeenCalledWith(spaceId);

        }));

        it('throws proper error if connecting to space fails', testAsync(async function () {
            const originalError = 'anything';
            (<jasmine.Spy>client.getSpace).and.throwError(originalError);

            try {
                await contentful.getSpace('space-id', 'token');
                fail();
            } catch (e) {
                expect(e.message).not.toEqual(originalError);
            }
        }));
    });

    describe('getAssets', function () {
        it('returns entities for space', testAsync(async function () {
            const expectedAssets = [
                buildMockAsset().withId('a').get()
            ];

            (<jasmine.Spy>space.getAssets).and.returnValue(new Promise(resolve => {
                resolve({items: expectedAssets, total: 1});
            }));

            const assets = await contentful.getAssets(space);

            expect(assets).toEqual(expectedAssets);
        }));

        it('passes paging parameters', testAsync(async function () {
            (<jasmine.Spy>space.getAssets).and.returnValue(new Promise(resolve => {
                resolve({items: [], total: 0});
            }));
            (<any>space.getAssets).calls.saveArgumentsByValue();

            contentful.config.entityBatchLimit = 5;
            const skip = 3;

            await contentful.getAssets(space, {skip});

            expect(space.getAssets).toHaveBeenCalledWith({skip, limit: contentful.config.entityBatchLimit});
        }));

        it('fetches and combines batches', testAsync(async function () {
            const expectedAssets = [
                buildMockAsset().withId('a').get(),
                buildMockAsset().withId('b').get(),
                buildMockAsset().withId('c').get(),
                buildMockAsset().withId('d').get(),
            ];

            (<jasmine.Spy>space.getAssets).and.returnValues(
                new Promise(resolve => {
                    resolve({items: expectedAssets.slice(0, 2), total: 4});
                }),
                new Promise(resolve => {
                    resolve({items: expectedAssets.slice(2), total: 4});
                })
            );

            contentful.config.entityBatchLimit = 2;

            const assets = await contentful.getAssets(space);

            expect(assets).toEqual(expectedAssets);
        }));
    });

    describe('getEntries', function () {
        it('returns entities for space', testAsync(async function () {
            const expectedEntries = [
                buildMockEntry('model-id').withId('a').get()
            ];
            (<jasmine.Spy>space.getEntries).and.returnValue(new Promise(resolve => {
                resolve({items: expectedEntries, total: 1});
            }));

            const entries = await contentful.getEntries(space);

            expect(entries).toEqual(expectedEntries);
        }));

        it('passes paging parameters', testAsync(async function () {
            (<jasmine.Spy>space.getEntries).and.returnValue(new Promise(resolve => {
                resolve({items: [], total: 0});
            }));
            (<any>space.getEntries).calls.saveArgumentsByValue();

            contentful.config.entityBatchLimit = 5;
            const skip = 3;

            await contentful.getEntries(space, {skip});

            expect(space.getEntries).toHaveBeenCalledWith({skip, limit: contentful.config.entityBatchLimit});
        }));

        it('fetches and combines batches', testAsync(async function () {
            const expectedEntries = [
                buildMockEntry('model-id').withId('a').get(),
                buildMockEntry('model-id').withId('b').get(),
                buildMockEntry('model-id').withId('c').get(),
                buildMockEntry('model-id').withId('d').get(),
            ];

            (<jasmine.Spy>space.getEntries).and.returnValues(
                new Promise(resolve => {
                    resolve({items: expectedEntries.slice(0, 2), total: 4});
                }),
                new Promise(resolve => {
                    resolve({items: expectedEntries.slice(2), total: 4});
                })
            );

            contentful.config.entityBatchLimit = 2;

            const assets = await contentful.getEntries(space);

            expect(assets).toEqual(expectedEntries);
        }));
    });

    describe('deleteEntity', function () {
        let entry: Entry;

        beforeEach(function () {
            spyOn(logger, 'info');

            entry = buildMockEntry().get();
        });

        it('stops after logging in dry run', testAsync(async function () {
            contentful.config.isDryRun = true;

            entry.isPublished = jasmine.createSpy('entry.isPublished');

            await contentful.deleteEntity(entry);

            expect(logger.info).toHaveBeenCalled();
            expect(entry.isPublished).not.toHaveBeenCalled();
        }));

        it('deletes draft entity directly', testAsync(async function () {
            contentful.config.isDryRun = false;

            entry.isPublished = jasmine.createSpy('entry.isPublished').and.returnValue(false);
            entry.delete = jasmine.createSpy('entry.delete');

            await contentful.deleteEntity(entry);

            expect(entry.delete).toHaveBeenCalled();
        }));

        it('unpublishes and deletes published entity', testAsync(async function () {
            contentful.config.isDryRun = false;

            entry.isPublished = jasmine.createSpy('entry.isPublished').and.returnValue(true);
            entry.unpublish = jasmine.createSpy('entry.unpublish').and.returnValue(new Promise(resolve => {
                resolve();
            }));
            entry.delete = jasmine.createSpy('entry.delete');

            await contentful.deleteEntity(entry);

            expect(entry.unpublish).toHaveBeenCalled();
            expect(entry.delete).toHaveBeenCalled();
        }));
    });

    describe('updateEntity', function () {
        let entry: Entry;

        beforeEach(function () {
            spyOn(logger, 'info');

            entry = buildMockEntry().get();
        });

        it('logs and updates entity', testAsync(async function () {
            entry.update = jasmine.createSpy('entry.update');
            entry.isPublished = () => false;

            await contentful.updateEntity(entry);

            expect(logger.info).toHaveBeenCalled();
            expect(entry.update).toHaveBeenCalled();
        }));

        it('publishes entry that was published without pending changes', testAsync(async function () {
            const updatedEntry = buildMockEntry().get();
            updatedEntry.publish = jasmine.createSpy('updatedEntry.publish');

            entry.isPublished = () => true;
            entry.isUpdated = () => false;
            entry.update = () => new Promise(resolve => resolve(updatedEntry));

            await contentful.updateEntity(entry);

            expect(updatedEntry.publish).toHaveBeenCalled();
        }));

        it('does not publish entry that was published with pending changes', testAsync(async function () {
            const updatedEntry = buildMockEntry().get();
            updatedEntry.publish = jasmine.createSpy('updatedEntry.publish');

            entry.isPublished = () => true;
            entry.isUpdated = () => true;
            entry.update = () => new Promise(resolve => resolve(updatedEntry));

            await contentful.updateEntity(entry);

            expect(updatedEntry.publish).not.toHaveBeenCalled();
        }));
    });

    describe('isInGracePeriod', function () {
        contentful.config.gracePeriod = 1;

        const entry: Entry = buildMockEntry().get();

        it('returns true if entity has been updated in grace period', function () {
            entry.sys.updatedAt = new Date(+new Date() - 24 * 60 * 60 * 1000).toISOString();

            expect(contentful.isInGracePeriod(entry)).toBe(true);
        });

        it('returns false if entity has been updated before grace period', function () {
            entry.sys.updatedAt = new Date(+new Date() - 24 * 60 * 60 * 1000 - 1).toISOString();

            expect(contentful.isInGracePeriod(entry)).toBe(false);
        });
    });

    describe('getLocales', function () {
        it('returns locales', testAsync(async function () {
            const expectedResponse: EntityResponse<Locale> = <any>['locale1', 'locale2'];
            (<jasmine.Spy>space.getLocales).and.returnValue(new Promise (resolve => resolve(expectedResponse)));

            const locales = await contentful.getLocales(space);

            expect(locales).toBe(expectedResponse);
        }));
    });

    describe('getContentType', function () {
        it('returns content type', testAsync(async function () {
            const contentTypeId = 'content type id';
            const expectedContentType = buildMockContentType(contentTypeId).get();

            (<jasmine.Spy>space.getContentType).and.returnValue(new Promise (resolve => resolve(expectedContentType)));

            const contentType = await contentful.getContentType(space, contentTypeId);

            expect(contentType).toBe(expectedContentType);
            expect(space.getContentType).toHaveBeenCalledWith(contentTypeId);
        }));
    });
});
