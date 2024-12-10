import Model from '../../../model/model.js';
import Db from '../../../helpers/mysql.js';

jest.mock('../../../helpers/mysql.js');

describe('Model Class', () => {
    let model;
    const sampleData = {
        id: 1,
        foo: 'testFoo',
        bar: 'testBar',
    };

    beforeEach(() => {
        model = new Model('sample_table', {
            fields: {
                id: sampleData.id,
                foo: sampleData.foo,
                bar: sampleData.bar,
            },
            allowUpdate: ['foo'],
            insertFields: ['foo', 'bar'],
        });
        jest.clearAllMocks();
    });

    describe('Instance creation', () => {
        test('should create a Model instance', () => {
            expect(model).toBeInstanceOf(Model);
            expect(model.foo).toBe(sampleData.foo);
            expect(model.bar).toBe(sampleData.bar);
        });
    });

    describe('Database operations', () => {
        test('should insert data into the database', async () => {
            Db.insert.mockResolvedValue([{ insertId: sampleData.id }]);
            Db.find.mockResolvedValue([sampleData]);

            await model.insert();

            expect(Db.insert).toHaveBeenCalledWith('sample_table', { foo: sampleData.foo, bar: sampleData.bar });
            expect(model.id).toBe(sampleData.id);
        });

        test('should get data by id', async () => {
            Db.find.mockResolvedValue([sampleData]);

            await model.get();

            expect(Db.find).toHaveBeenCalledWith('sample_table', { filter: { id: sampleData.id } });
            expect(model.foo).toBe(sampleData.foo);
            expect(model.bar).toBe(sampleData.bar);
        });

        test('should update data in the database', async () => {
            const updatedData = { foo: 'updatedFoo', bar: 'updatedBar' };
            const updatedFields = { foo: updatedData.foo };
            Db.update.mockResolvedValue();
            Db.find.mockResolvedValue([{ ...sampleData, ...updatedData }]);

            await model.update(updatedData);

            expect(Db.update).toHaveBeenCalledWith('sample_table', updatedFields, model.id);
            expect(model.foo).toBe(updatedData.foo);
        });

        test('should delete data from the database', async () => {
            Db.delete.mockResolvedValue();

            await model.delete();

            expect(Db.delete).toHaveBeenCalledWith('sample_table', model.id);
        });

        test('should get all records', async () => {
            const records = [sampleData];
            Db.find.mockResolvedValue(records);

            const result = await model.getAll();

            expect(Db.find).toHaveBeenCalledWith('sample_table', { filter: {} });
            expect(result).toEqual(records);
        });

        test('should get all records from a custom table', async () => {
            const records = [sampleData];
            Db.find.mockResolvedValue(records);

            const result = await Model.getAll('custom_table');

            expect(Db.find).toHaveBeenCalledWith('custom_table', { filter: {} });
            expect(result).toEqual(records);
        });
    });

    describe('Error handling', () => {
        test('should throw an error if field is invalid', async () => {
            await expect(model.getBy('invalidField')).rejects.toThrow('Invalid field');
        });

        test('should throw an error if relation is not defined', async () => {
            await expect(model.getRelation('invalidRelation')).rejects.toThrow('Relation not found');
            await expect(model.insertRelation('invalidRelation')).rejects.toThrow('Relation not found');
            await expect(model.updateRelation('invalidRelation')).rejects.toThrow('Relation not found');
            await expect(model.deleteRelation('invalidRelation')).rejects.toThrow('Relation not found');
        });
    });

    describe('Relations', () => {
        beforeEach(() => {
            model.addRelation('testRelation', 'relation_table', 'modelField', 'relatedField');
        });

        test('should add a relation', () => {
            expect(model.relations['testRelation']).toBeDefined();
        });

        test('should insert relation data', async () => {
            const relation = model.relations['testRelation'];
            relation.insert = jest.fn().mockResolvedValue();

            await model.insertRelation('testRelation', { relatedField: 'value' });

            expect(relation.insert).toHaveBeenCalledWith({ relatedField: 'value' });
        });

        test('should delete relation data', async () => {
            const relation = model.relations['testRelation'];
            relation.delete = jest.fn().mockResolvedValue();

            await model.deleteRelation('testRelation', { relatedField: 'value' });

            expect(relation.delete).toHaveBeenCalledWith({ relatedField: 'value' });
        });

        test('should get relation data', async () => {
            const relation = model.relations['testRelation'];
            relation.get = jest.fn().mockResolvedValue();

            await model.getRelation('testRelation');

            expect(relation.get).toHaveBeenCalled();
        });

        test('should update relation data', async () => {
            const relation = model.relations['testRelation'];
            relation.update = jest.fn().mockResolvedValue();

            await model.updateRelation('testRelation', { relatedField: 'value' }, { relatedField: 'newValue' });

            expect(relation.update).toHaveBeenCalledWith({ relatedField: 'value' }, { relatedField: 'newValue' });
        });
    });
});
