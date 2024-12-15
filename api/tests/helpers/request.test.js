import Request from '../../helpers/request.js';

describe('Request Class', () => {
    let request;
    const url = 'http://example.com';
    const headers = { 'Authorization': 'Bearer token' };
    const timeout = 2000;

    beforeAll(() => {
        jest.spyOn(global, 'fetch');
    });

    beforeEach(() => {
        request = new Request({ url, headers, timeout });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        test('should initialize with given arguments', () => {
            expect(request.url).toBe(url);
            expect(request.headers.get('Authorization')).toBe(headers['Authorization']);
            expect(request.timeout).toBe(timeout);
        });

        test('should initialize with default timeout if not provided', () => {
            const defaultRequest = new Request({ url, headers });
            expect(defaultRequest.timeout).toBe(5000);
        });

        test('should initialize with empty headers if not provided', () => {
            const defaultRequest = new Request({ url });
            expect(defaultRequest.headers).toEqual(new Headers());
        });
    });

    describe('setHeader', () => {
        test('should set a header', () => {
            request.setHeader('Content-Type', 'application/json');
            expect(request.headers.get('Content-Type')).toBe('application/json');
        });
    });

    describe('setHeaders', () => {
        test('should set multiple headers', () => {
            const newHeaders = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
            request.setHeaders(newHeaders);
            expect(request.headers.get('Content-Type')).toBe('application/json');
            expect(request.headers.get('Accept')).toBe('application/json');
        });
    });

    describe('get', () => {
        test('should make a GET request with query parameters', async () => {
            const endpoint = 'test';
            const args = { param1: 'value1', param2: 'value2' };
            const responseData = { data: 'test' };
            fetch.mockResolvedValue({
                ok: true,
                text: jest.fn().mockResolvedValue(JSON.stringify(responseData)),
            });

            const result = await request.get(endpoint, args);
            expect(fetch).toHaveBeenCalledWith(`${url}/${endpoint}?param1=value1&param2=value2`, expect.any(Object));
            expect(result).toEqual(responseData);
        });

        test('should handle GET request errors', async () => {
            const endpoint = 'test';
            fetch.mockResolvedValue({
                ok: false,
                status: 404,
                text: jest.fn().mockResolvedValue('Not Found'),
            });

            await expect(request.get(endpoint)).rejects.toThrow('Not Found');
        });
    });

    describe('post', () => {
        test('should make a POST request with data', async () => {
            const endpoint = 'test';
            const args = { key: 'value' };
            const responseData = { data: 'test' };
            fetch.mockResolvedValue({
                ok: true,
                text: jest.fn().mockResolvedValue(JSON.stringify(responseData)),
            });

            const result = await request.post(endpoint, args);
            expect(fetch).toHaveBeenCalledWith(`${url}/${endpoint}`, expect.any(Object));
            expect(result).toEqual(responseData);
        });

        test('should handle POST request errors', async () => {
            const endpoint = 'test';
            fetch.mockResolvedValue({
                ok: false,
                status: 500,
                text: jest.fn().mockResolvedValue('Internal Server Error'),
            });

            await expect(request.post(endpoint)).rejects.toThrow('Internal Server Error');
        });
    });

    describe('request', () => {
        test('should handle JSON parse errors gracefully', async () => {
            const endpoint = 'test';
            fetch.mockResolvedValue({
                ok: true,
                text: jest.fn().mockResolvedValue('Invalid JSON'),
            });

            const result = await request.request('GET', endpoint);
            expect(result).toBe('Invalid JSON');
        });

        test('should handle request timeout', async () => {
            jest.useFakeTimers();
            const endpoint = 'test';
            fetch.mockImplementation(() => new Promise((_, reject) => {
                setTimeout(() => reject(new Error('AbortError')), timeout);
            }));

            const requestPromise = request.get(endpoint);
            jest.advanceTimersByTime(timeout);

            await expect(requestPromise).rejects.toThrow('AbortError');
            jest.useRealTimers();
        });

        test('should handle empty response body', async () => {
            const endpoint = 'test';
            fetch.mockResolvedValue({
                ok: true,
                text: jest.fn().mockResolvedValue(''),
            });

            const result = await request.request('GET', endpoint);
            expect(result).toBe('');
        });
    });
});
