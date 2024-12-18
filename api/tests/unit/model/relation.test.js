import Relation from '../../../model/relation.js';
import Db from '../../../helpers/mysql.js';
import CustomError from '../../../helpers/error.js';

jest.mock('../../../helpers/mysql.js');

describe('Relation Class', () => {
    let relation;
    const relationData = {
        tableName: 'test_relation_table',
        nativeFields: { modelField: 1 },
        relatedField: 'relatedField',
    };

    beforeEach(() => {
        relation = new Relation(
            relationData.tableName,
            relationData.nativeFields,
            relationData.relatedField
        );
    });

    test('should create a Relation instance', () => {
        expect(relation).toBeInstanceOf(Relation);
        expect(relation.tableName).toBe(relationData.tableName);
        expect(relation.nativeObject).toEqual(relationData.nativeFields);
        expect(relation.relatedField).toBe(relationData.relatedField);
    });

    test('should check if relation exists', async () => {
        const mockData = [{ modelField: 1, relatedField: 2 }];
        Db.find.mockResolvedValue(mockData);

        const exists = await relation.check(2);

        expect(Db.find).toHaveBeenCalledWith(relationData.tableName, { filter: relationData.nativeFields });
        expect(exists).toBe(true);
    });

    test('should return false if relation does not exist', async () => {
        Db.find.mockResolvedValue([]);

        const exists = await relation.check(2);

        expect(Db.find).toHaveBeenCalledWith(relationData.tableName, { filter: relationData.nativeFields });
        expect(exists).toBe(false);
    });

    test('should insert relation data', async () => {
        const value = 2;
        Db.insert.mockResolvedValue([{ insertId: 1 }]);
        Db.find.mockResolvedValue([]);

        await relation.insert(value);

        const expectedData = {
            ...relation.nativeObject,
            [relation.relatedField]: value,
        };

        expect(Db.insert).toHaveBeenCalledWith(relationData.tableName, expectedData);
    });

    test('should throw error when inserting existing relation', async () => {
        const value = 2;
        Db.find.mockResolvedValue([{ modelField: 1, relatedField: 2 }]);

        await expect(relation.insert(value)).rejects.toThrow('Relation already exists.');
    });

    test('should delete relation data', async () => {
        const value = 2;
        Db.delete.mockResolvedValue();
        Db.find.mockResolvedValue([{ modelField: 1, relatedField: 2 }]);

        await relation.delete(value);

        const expectedClause = {
            ...relation.nativeObject,
            [relation.relatedField]: value,
        };

        expect(Db.delete).toHaveBeenCalledWith(relationData.tableName, expectedClause);
    });

    test('should throw error when deleting non-existing relation', async () => {
        const value = 2;
        Db.find.mockResolvedValue([]);

        await expect(relation.delete(value)).rejects.toThrow('Relation does not exist.');
    });

    test('should get relation data', async () => {
        const mockData = [
            { modelField: 1, relatedField: 2, extraField: 'value1' },
            { modelField: 1, relatedField: 3, extraField: 'value2' },
        ];
        Db.find.mockResolvedValue(mockData);

        const result = await relation.get();

        const expectedFilter = relation.nativeObject;

        expect(Db.find).toHaveBeenCalledWith(relationData.tableName, { filter: expectedFilter });
        expect(result).toEqual(mockData);
    });

    test('should update relation data', async () => {
        const value = 2;
        const data = { extraField: 'updatedValue', fooField: undefined };
        Db.update.mockResolvedValue();
        Db.find.mockResolvedValue([{ modelField: 1, relatedField: 2 }]);

        await relation.update(value, data);

        const expectedData = data;
        const expectedClause = {
            ...relation.nativeObject,
            [relation.relatedField]: value,
        };

        expect(Db.update).toHaveBeenCalledWith(relationData.tableName, expectedData, expectedClause);
    });

    test('should throw error when updating non-existing relation', async () => {
        const value = 2;
        const data = { extraField: 'updatedValue' };
        Db.find.mockResolvedValue([]);

        await expect(relation.update(value, data)).rejects.toThrow('Relation does not exist.');
    });

    test('should throw error when updating without related field', async () => {
        const value = { extraField: 'value' };
        const data = { extraField: 'updatedValue' };

        await expect(relation.update(value, data)).rejects.toThrow(CustomError);
    });
});
