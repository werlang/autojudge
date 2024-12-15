import Problem from '../../../model/problem.js';
import Db from '../../../helpers/mysql.js';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../../../helpers/mysql.js');
jest.mock('fs');
jest.mock('sharp');
jest.mock('uuid');

describe('Problem Class', () => {
    let problem;
    const sampleData = {
        id: 1,
        hash: 'sampleHash',
        title: 'Sample Problem',
        description: 'This is a sample problem.',
        input_public: 'Sample input',
        output_public: 'Sample output',
        input_hidden: 'Hidden input',
        output_hidden: 'Hidden output',
        solution: 'Sample solution',
        author: 1,
        language: 'JavaScript',
        is_public: 1,
    };

    beforeEach(() => {
        problem = new Problem(sampleData);
        jest.clearAllMocks();
    });

    test('should create a Problem instance', () => {
        expect(problem).toBeInstanceOf(Problem);
        expect(problem.title).toBe(sampleData.title);
        expect(problem.description).toBe(sampleData.description);
        expect(problem.author).toBe(sampleData.author);
        expect(problem.language).toBe(sampleData.language);
    });

    describe('getAll', () => {
        test('should return all problems', async () => {
            const problems = [sampleData];
            Db.find.mockResolvedValue(problems);

            const result = await Problem.getAll({});

            expect(Db.find).toHaveBeenCalledWith('problems', { filter: {} });
            expect(result).toEqual(problems);
        });
    });

    describe('get', () => {
        test('should get problem data by id', async () => {
            Db.find.mockResolvedValue([sampleData]);

            await problem.get();

            expect(Db.find).toHaveBeenCalledWith('problems', { filter: { id: problem.id } });
            expect(problem.title).toBe(sampleData.title);
            expect(problem.description).toBe(sampleData.description);
        });

        test('should get problem data by hash', async () => {
            problem.id = null;
            Db.find.mockResolvedValue([sampleData]);

            await problem.get();

            expect(Db.find).toHaveBeenCalledWith('problems', { filter: { hash: problem.hash } });
            expect(problem.title).toBe(sampleData.title);
            expect(problem.description).toBe(sampleData.description);
        });

        test('should throw error if id or hash is not provided', async () => {
            problem.id = null;
            problem.hash = null;

            await expect(problem.get()).rejects.toThrow('ID or hash is required');
        });
    });

    describe('insert', () => {
        test('should insert problem data into the database', async () => {
            uuidv4.mockReturnValue('newHash');
            Db.insert.mockResolvedValue([{ insertId: 1 }]);
            Db.find.mockResolvedValue([{ ...sampleData, id: 1, hash: 'newHash' }]);

            await problem.insert();

            expect(uuidv4).toHaveBeenCalled();
            expect(Db.insert).toHaveBeenCalledWith('problems', {
                title: sampleData.title,
                description: sampleData.description,
                author: sampleData.author,
                language: sampleData.language,
                hash: 'newHash',
                is_public: sampleData.is_public,
            });
            expect(problem.id).toBe(1);
            expect(problem.hash).toBe('newHash');
        });
    });

    describe('saveImage', () => {
        const setupMocks = (imageData, imgId) => {
            const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            uuidv4.mockReturnValue(imgId);
            sharp.mockReturnValue({
                resize: jest.fn().mockReturnThis(),
                toFormat: jest.fn().mockReturnThis(),
                toFile: jest.fn().mockResolvedValue(),
            });
            return buffer;
        };

        test('should save image and return image id', async () => {
            const imageData = 'data:image/png;base64,sampleImageData';
            const imgId = 'newImageId';
            const buffer = setupMocks(imageData, imgId);

            const result = await problem.saveImage(imageData);

            expect(uuidv4).toHaveBeenCalled();
            expect(sharp).toHaveBeenCalledWith(buffer);
            expect(result).toBe(imgId);
        });

        test('should throw error if image data is not provided', async () => {
            await expect(problem.saveImage(null)).rejects.toThrow('Image is required.');
        });

        test('should save image without data:image prefix', async () => {
            const imageData = 'sampleImageData';
            const imgId = 'newImageId';
            const buffer = setupMocks(imageData, imgId);

            const result = await problem.saveImage(imageData);

            expect(uuidv4).toHaveBeenCalled();
            expect(sharp).toHaveBeenCalledWith(buffer);
            expect(result).toBe(imgId);
        });

        test('should use directory if it exists', async () => {
            const imageData = 'data:image/png;base64,sampleImageData';
            const imgId = 'newImageId';
            setupMocks(imageData, imgId);
            fs.existsSync.mockReturnValue(true);

            await problem.saveImage(imageData);

            expect(fs.existsSync).toHaveBeenCalledWith(`upload/problem/${problem.id}/`);
        });
    });

    describe('getImage', () => {
        test('should return image buffer if image exists', () => {
            const imgId = 'imageId';
            const buffer = Buffer.from('imageData');
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(buffer);

            const result = problem.getImage(imgId);

            expect(fs.existsSync).toHaveBeenCalledWith(`upload/problem/${problem.id}/${imgId}`);
            expect(fs.readFileSync).toHaveBeenCalledWith(`upload/problem/${problem.id}/${imgId}`);
            expect(result).toBe(buffer);
        });

        test('should throw error if image does not exist', () => {
            const imgId = 'imageId';
            fs.existsSync.mockReturnValue(false);

            expect(() => problem.getImage(imgId)).toThrow('Image not found');
        });
    });

    describe('removeImage', () => {
        test('should remove image if it exists', () => {
            const imgId = 'imageId';
            fs.existsSync.mockReturnValue(true);
            fs.unlinkSync.mockReturnValue();

            problem.removeImage(imgId);

            expect(fs.existsSync).toHaveBeenCalledWith(`upload/problem/${problem.id}/${imgId}`);
            expect(fs.unlinkSync).toHaveBeenCalledWith(`upload/problem/${problem.id}/${imgId}`);
        });

        test('should throw error if image does not exist', () => {
            const imgId = 'imageId';
            fs.existsSync.mockReturnValue(false);

            expect(() => problem.removeImage(imgId)).toThrow('Image not found');
        });
    });
});
