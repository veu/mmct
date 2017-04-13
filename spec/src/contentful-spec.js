const contentful = require('../../src/contentful');
const mock = require('mock-require');
const MockEntryBuilder = require('../mock/mock-entry-builder');
const Promise = require('sync-p');

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

    describe('getSpace', function () {
        afterEach(function () {
            mock.stopAll();
        });

        it('passes credentials', testAsync(async function () {
            const client = {
                getSpace: jasmine.createSpy('client.getSpace')
            };

            const contentfulManagement = {
                createClient: jasmine.createSpy('contentfulManagement.createClient').and.returnValue(client)
            };

            mock('contentful-management', contentfulManagement);
            const contentful = require('../../src/contentful');

            const spaceId = 'space-id';
            const accessToken = 'token';

            await contentful.getSpace(spaceId, accessToken);

            expect(contentfulManagement.createClient).toHaveBeenCalledWith({accessToken});
            expect(client.getSpace).toHaveBeenCalledWith(spaceId);

        }));

        it('throws proper error if connecting to space fails', testAsync(async function () {
            const originalError = 'anything';
            const client = {
                getSpace: jasmine.createSpy('client.getSpace').and.throwError(originalError)
            };

            const contentfulManagement = {
                createClient: jasmine.createSpy('contentfulManagement.createClient').and.returnValue(client)
            };

            mock('contentful-management', contentfulManagement);
            const contentful = require('../../src/contentful');

            try {
                await contentful.getSpace('space-id', 'token');
            } catch (e) {
                expect(e.message).not.toEqual(originalError);
            }
        }));
    });

    for (const method of ['getAssets', 'getEntries']) {
        describe(method, function () {
            it('returns entities for space', testAsync(async function () {
                const expectedAssets = ['a'];
                const space = {};
                space[method] = jasmine.createSpy('space.' + method).and.returnValue(new Promise(resolve => {
                    resolve({items: expectedAssets, total: 2});
                }));

                const assets = await contentful[method](space);

                expect(assets).toEqual(expectedAssets);
            }));

            it('passes paging parameters', testAsync(async function () {
                const space = {};
                space[method] = jasmine.createSpy('space.' + method).and.returnValue(new Promise(resolve => {
                    resolve({items: [], total: 0});
                }));

                skip = 3;
                limit = 5;

                await contentful[method](space, skip, limit);

                expect(space[method]).toHaveBeenCalledWith({skip, limit});
            }));

            it('fetches and combines batches', testAsync(async function () {
                const space = {};
                space[method] = jasmine.createSpy('space.' + method).and.returnValues(
                    new Promise(resolve => {
                        resolve({items: ['a', 'b'], total: 4});
                    }),
                    new Promise(resolve => {
                        resolve({items: ['c', 'd'], total: 4});
                    })
                );

                const assets = await contentful[method](space, 0, 2);

                expect(assets).toEqual(['a', 'b', 'c', 'd']);
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

            jasmine.clock().install();
            jasmine.clock().mockDate(new Date());
            jasmine.clock().tick(100);

            deletionPromise = contentful.deleteEntity(entry);

            expect(entry.delete).toHaveBeenCalled();

            await deletionPromise;

            entry.delete = jasmine.createSpy('entry.delete');

            deletionPromise = contentful.deleteEntity(entry);

            jasmine.clock().tick(99);

            expect(entry.delete).not.toHaveBeenCalled();

            jasmine.clock().tick(1);

            expect(entry.delete).toHaveBeenCalled();

            jasmine.clock().uninstall();
        }));
    });

    describe('isInGracePeriod', function () {
        contentful.config.gracePeriod = 1;

        const entry = MockEntryBuilder.create().get();

        beforeEach(function () {
            jasmine.clock().install();
            jasmine.clock().mockDate();
        });

        afterEach(function () {
            jasmine.clock().uninstall();
        });

        it('returns true if entity has been updated in grace period', function () {
            entry.sys.updatedAt = new Date(new Date() - 24 * 60 * 60 * 1000);

            expect(contentful.isInGracePeriod(entry)).toBe(true);
        });

        it('returns false if entity has been updated before grace period', function () {
            entry.sys.updatedAt = new Date(new Date() - 24 * 60 * 60 * 1000 - 1);

            expect(contentful.isInGracePeriod(entry)).toBe(false);
        });
    });
});