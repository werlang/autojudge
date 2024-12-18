import request from 'supertest';

const serviceUrl = 'http://api:3000'; // Replace with the actual service URL

describe('Problem Route', () => {
    let token;

    beforeAll(async () => {
        token = 'Bearer valid_token';
    });

    describe('POST /', () => {
        test('should create a new problem', async () => {
            const response = await request(serviceUrl)
                .post('/problem')
                .set('Authorization', token)
                .send({
                    title: 'Test Problem',
                    description: 'Test Description',
                    public: true,
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Problem created.');
            expect(response.body.problem.title).toBe('Test Problem');
        });

        test('should return 400 if title is missing', async () => {
            const response = await request(serviceUrl)
                .post('/problem')
                .set('Authorization', token)
                .send({ description: 'Test Description' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Title is required.');
        });
    });

    describe('GET /', () => {
        test('should get all problems', async () => {
            const response = await request(serviceUrl).get('/problem');

            expect(response.status).toBe(200);
            expect(response.body.problems.length).toBeGreaterThan(0);
        });
    });

    describe('GET /:hash', () => {
        test('should get a problem by hash', async () => {
            const response = await request(serviceUrl).get('/problem/somehash');

            expect(response.status).toBe(200);
            expect(response.body.problem.title).toBe('Some Problem Title');
        });

        test('should return 404 if problem not found', async () => {
            const response = await request(serviceUrl).get('/problem/nonexistenthash');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Problem not found.');
        });

        test('should return 400 if hash is too short', async () => {
            const response = await request(serviceUrl).get('/problem/short');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Hash too short.');
        });
    });

    describe('PUT /:id', () => {
        test('should update a problem', async () => {
            const response = await request(serviceUrl)
                .put('/problem/someid')
                .set('Authorization', token)
                .send({ title: 'Updated Problem' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Problem updated.');
            expect(response.body.problem.title).toBe('Updated Problem');
        });

        test('should return 403 if user is not the author', async () => {
            const response = await request(serviceUrl)
                .put('/problem/someid')
                .set('Authorization', token)
                .send({ title: 'Updated Problem' });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('You are not allowed to update this problem.');
        });
    });

    describe('POST /:id/judge', () => {
        test('should add a new submission', async () => {
            const response = await request(serviceUrl)
                .post('/problem/someid/judge')
                .set('Authorization', token)
                .send({ code: 'print("Hello, World!")', filename: 'hello.py' });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Submission received');
            expect(response.body.submission.status).toBe('PENDING');
        });

        test('should return 403 if team already solved the problem', async () => {
            const response = await request(serviceUrl)
                .post('/problem/someid/judge')
                .set('Authorization', token)
                .send({ code: 'print("Hello, World!")', filename: 'hello.py' });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Team already solved this problem');
        });
    });

    describe('POST /:hash/pdf', () => {
        test('should create a PDF for a problem', async () => {
            const response = await request(serviceUrl)
                .post('/problem/somehash/pdf')
                .set('Authorization', token)
                .send({});

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });

        test('should return 404 if problem not found', async () => {
            const response = await request(serviceUrl)
                .post('/problem/nonexistenthash/pdf')
                .set('Authorization', token)
                .send({});

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Problem not found.');
        });
    });

    describe('POST /pdf', () => {
        test('should create a PDF for multiple problems', async () => {
            const response = await request(serviceUrl)
                .post('/problem/pdf')
                .set('Authorization', token)
                .send({ problems: ['hash1', 'hash2'] });

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });

        test('should return 404 if any problem not found', async () => {
            const response = await request(serviceUrl)
                .post('/problem/pdf')
                .set('Authorization', token)
                .send({ problems: ['nonexistenthash1', 'nonexistenthash2'] });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Problem not found.');
        });
    });

    describe('POST /:hash/images', () => {
        test('should upload an image for a problem', async () => {
            const response = await request(serviceUrl)
                .post('/problem/somehash/images')
                .set('Authorization', token)
                .send({ data: 'image_data' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Image uploaded.');
        });

        test('should return 404 if problem not found', async () => {
            const response = await request(serviceUrl)
                .post('/problem/nonexistenthash/images')
                .set('Authorization', token)
                .send({ data: 'image_data' });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Problem not found.');
        });
    });

    describe('GET /:hash/images/:id', () => {
        test('should get an image for a problem', async () => {
            const response = await request(serviceUrl).get('/problem/somehash/images/1');

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('image/webp');
        });

        test('should return 404 if problem not found', async () => {
            const response = await request(serviceUrl).get('/problem/nonexistenthash/images/1');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Problem not found.');
        });
    });

    describe('DELETE /:hash/images/:id', () => {
        test('should delete an image for a problem', async () => {
            const response = await request(serviceUrl)
                .delete('/problem/somehash/images/1')
                .set('Authorization', token);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Image deleted.');
        });

        test('should return 404 if problem not found', async () => {
            const response = await request(serviceUrl)
                .delete('/problem/nonexistenthash/images/1')
                .set('Authorization', token);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Problem not found.');
        });
    });
});
