import jwt from 'jsonwebtoken';
import request from 'supertest';
import { OAuth2Client } from 'google-auth-library';
import MysqlConnector from './mysqlConnector.js';
import app from '../../app.js';

jest.mock('jsonwebtoken');
jest.mock('google-auth-library');

describe('Login route', () => {
    const token = 'valid_token';
    const user = {
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password',
    }
    let requestInstance;

    beforeAll(async () => {
        jwt.verify.mockImplementation(() => ({ user: user.email }));
        jwt.sign.mockReturnValue(token);
        OAuth2Client.prototype.verifyIdToken.mockResolvedValue({ getPayload: () => ({
            sub: 'google123',
            email: user.email,
            given_name: user.name,
            family_name: user.lastName,
            picture: 'https://example.com/picture.jpg',
        })});

        requestInstance = request(app);
        await MysqlConnector.connect();
        // await MysqlConnector.bootstrap('./path/to/your/sql/file.sql'); // Adjust the path to your SQL file
    });

    afterAll(async () => {
        await MysqlConnector.close();
    });

    beforeEach(async () => {
        await MysqlConnector.cleanup();
    });

    async function insertUser(user = {}) {
        return await requestInstance
            .post(`/login/register`)
            .set('Content-Type', 'application/json')
            .send(user);
    }

    async function googleLogin() {
        return await requestInstance
            .post(`/login/google`)
            .set('Authorization', `Bearer ${token}`)
            .set('Content-Type', 'application/json')
            .send();
    }

    async function login(user = {}) {
        return await requestInstance
            .post(`/login`)
            .set('Content-Type', 'application/json')
            .send(user);
    }

    async function getUserData(token) {
        return await requestInstance
            .get(`/login/user`)
            .set('Authorization', `Bearer ${token}`)
            .send();
    }

    describe('Insert user', () => {

        test('should create a new user using email and password', async () => {
            const res = await insertUser(user);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('User created.');
            expect(res.body.user.email).toBe(user.email);
        });

        test.each([
            ['password', 'name', 'lastName'],
            ['email', 'name', 'lastName'],
            ['email', 'password', 'lastName'],
            ['email', 'password', 'name'],
        ])('should throw an error if missing required fields', async (...fields) => {
            const body = Object.fromEntries(fields.map(field => [field, user[field]]));
            const res = await insertUser(body);

            expect(res.status).toBe(400);
            expect(['Email and password are required.', 'Missing required fields']).toContain(res.body.message);
        });

        test('should throw an error if user already exists', async () => {
            await insertUser(user);
            const res = await insertUser(user);

            expect(res.status).toBe(409);
            expect(res.body.message).toBe('User already exists');
        });

        test('should register a user with google credentials', async () => {
            const res = await googleLogin(user);

            expect(res.body.message).toBe('User created.');
            expect(res.status).toBe(201);
            expect(res.body.user.email).toBe(user.email);
        });

        test('should update the password for an existing user without password', async () => {
            await googleLogin(); // register user
            const res = await insertUser(user);

            expect(res.body.message).toBe('Password updated.');
            expect(res.status).toBe(200);
            expect(res.body.user.password).toBeUndefined();
        });
    });

    describe('Login user', () => {
        test('should log with google providing token', async () => {
            await googleLogin(); // register user
            const res = await googleLogin();

            expect(res.status).toBe(200);
            expect(res.body.user).toMatchObject({
                email: user.email,
                name: user.name,
                lastName: user.lastName,
                picture: 'https://example.com/picture.jpg',
            });
        });

        test('should log with email and password', async () => {
            await insertUser(user);
            const res = await login(user);

            expect(res.status).toBe(200);
            expect(res.body.user).toMatchObject({
                email: user.email,
                name: user.name,
                lastName: user.lastName,
                token,
            });
        });

        test('should throw an error if password is incorrect', async () => {
            await insertUser(user);
            const res = await login({ ...user, password: 'wrong_password' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid password');
        });

        test('should throw an error if user does not exist', async () => {
            const res = await login(user);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('User not found');
        });

        test('should throw an error if password is not set', async () => {
            await googleLogin(); // register user
            const res = await login(user);

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Password not set. Please use the register endpoint.');
        });

        test('should get user data from token', async () => {
            await insertUser(user);
            const res = await getUserData(token);

            expect(res.status).toBe(200);
            expect(res.body.user).toMatchObject({
                email: user.email,
                name: user.name,
                lastName: user.lastName,
            });
        });

        test('should throw an error if token is invalid while getting user data', async () => {
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token') });

            await insertUser(user);
            const res = await getUserData(token);

            expect(res.status).toBe(401);
            expect(res.body.message).toContain('Invalid token');
        });
    });

});
