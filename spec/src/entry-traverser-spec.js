const _ = require('lodash');
const EntryTraverser = require('../../src/entry-traverser');
const MockEntryBuilder = require('../mock/mock-entry-builder');

describe('EntryTraverser', function () {
    const entryTraverser = new EntryTraverser();

    it('visits entry in entries', function() {
        const visitor = jasmine.createSpyObj('visitor', ['visitEntry']);
        const entry = MockEntryBuilder.create().get();

        entryTraverser.traverse([entry], visitor);

        expect(visitor.visitEntry).toHaveBeenCalled();
    });

    [false, 1, ''].forEach(function (value) {
        it('visits primitive field in entry', function() {
            const visitMethod = 'visit' + _.upperFirst(typeof value);
            const visitor = jasmine.createSpyObj('visitor', [visitMethod]);
            const entry = MockEntryBuilder.create().withField('name', value).get();

            entryTraverser.traverse([entry], visitor);

            expect(visitor[visitMethod]).toHaveBeenCalledWith(value, 'name');
        });
    });

    it('visits array field', function () {
        const visitor = jasmine.createSpyObj('visitor', ['visitArray']);
        const value = [];
        const entry = MockEntryBuilder.create().withField('name', value).get();

        entryTraverser.traverse([entry], visitor);

        expect(visitor.visitArray).toHaveBeenCalledWith(value, 'name');
    });

    it('visits array field child', function () {
        const visitor = jasmine.createSpyObj('visitor', ['visitString']);
        const value = 'text';
        const entry = MockEntryBuilder.create().withField('name', [value]).get();

        entryTraverser.traverse([entry], visitor);

        expect(visitor.visitString).toHaveBeenCalledWith(value, 'name');
    });

    it('visits link', function () {
        const visitor = jasmine.createSpyObj('visitor', ['visitLink']);
        const value = [];
        const entry = MockEntryBuilder.create().withLink('name', 'Asset', 'id123').get();

        entryTraverser.traverse([entry], visitor);

        expect(visitor.visitLink).toHaveBeenCalledWith({type: 'Link', linkType: 'Asset', id: 'id123'}, 'name');
    });
});