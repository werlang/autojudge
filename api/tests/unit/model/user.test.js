import User from '../../../model/user.js';
import Db from '../../../helpers/mysql.js';
import bcrypt from 'bcrypt';

jest.mock('../../../helpers/mysql.js');
jest.mock('bcrypt');

describe('User Class', () => {
    let user;
    const sampleData = {
        google_id: 'google123',
        email: 'test@example.com',
        password: 'password123',
        name: 'John',
        last_name: 'Doe',
        picture: 'profile.jpg',
    };

    beforeEach(() => {
        bcrypt.hashSync.mockReturnValue('hashedPassword');
        user = new User(sampleData);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should create a User instance with provided data', () => {
        expect(user).toBeInstanceOf(User);
        expect(user.google_id).toBe(sampleData.google_id);
        expect(user.email).toBe(sampleData.email);
        expect(user.password).toBe('hashedPassword');
        expect(user.name).toBe(sampleData.name);
        expect(user.last_name).toBe(sampleData.last_name);
        expect(user.picture).toBe(sampleData.picture);
    });

    test('should create a User instance with null fields', () => {
        const newSampleData = {
            ...sampleData,
            google_id: null,
            password: null,
            picture: null
        };
        const user = new User(newSampleData);

        expect(user.google_id).toBe(null);
        expect(user.password).toBe(null);
        expect(user.picture).toBe(null);
    });

    test('should insert user data into the database and set user id', async () => {
        const insertId = 1;
        Db.insert.mockResolvedValue([{ insertId }]);
        Db.find.mockResolvedValue([{ ...sampleData, id: insertId }]);

        await user.insert();

        expect(Db.insert).toHaveBeenCalledWith('users', {
            google_id: sampleData.google_id,
            email: sampleData.email,
            password: 'hashedPassword',
            name: sampleData.name,
            last_name: sampleData.last_name,
            picture: sampleData.picture,
        });
        expect(user.id).toBe(insertId);
    });

    test('should get user data by id from the database', async () => {
        const userId = 1;
        Db.find.mockResolvedValue([{ ...sampleData, id: userId }]);
        user.id = userId;

        await user.get();

        expect(Db.find).toHaveBeenCalledWith('users', { filter: { id: userId } });
        expect(user.google_id).toBe(sampleData.google_id);
        expect(user.email).toBe(sampleData.email);
        expect(user.name).toBe(sampleData.name);
        expect(user.last_name).toBe(sampleData.last_name);
        expect(user.picture).toBe(sampleData.picture);
    });

    test('should update user data in the database', async () => {
        const updatedData = { email: 'new@example.com', name: 'Jane' };
        const userId = 1;
        Db.update.mockResolvedValue();
        Db.find.mockResolvedValue([{ ...sampleData, ...updatedData, id: userId }]);
        user.id = userId;

        await user.update(updatedData);

        expect(Db.update).toHaveBeenCalledWith('users', updatedData, userId);
        expect(user.email).toBe(updatedData.email);
        expect(user.name).toBe(updatedData.name);
    });

    test('should delete user data from the database', async () => {
        const userId = 1;
        Db.delete.mockResolvedValue();
        user.id = userId;

        await user.delete();

        expect(Db.delete).toHaveBeenCalledWith('users', userId);
    });

    test('should update user password in the database', async () => {
        const newPassword = 'newPassword123';
        const newHashedPassword = 'newHashedPassword';
        const userId = 1;
        bcrypt.hash.mockResolvedValue(newHashedPassword);
        Db.update.mockResolvedValue();
        Db.find.mockResolvedValue([{ ...sampleData, password: newHashedPassword, id: userId }]);
        user.id = userId;

        await user.updatePassword(newPassword);

        expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
        expect(Db.update).toHaveBeenCalledWith('users', { password: newHashedPassword }, userId);
        expect(user.password).toBe(newHashedPassword);
    });
});
