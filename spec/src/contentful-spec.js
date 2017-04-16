const contentful = require('../../src/contentful');
const MockEntryBuilder = require('../mock/mock-entry-builder');

describe('contentful helper', function () {
    function testAsync(runAsync) {
        return function (done) {
            runAsync().then(
                done,
                function (e) {
                    fail(e);
                    done();
                }
            );
        };
    }

    let awaiting;
    let testTime = 0;

    beforeEach(function () {
        awaiting = require('awaiting');
        spyOn(awaiting, 'delay');

        jasmine.clock().install();
        jasmine.clock().mockDate();
        jasmine.clock().tick(testTime += 1000);
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    describe('getSpace', function () {
        let client;
        let contentfulManagement;

        beforeEach(function () {
            client = {
                getSpace: jasmine.createSpy('client.getSpace')
            };

            contentfulManagement = require('contentful-management');
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
            client.getSpace.and.throwError(originalError);

            try {
                await contentful.getSpace('space-id', 'token');
                fail();
            } catch (e) {
                expect(e.message).not.toEqual(originalError);
            }
        }));

        it('delays execution to avoid hitting API rate limit', testAsync(async function () {
            await contentful.getSpace('space-id', 'token');

            expect(awaiting.delay).not.toHaveBeenCalled();
            expect(client.getSpace).toHaveBeenCalled();

            await contentful.getSpace('space-id', 'token');

            expect(awaiting.delay).toHaveBeenCalled();
            expect(client.getSpace).toHaveBeenCalledTimes(2);
        }));
    });

    for (const method of ['getAssets', 'getEntries']) {
        describe(method, function () {
            let space;

            beforeEach(function () {
                space = {
                    [method]: jasmine.createSpy('space.' + method)
                };
            });

            it('returns entities for space', testAsync(async function () {
                const expectedAssets = ['a'];
                space[method].and.returnValue(new Promise(resolve => {
                    resolve({items: expectedAssets, total: 1});
                }));

                const assets = await contentful[method](space);

                expect(assets).toEqual(expectedAssets);
            }));

            it('passes paging parameters', testAsync(async function () {
                space[method].and.returnValue(new Promise(resolve => {
                    resolve({items: [], total: 0});
                }));
                space[method].calls.saveArgumentsByValue();

                contentful.config.entityBatchLimit = 5;
                const skip = 3;

                await contentful[method](space, {skip});

                expect(space[method]).toHaveBeenCalledWith({skip, limit: contentful.config.entityBatchLimit});
            }));

            it('fetches and combines batches', testAsync(async function () {
                space[method].and.returnValues(
                    new Promise(resolve => {
                        resolve({items: ['a', 'b'], total: 4});
                    }),
                    new Promise(resolve => {
                        resolve({items: ['c', 'd'], total: 4});
                    })
                );

                contentful.config.entityBatchLimit = 2;

                const assets = await contentful[method](space);

                expect(assets).toEqual(['a', 'b', 'c', 'd']);
            }));

            it('delays fetching to avoid hitting API rate limit', testAsync(async function () {
                space[method].and.returnValues(
                    new Promise(resolve => {
                        resolve({items: ['a'], total: 3});
                    }),
                    new Promise(resolve => {
                        resolve({items: ['b'], total: 3});
                    }),
                    new Promise(resolve => {
                        resolve({items: ['c'], total: 3});
                    })
                );

                contentful.config.entityBatchLimit = 1;

                const assets = await contentful[method](space);

                expect(awaiting.delay).toHaveBeenCalledTimes(2);
            }));
        });
    }

    describe('deleteEntity', function () {
        let entry;

        beforeEach(function () {
            spyOn(console, 'log');

            entry = MockEntryBuilder.create().get();
        });

        it('stops after logging in dry run', testAsync(async function () {
            contentful.config.isDryRun = true;

            entry.isPublished = jasmine.createSpy('entry.isPublished');

            await contentful.deleteEntity(entry);

            expect(console.log).toHaveBeenCalled();
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

        it('delays deletion to avoid hitting API rate limit', testAsync(async function () {
            contentful.config.isDryRun = false;

            entry.isPublished = jasmine.createSpy('entry.isPublished').and.returnValue(false);
            entry.delete = jasmine.createSpy('entry.delete');

            await contentful.deleteEntity(entry);

            expect(awaiting.delay).not.toHaveBeenCalled();
            expect(entry.delete).toHaveBeenCalled();

            await contentful.deleteEntity(entry);

            expect(awaiting.delay).toHaveBeenCalled();
            expect(entry.delete).toHaveBeenCalled();
        }));

        it('delays unpublishing to avoid hitting API rate limit', testAsync(async function () {
            contentful.config.isDryRun = false;

            entry.isPublished = jasmine.createSpy('entry.isPublished').and.returnValue(true);
            entry.unpublish = jasmine.createSpy('entry.unpublish');
            entry.delete = jasmine.createSpy('entry.delete');

            await contentful.deleteEntity(entry);

            expect(awaiting.delay).toHaveBeenCalledTimes(1);
            expect(entry.unpublish).toHaveBeenCalled();

            awaiting.delay.calls.reset();

            await contentful.deleteEntity(entry);

            expect(awaiting.delay).toHaveBeenCalledTimes(2);
            expect(entry.unpublish).toHaveBeenCalled();
        }));
    });

    describe('updateEntity', function () {
        let entry;

        beforeEach(function () {
            spyOn(console, 'log');

            entry = MockEntryBuilder.create().get();
        });

        it('logs and updates entity', testAsync(async function () {
            entry.update = jasmine.createSpy('entry.update');

            await contentful.updateEntity(entry);

            expect(console.log).toHaveBeenCalled();
            expect(entry.update).toHaveBeenCalled();
        }));

        it('delays update to avoid hitting API rate limit', testAsync(async function () {
            entry.update = jasmine.createSpy('entry.update');

            await contentful.updateEntity(entry);

            expect(awaiting.delay).not.toHaveBeenCalled();
            expect(entry.update).toHaveBeenCalled();

            await contentful.updateEntity(entry);

            expect(awaiting.delay).toHaveBeenCalled();
            expect(entry.update).toHaveBeenCalledTimes(2);
        }));
    });

    describe('isInGracePeriod', function () {
        contentful.config.gracePeriod = 1;

        const entry = MockEntryBuilder.create().get();

        it('returns true if entity has been updated in grace period', function () {
            entry.sys.updatedAt = new Date(new Date() - 24 * 60 * 60 * 1000);

            expect(contentful.isInGracePeriod(entry)).toBe(true);
        });

        it('returns false if entity has been updated before grace period', function () {
            entry.sys.updatedAt = new Date(new Date() - 24 * 60 * 60 * 1000 - 1);

            expect(contentful.isInGracePeriod(entry)).toBe(false);
        });
    });

    describe('getLocales', function () {
        it('returns locales', testAsync(async function () {
            const expectedLocales = ['locale1', 'locale2'];
            const space = {
                getLocales: jasmine.createSpy().and.returnValue(new Promise (resolve => resolve(expectedLocales)))
            };

            const locales = await contentful.getLocales(space);

            expect(locales).toBe(expectedLocales);
        }));

        it('delays execution to avoid hitting API rate limit', testAsync(async function () {
            const space = {
                getLocales: jasmine.createSpy()
            };

            await contentful.getLocales(space);

            expect(awaiting.delay).not.toHaveBeenCalled();

            await contentful.getLocales(space);

            expect(awaiting.delay).toHaveBeenCalled();
        }));
    });

    describe('getContentType', function () {
        it('returns content type', testAsync(async function () {
            const contentTypeId = 'content type id';
            const expectedContentType = 'content type';
            const space = {
                getContentType: jasmine.createSpy().and.returnValue(new Promise (resolve => resolve(expectedContentType)))
            };

            const contentType = await contentful.getContentType(space, contentTypeId);

            expect(contentType).toBe(expectedContentType);
            expect(space.getContentType).toHaveBeenCalledWith(contentTypeId);
        }));

        it('delays execution to avoid hitting API rate limit', testAsync(async function () {
            const space = {
                getContentType: jasmine.createSpy()
            };

            await contentful.getContentType(space, 'content type id');

            expect(awaiting.delay).not.toHaveBeenCalled();

            await contentful.getContentType(space, 'content type id');

            expect(awaiting.delay).toHaveBeenCalled();
        }));
    });
});
