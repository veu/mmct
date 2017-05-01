import {testRegex} from '../../src/regex-tester';
import * as contentful from '../../src/contentful';
import {Entry, Space} from 'contentful-management';
import * as inquirer from 'inquirer';
import {buildMockEntry} from '../mock/mock-entry-builder';
import {testAsync} from '../helper';

describe('regexTester', function () {
    describe('test', function () {
        let space = <Space>{};
        let entries: Entry[];
        let flags: string;
        let regex: string;

        beforeEach(function () {
            entries = [];
            regex = '.';
            flags = '';

            spyOn(console, 'log');

            spyOn(contentful, 'getEntries').and.returnValue(new Promise(resolve => resolve(entries)));

            spyOn(inquirer, 'prompt').and.callFake(() => new Promise(resolve => resolve({
                regex: regex,
                flags: flags
            })));
        });

        it('tests the regex against fields', testAsync(async function () {
            regex = '^a+';

            entries.push(
                buildMockEntry('model-id').withId('entry1').withField('field', 'aaaa').get(),
                buildMockEntry('model-id').withId('entry2').withField('field', 'baaa').get()
            );

            const stats = await testRegex(space, 'model-id', 'field');

            expect(console.log).toHaveBeenCalledTimes(1);
            expect((<jasmine.Spy>console.log).calls.argsFor(0)[0]).toContain('entry2');

            expect(stats).toEqual({
                matchedCount: 1,
                testedCount: 2
            });
        }));

        it('filters by content type', testAsync(async function () {
            await testRegex(space, 'model-id', 'field');

            expect(contentful.getEntries).toHaveBeenCalledWith(space, {content_type: 'model-id'});
        }));

        it('tests all locales in a field', testAsync(async function () {
            regex = 'a';

            entries.push(buildMockEntry('model-id').get());
            entries[0].fields['field'] = {
                'en': 'b',
                'fr': 'b',
            };

            const stats = await testRegex(space, 'model-id', 'field');

            expect(console.log).toHaveBeenCalledTimes(2);
            expect((<jasmine.Spy>console.log).calls.argsFor(0)[0]).toContain('‘en’');
            expect((<jasmine.Spy>console.log).calls.argsFor(1)[0]).toContain('‘fr’');

            expect(stats).toEqual({
                matchedCount: 0,
                testedCount: 1
            });
        }));

        it('ignores the ‘g’ flag', testAsync(async function () {
            regex = '^.+$';
            flags = 'g';

            entries.push(
                buildMockEntry('model-id').withId('entry1').withField('field', 'aa').get(),
                buildMockEntry('model-id').withId('entry2').withField('field', 'aa').get()
            );

            await testRegex(space, 'model-id', 'field');

            expect(console.log).not.toHaveBeenCalled();
        }));

        it('throws on invalid regex', testAsync(async function () {
            regex = '[\d+';

            try {
                await testRegex(space, 'model-id', 'field');
                fail();
            } catch (e) {
                expect(e.message).toContain(regex);
            }
        }));

        it('logs for missing field', testAsync(async function () {
            entries.push(buildMockEntry('model-id').withId('entry1').get());

            await testRegex(space, 'model-id', 'field');

            expect((<jasmine.Spy>console.log).calls.argsFor(0)[0]).toContain('entry1');
        }));
    });
});
