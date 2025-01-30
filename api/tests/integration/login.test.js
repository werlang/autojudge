import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import MysqlConnector from './mysqlConnector.js';
import User from './model/user.js';
import fs from 'fs';

jest.mock('jsonwebtoken');
jest.mock('google-auth-library');

describe('Login route', () => {
    const token = 'valid_token';
    let user;
    let connector;
    let sqlFile = fs.readFileSync('tests/integration/database-test.sql', 'utf8');

    beforeAll(async () => {
        user = {
            name: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password',
        };
        
        jwt.verify.mockImplementation(() => ({ user: user.email }));
        jwt.sign.mockReturnValue(token);
        OAuth2Client.prototype.verifyIdToken.mockResolvedValue({ getPayload: () => ({
            sub: 'google123',
            email: user.email,
            given_name: user.name,
            family_name: user.lastName,
            picture: 'https://example.com/picture.jpg',
        })});
    });

    beforeEach(async () => {
        connector = await new MysqlConnector({ sqlFile }).bootstrap();
    });

    afterEach(async () => {
        await connector.destroy();
    });
    
    afterAll(async () => {
    });

    describe('Insert user', () => {

        test('should create a new user using email and password', async () => {
            const res = await new User(user).insert();

            expect(res.body.message).toBe('User created.');
            expect(res.status).toBe(201);
            expect(res.body.user.email).toBe(user.email);
        });

        test('should throw an error if email is invalid', async () => {
            const res = await new User({ ...user, email: 'invalid_email' }).insert();

            expect(res.body.message).toBe('Invalid email');
            expect(res.status).toBe(400);
        });

        test.each([
            ['password', 'name', 'lastName'],
            ['email', 'name', 'lastName'],
            ['email', 'password', 'lastName'],
            ['email', 'password', 'name'],
        ])('should throw an error if missing required fields', async (...fields) => {
            const body = Object.fromEntries(fields.map(field => [field, user[field]]));
            const res = await new User(user).insert(body);

            expect(res.status).toBe(400);
            expect(['Email and password are required.', 'Missing required fields']).toContain(res.body.message);
        });

        test('should throw an error if user already exists', async () => {
            await new User(user).insert();
            const res = await new User(user).insert();

            expect(res.body.message).toBe('User already exists');
            expect(res.status).toBe(409);
        });

        test('should register a user with google credentials', async () => {
            const res = await new User(user, token).googleLogin();

            expect(res.body.message).toBe('User created.');
            expect(res.status).toBe(201);
            expect(res.body.user.email).toBe(user.email);
        });

        test('should update the password for an existing user without password', async () => {
            await new User(user, token).googleLogin(); // register user
            const res = await new User(user).insert();

            expect(res.body.message).toBe('Password updated.');
            expect(res.status).toBe(200);
            expect(res.body.user.password).toBeUndefined();
        });

    });

    describe('Login user', () => {
        test('should log with google providing token', async () => {
            await new User(user, token).googleLogin(); // register user
            const res = await new User(user, token).googleLogin();

            expect(res.status).toBe(200);
            expect(res.body.user).toMatchObject({
                email: user.email,
                name: user.name,
                lastName: user.lastName,
                picture: 'https://example.com/picture.jpg',
            });
        });

        test('should log with email and password', async () => {
            await new User(user).insert();
            const res = await new User(user).login();

            expect(res.status).toBe(200);
            expect(res.body.user).toMatchObject({
                email: user.email,
                name: user.name,
                lastName: user.lastName,
                token,
            });
        });

        test('should throw an error if password is incorrect', async () => {
            await new User(user).insert();
            const res = await new User(user).login({ email: user.email, password: 'wrong_password' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid password');
        });

        test('should throw an error if user does not exist', async () => {
            const res = await new User(user).login();

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('User not found');
        });

        test('should throw an error if password is not set', async () => {
            await new User(user, token).googleLogin(); // register user
            const res = await new User(user).login();

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Password not set. Please use the register endpoint.');
        });

        test('should get user data from token', async () => {
            await new User(user).insert();
            const res = await new User(user, token).get();

            expect(res.status).toBe(200);
            expect(res.body.user).toMatchObject({
                email: user.email,
                name: user.name,
                lastName: user.lastName,
            });
        });

        test('should throw an error if token is invalid while getting user data', async () => {
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token') });

            await new User(user).insert();
            const res = await new User(user, token).get();

            expect(res.status).toBe(401);
            expect(res.body.message).toContain('Invalid token');
        });

        test('should throw an error if email is missing', async () => {
            const res = await new User({
                password: 'password',
            }).login();

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email and password are required.');
        });

        test('should throw an error if password is missing', async () => {
            const res = await new User({
                email: 'test@example.com',
            }).login();

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email and password are required.');
        });
    });

});
