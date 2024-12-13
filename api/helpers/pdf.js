import fs from 'fs';
import { Chromiumly, HtmlConverter, PDFEngines } from "chromiumly";
import katex from 'katex';

export default class PDFUtils {

    constructor(args) {
        for (const key in args) {
            this[key] = args[key];
        }

        if (!this.problem || !this.problem.description) {
            throw new Error('Problem description is required.');
        }

        if (!this.args) this.args = {};

        // replace problem description math tags with rendered math
        this.problem.description = this.problem.description.replace(/\$(.*?)\$/gm, (_, match) => katex.renderToString(match, { throwOnError: false }));
    }

    // method to merge pdfs from buffers
    static async merge(pdfs) {
        if (!pdfs || !pdfs.length) {
            throw new Error('No PDFs to merge');
        }
        return PDFEngines.merge({
            files: [...pdfs],
            pdfUA: true,
        });
    }

    // Function to convert image URL to Base64
    async convertImageToBase64(url) {
        try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType = response.headers.get('content-type');
            return `data:${mimeType};base64,${base64}`;
        }
        catch (err) {
            // console.log(err);
            // placeholder image if the image cannot be loaded
            return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjOHPmzH8ACDADZKt3GNsAAAAASUVORK5CYII=`;
        }
    }

    // Function to extract <img> src attributes and replace them with Base64 asynchronously
    async convertImagesToBase64UsingRegex(htmlContent) {
        // Regular expression to match all <img> tags and extract their src attributes
        const imgRegex = /<img\s+[^>]*src="([^">]+)"[^>]*>/g;

        // Array to hold all found image src and their replacements
        const imagesToConvert = [];

        // Find all <img> tags and src values
        let match;
        while ((match = imgRegex.exec(htmlContent)) !== null) {
            const src = match[1]; // Capture the src
            if (src && !src.startsWith('data:')) {
                imagesToConvert.push({ src, match: match[0] });
            }
        }

        // Convert each found src to Base64 and store the replacement in parallel
        const images = await Promise.all(imagesToConvert.map(async img => {
            try {
                const base64Data = await this.convertImageToBase64(img.src);
                return { match: img.match, replacement: img.match.replace(img.src, base64Data) };
            } catch (err) {
                // console.log(err);
                return { match: img.match, replacement: img.match.replace(img.src, '') };
            }
        }));
        
        images.forEach(({ match, replacement }) => {
            htmlContent = htmlContent.replace(match, replacement);
        });

        return htmlContent;
    }

    async replaceText(text) {
        let template = text.replace(/{{problem.title}}/g, this.problem.title || '');
        template = template.replace(/{{problem.description}}/g, this.problem.description || '');
        template = template.replace(/{{problem.hash}}/g, process.env.HASH_LENGTH === 'null' ? '' : this.problem.hash?.slice(-process.env.HASH_LENGTH)) || '';
        template = template.replace(/{{logo-autojudge}}/g, `http://web:3000/assets/img/autojudge.webp`);
        template = template.replace(/{{production-domain}}/g, process.env.PRODUCTION_DOMAIN === 'null' ? '' : process.env.PRODUCTION_DOMAIN);

        // generate the table with the input and output
        const inputList = JSON.parse(this.problem.input_public || '[]');
        const outputList = JSON.parse(this.problem.output_public || '[]');
        const rows = inputList.map((input, i) => `<tr>
            <td>${input}</td>
            <td>${outputList[i]}</td>
        </tr>`).join('');
        template = template.replace('{{problem.io}}', rows);
    
        // replace the body args
        for (const key in this.args) {
            template = template.replace(new RegExp(`{{${key}}}`, 'g'), this.args[key] || '');
        }

        if (!this.args['custom-logo']) {
            template = template.replace(/{{custom-logo}}/g, ``);
        }

        // Convert all external image URLs in the template to Base64 using regex
        template = await this.convertImagesToBase64UsingRegex(template);

        return template;
    }

    async getReplacedBuffer(path, problem, args) {
        this.problem = problem || this.problem;
        this.args = args || this.args;
        try {
            const file = fs.readFileSync(path, 'utf8');
            const replacedFile = await this.replaceText(file);
            const transformedBuffer = Buffer.from(replacedFile);
            return transformedBuffer;
        } catch (err) {
            // console.error(`Error reading file at ${path}:`, err);
            throw new Error('File not found');
        }
    }

    async create() {
        if (!this.template || !this.header || !this.footer) {
            throw new Error('Template, header, and footer path are required.');
        }
        const templateFS = await this.getReplacedBuffer(this.template);
        const headerFS = await this.getReplacedBuffer(this.header);
        const footerFS = await this.getReplacedBuffer(this.footer);

        Chromiumly.configure({ endpoint: process.env.GOTENBERG_SERVER });
        const htmlConverter = new HtmlConverter();
        return htmlConverter.convert({
            html: templateFS,
            header: headerFS,
            footer: footerFS,
        });
    }
}