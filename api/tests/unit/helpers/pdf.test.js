import PDFUtils from '../../../helpers/pdf.js';
import fs from 'fs';
import { Chromiumly, HtmlConverter, PDFEngines } from "chromiumly";
import katex from 'katex';

jest.mock('fs');
jest.mock('chromiumly');
jest.mock('katex');

describe('PDFUtils Class', () => {
    let pdfUtils;
    const sampleProblem = {
        title: 'Sample Problem',
        description: 'This is a sample problem with math $a^2 + b^2 = c^2$',
        hash: 'samplehash',
        input_public: JSON.stringify(['input1', 'input2']),
        output_public: JSON.stringify(['output1', 'output2']),
    };
    const sampleArgs = {
        'custom-logo': 'http://example.com/logo.png',
    };

    beforeAll(() => {
        katex.renderToString.mockImplementation(text => `<span>${text}</span>`);
        jest.spyOn(global, 'fetch');
    });

    beforeEach(() => {
        pdfUtils = new PDFUtils({ problem: sampleProblem, args: sampleArgs });
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        test('should initialize with given arguments', () => {
            expect(pdfUtils.problem).toEqual(sampleProblem);
            expect(pdfUtils.args).toEqual(sampleArgs);
        });

        test('should replace math tags with rendered math', () => {
            const instance = new PDFUtils({ problem: sampleProblem, args: sampleArgs });
            expect(instance.problem.description).toContain('<span>a^2 + b^2 = c^2</span>');
        });

        test('should throw error if problem data is missing', () => {
            expect(() => new PDFUtils({ args: sampleArgs })).toThrow('Problem description is required.');
        });

        test('should initialize with empty args if not provided', () => {
            const instance = new PDFUtils({ problem: sampleProblem });
            expect(instance.args).toEqual({});
        });
    });

    describe('merge', () => {
        test('should merge PDFs', async () => {
            PDFEngines.merge.mockResolvedValue('mergedPDF');
            const result = await PDFUtils.merge(['pdf1', 'pdf2']);
            expect(result).toBe('mergedPDF');
            expect(PDFEngines.merge).toHaveBeenCalledWith({ files: ['pdf1', 'pdf2'], pdfUA: true });
        });

        test('should handle empty PDF list', async () => {
            await expect(PDFUtils.merge([])).rejects.toThrow('No PDFs to merge');
        });

        test('should handle merging a single PDF file', async () => {
            PDFEngines.merge.mockResolvedValue('singlePDF');
            const result = await PDFUtils.merge(['pdf1']);
            expect(result).toBe('singlePDF');
            expect(PDFEngines.merge).toHaveBeenCalledWith({ files: ['pdf1'], pdfUA: true });
        });
    });

    describe('convertImageToBase64', () => {
        test('should convert image URL to Base64', async () => {
            const mockResponse = {
                arrayBuffer: jest.fn().mockResolvedValue('imageData'),
                headers: { get: jest.fn().mockReturnValue('image/png') },
            };
            fetch.mockResolvedValue(mockResponse);

            const result = await pdfUtils.convertImageToBase64('http://example.com/image.png');
            expect(result).toBe(`data:image/png;base64,${Buffer.from('imageData').toString('base64')}`);
        });

        test('should return placeholder image on error', async () => {
            fetch.mockRejectedValue(new Error('Fetch error'));
            const result = await pdfUtils.convertImageToBase64('http://example.com/image.png');
            expect(result).toContain('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjOHPmzH8ACDADZKt3GNsAAAAASUVORK5CYII=');
        });

        test('should handle invalid URL', async () => {
            fetch.mockRejectedValue(new Error('Invalid URL'));
            const result = await pdfUtils.convertImageToBase64('invalid-url');
            expect(result).toContain('data:image/png;base64');
        });

        test('should handle empty URL', async () => {
            const result = await pdfUtils.convertImageToBase64('');
            expect(result).toContain('data:image/png;base64');
        });
    });

    describe('convertImagesToBase64UsingRegex', () => {
        test('should convert all image URLs in HTML to Base64', async () => {
            const htmlContent = '<img src="http://example.com/image1.png"><img src="http://example.com/image2.png">';
            pdfUtils.convertImageToBase64 = jest.fn().mockResolvedValue('data:image/png;base64,base64data');

            const result = await pdfUtils.convertImagesToBase64UsingRegex(htmlContent);
            expect(result).toContain('data:image/png;base64,base64data');
            expect(pdfUtils.convertImageToBase64).toHaveBeenCalledTimes(2);
            expect(result).toBe('<img src="data:image/png;base64,base64data"><img src="data:image/png;base64,base64data">');
        });

        test('should handle errors during image conversion', async () => {
            const htmlContent = '<img src="http://example.com/image1.png">';
            pdfUtils.convertImageToBase64 = jest.fn().mockRejectedValue(new Error('Conversion error'));

            const result = await pdfUtils.convertImagesToBase64UsingRegex(htmlContent);
            expect(result).toContain('<img src="">');
        });

        test('should skip already base64 encoded images', async () => {
            const htmlContent = '<img src="data:image/png;base64,base64data">';
            pdfUtils.convertImageToBase64 = jest.fn();

            const result = await pdfUtils.convertImagesToBase64UsingRegex(htmlContent);
            expect(result).toBe(htmlContent);
            expect(pdfUtils.convertImageToBase64).not.toHaveBeenCalled();
        });

        test('should handle HTML content without images', async () => {
            const htmlContent = '<p>No images here</p>';
            const result = await pdfUtils.convertImagesToBase64UsingRegex(htmlContent);
            expect(result).toBe(htmlContent);
        });

        test('should handle multiple images with some failing conversions', async () => {
            const htmlContent = '<img src="http://example.com/image1.png"><img src="http://example.com/image2.png">';
            pdfUtils.convertImageToBase64 = jest.fn()
                .mockResolvedValueOnce('data:image/png;base64,image1data')
                .mockRejectedValueOnce(new Error('Conversion error'));

            const result = await pdfUtils.convertImagesToBase64UsingRegex(htmlContent);
            expect(result).toContain('data:image/png;base64,image1data');
            expect(result).toContain('<img src="">');
            expect(pdfUtils.convertImageToBase64).toHaveBeenCalledTimes(2);
            expect(result).toBe('<img src="data:image/png;base64,image1data"><img src="">');
        });
    });

    describe('replaceText', () => {
        test('should replace placeholders with problem and args data', async () => {
            const template = '{{problem.title}} {{problem.description}} {{problem.hash}} {{logo-autojudge}} {{production-domain}} {{problem.io}} {{custom-logo}}';
            const result = await pdfUtils.replaceText(template);

            expect(result).toContain(sampleProblem.title);
            expect(result).toContain(sampleProblem.description);
            expect(result).toContain(sampleProblem.hash.slice(-process.env.HASH_LENGTH));
            expect(result).toContain('http://web:3000/assets/img/autojudge.webp');
            expect(result).toContain(process.env.PRODUCTION_DOMAIN);
            expect(result.replace(/\s/g, '')).toContain('<tr><td>input1</td><td>output1</td></tr><tr><td>input2</td><td>output2</td></tr>');
            expect(result).toContain(sampleArgs['custom-logo']);
        });

        test('should handle missing custom logo', async () => {
            pdfUtils.args['custom-logo'] = null;
            const template = '{{custom-logo}}';
            const result = await pdfUtils.replaceText(template);
            expect(result).toBe('');
        });

        test('should handle missing environment variables', async () => {
            process.env.PRODUCTION_DOMAIN = null;
            process.env.HASH_LENGTH = null;
            const template = '{{production-domain}} {{problem.hash}}';
            const result = await pdfUtils.replaceText(template);
            expect(result.trim()).toBe('');
        });

        test('should convert external image URLs to Base64', async () => {
            const template = '<img src="http://example.com/image.png">';
            pdfUtils.convertImagesToBase64UsingRegex = jest.fn().mockResolvedValue('<img src="data:image/png;base64,base64data">');

            const result = await pdfUtils.replaceText(template);
            expect(result).toContain('data:image/png;base64,base64data');
        });

        test('should handle empty template gracefully', async () => {
            const template = '';
            const result = await pdfUtils.replaceText(template);
            expect(result).toBe('');
        });

        test('should handle undefined problem fields', async () => {
            pdfUtils.problem = {};
            const template = '{{problem.title}} {{problem.description}}';
            const result = await pdfUtils.replaceText(template);
            expect(result.trim()).toBe('');
        });

        test('should handle templates with unknown placeholders', async () => {
            const template = '{{unknown.placeholder}}';
            const result = await pdfUtils.replaceText(template);
            expect(result).toBe('{{unknown.placeholder}}');
        });
    });

    describe('getReplacedBuffer', () => {
        test('should return replaced buffer', async () => {
            fs.readFileSync.mockReturnValue('template content');
            pdfUtils.replaceText = jest.fn().mockResolvedValue('replaced content');

            const result = await pdfUtils.getReplacedBuffer('path/to/template', sampleProblem, sampleArgs);
            expect(result).toEqual(Buffer.from('replaced content'));
        });

        test('should throw error when file does not exist', async () => {
            fs.readFileSync.mockImplementation(() => { throw new Error('ENOENT: no such file or directory') });
            await expect(pdfUtils.getReplacedBuffer('nonexistent/path')).rejects.toThrow('File not found');
        });

        test('should handle empty content in template file', async () => {
            fs.readFileSync.mockReturnValue('');
            const result = await pdfUtils.getReplacedBuffer('path/to/template');
            expect(result).toEqual(Buffer.from(''));
        });
    });

    describe('create', () => {
        test('should create PDF with given template, header, and footer', async () => {
            pdfUtils.template = 'path/to/template';
            pdfUtils.header = 'path/to/header';
            pdfUtils.footer = 'path/to/footer';
            pdfUtils.getReplacedBuffer = jest.fn().mockResolvedValue(Buffer.from('buffer content'));

            Chromiumly.configure.mockReturnValue();
            HtmlConverter.mockImplementation(() => ({
                convert: jest.fn().mockResolvedValue('pdf content'),
            }));

            const result = await pdfUtils.create();
            expect(result).toBe('pdf content');
        });

        test('should throw error if template, header, or footer is missing', async () => {
            pdfUtils.template = null;
            await expect(pdfUtils.create()).rejects.toThrow('Template, header, and footer path are required.');
        });

        test('should handle conversion errors gracefully', async () => {
            pdfUtils.template = 'path/to/template';
            pdfUtils.header = 'path/to/header';
            pdfUtils.footer = 'path/to/footer';
            pdfUtils.getReplacedBuffer = jest.fn().mockResolvedValue(Buffer.from('buffer content'));

            Chromiumly.configure.mockReturnValue();
            HtmlConverter.mockImplementation(() => ({
                convert: jest.fn().mockRejectedValue(new Error('Conversion error')),
            }));

            await expect(pdfUtils.create()).rejects.toThrow('Conversion error');
        });

        test('should handle missing template file', async () => {
            pdfUtils.template = 'missing/template.html';
            pdfUtils.header = 'path/to/header';
            pdfUtils.footer = 'path/to/footer';
            fs.readFileSync.mockImplementation(() => { throw new Error('File not found') });
            await expect(pdfUtils.create()).rejects.toThrow('File not found');
        });

        test('should handle create when getReplacedBuffer returns empty content', async () => {
            pdfUtils.template = 'path/to/template';
            pdfUtils.header = 'path/to/header';
            pdfUtils.footer = 'path/to/footer';
            pdfUtils.getReplacedBuffer = jest.fn().mockResolvedValue(Buffer.from(''));
            Chromiumly.configure.mockReturnValue();
            HtmlConverter.mockImplementation(() => ({
                convert: jest.fn().mockResolvedValue('pdf content'),
            }));

            const result = await pdfUtils.create();
            expect(result).toBe('pdf content');
        });
    });
});
