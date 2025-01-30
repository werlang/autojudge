import User from '../../../model/user.js';
import bcrypt from 'bcrypt';
import Db from '../../../helpers/mysql.js';

jest.mock('bcrypt');
jest.mock('../../../helpers/mysql.js');

describe('User Class', () => {
    let user;
    const sampleData = {
        google_id: 'google123',
        email: 'test@example.com',
        password: 'password123',
        name: 'John',
        last_name: 'Doe',
        picture: 'http://example.com/picture.jpg',
    };

    beforeEach(() => {
        bcrypt.hashSync.mockImplementation((password) => `hashed_${password}`);
        user = new User(sampleData);
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        test('should create a User instance with hashed password', () => {
            expect(user).toBeInstanceOf(User);
            expect(user.google_id).toBe(sampleData.google_id);
            expect(user.email).toBe(sampleData.email);
            expect(user.password).toBe(`hashed_${sampleData.password}`);
            expect(user.name).toBe(sampleData.name);
            expect(user.last_name).toBe(sampleData.last_name);
            expect(user.picture).toBe(sampleData.picture);
        });

        test('should create a User instance without password', () => {
            const dataWithoutPassword = { ...sampleData, password: null };
            user = new User(dataWithoutPassword);
            expect(user.password).toBeNull();
        });

        test('should create a User instance without google_id and picture', () => {
            const dataWithoutGoogleIdAndPicture = { ...sampleData, google_id: null, picture: null };
            user = new User(dataWithoutGoogleIdAndPicture);
            expect(user.google_id).toBeNull();
            expect(user.picture).toBeNull();
        });
    });

    describe('updatePassword', () => {
        test('should update the user password', async () => {
            const newPassword = 'newPassword123';
            bcrypt.hash.mockResolvedValue(`hashed_${newPassword}`);
            user.update = jest.fn().mockResolvedValue();

            await user.updatePassword(newPassword);

            expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
            expect(user.update).toHaveBeenCalledWith({ password: `hashed_${newPassword}` });
        });

        test('should throw an error if password hashing fails', async () => {
            const newPassword = 'newPassword123';
            bcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

            await expect(user.updatePassword(newPassword)).rejects.toThrow('Hashing failed');
        });
    });

    describe('Database operations', () => {
        test('should insert user data into the database', async () => {
            Db.insert.mockResolvedValue([{ insertId: 1 }]);
            Db.find.mockResolvedValue([sampleData]);

            await user.insert();

            expect(Db.insert).toHaveBeenCalledWith('users', {
                google_id: sampleData.google_id,
                email: sampleData.email,
                password: `hashed_${sampleData.password}`,
                name: sampleData.name,
                last_name: sampleData.last_name,
                picture: sampleData.picture,
            });
            expect(user.id).toBe(1);
        });

        test('should update user data in the database', async () => {
            const updatedData = { email: 'new@example.com', name: 'Jane' };
            Db.update.mockResolvedValue();
            Db.find.mockResolvedValue([{ ...sampleData, ...updatedData }]);

            user.id = 1;
            await user.update(updatedData);

            expect(Db.update).toHaveBeenCalledWith('users', updatedData, user.id);
            expect(user.email).toBe(updatedData.email);
            expect(user.name).toBe(updatedData.name);
        });

        test('should delete user data from the database', async () => {
            Db.delete.mockResolvedValue();

            await user.delete();

            expect(Db.delete).toHaveBeenCalledWith('users', user.id);
        });
    });

    describe('Edge cases', () => {
        test('should throw an error if email is invalid', async () => {
            const invalidEmailData = { ...sampleData, email: 'invalidEmail' };
            user = new User(invalidEmailData);

            await expect(user.insert()).rejects.toThrow('Invalid email');
        });
    });
});
