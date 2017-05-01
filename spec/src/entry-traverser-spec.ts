import {upperFirst} from 'lodash';
import {traverseEntries} from '../../src/entry-traverser';
import {buildMockEntry} from '../mock/mock-entry-builder';

describe('traverseEntries', function () {
    it('visits entry in entries', function() {
        const visitor = jasmine.createSpyObj('visitor', ['visitEntry']);
        const entry = buildMockEntry().get();

        traverseEntries([entry], visitor);

        expect(visitor.visitEntry).toHaveBeenCalled();
    });

    [false, 1, ''].forEach(function (value) {
        it('visits primitive field in entry', function() {
            const visitMethod = 'visit' + upperFirst(typeof value);
            const visitor = jasmine.createSpyObj('visitor', [visitMethod]);
            const entry = buildMockEntry().withField('name', value).get();

            traverseEntries([entry], visitor);

            expect(visitor[visitMethod]).toHaveBeenCalledWith(value, 'name');
        });
    });

    it('visits array field', function () {
        const visitor = jasmine.createSpyObj('visitor', ['visitArray']);
        const value = ['a', 'b'];
        const entry = buildMockEntry().withField('name', value).get();

        traverseEntries([entry], visitor);

        expect(visitor.visitArray).toHaveBeenCalledWith(value, 'name');
    });

    it('visits array field child', function () {
        const visitor = jasmine.createSpyObj('visitor', ['visitString']);
        const value = 'text';
        const entry = buildMockEntry().withField('name', [value]).get();

        traverseEntries([entry], visitor);

        expect(visitor.visitString).toHaveBeenCalledWith(value, 'name');
    });

    it('visits link', function () {
        const visitor = jasmine.createSpyObj('visitor', ['visitLink']);
        const entry = buildMockEntry().withLink('name', 'Asset', 'id123').get();

        traverseEntries([entry], visitor);

        expect(visitor.visitLink).toHaveBeenCalledWith(entry.fields['name']['en'], 'name');
    });
});
