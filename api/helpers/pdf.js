import fs from 'fs';
import { Transform } from 'stream';

export default {
    // Function to convert image URL to Base64
    convertImageToBase64: async function(url) {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = response.headers.get('content-type');
        return `data:${mimeType};base64,${base64}`;
    },

    // Function to extract <img> src attributes and replace them with Base64 asynchronously
    convertImagesToBase64UsingRegex: async function(htmlContent) {
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

        // Convert each found src to Base64 and store the replacement
        for (let img of imagesToConvert) {
            try {
                const base64Data = await this.convertImageToBase64(img.src);
                htmlContent = htmlContent.replace(img.match, img.match.replace(img.src, base64Data));
            } catch (err) {
                console.log(err);
                htmlContent = htmlContent.replace(img.match, img.match.replace(img.src, ''));
            }
        }

        return htmlContent;
    },

    // Helper function to stream content to a buffer
    streamToBuffer: function(stream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    },

    getTransform: function() {
        const self = this;

        return new Transform({
            async transform(chunk, encoding, callback) {
                // Convert the chunk to string, replace the desired text, and push the modified chunk
                let template = chunk.toString().replace(/{{title}}/g, self.problem.title);
                template = template.replace(/{{description}}/g, self.problem.description);
    
                // generate the table with the input and output
                const inputList = JSON.parse(self.problem.input_public);
                const outputList = JSON.parse(self.problem.output_public);
                const rows = inputList.map((input, i) => `<tr>
                    <td>${input}</td>
                    <td>${outputList[i]}</td>
                </tr>`).join('');
                template = template.replace('{{io}}', rows);
        
                // replace the body args
                for (const key in self.args) {
                    template = template.replace(new RegExp(`{{${key}}}`, 'g'), self.args[key]);
                }
    
                // Convert all external image URLs in the template to Base64 using regex
                template = await self.convertImagesToBase64UsingRegex(template);
                
                this.push(template);
                callback();
            }
        });
    },

    getReplacedBuffer: async function(path, problem, args) {
        this.problem = problem || this.problem;
        this.args = args || this.args;
        const fileStream = fs.createReadStream(path);
        const transform = this.getTransform();
        const transformedStream = fileStream.pipe(transform);
        const transformedBuffer = await this.streamToBuffer(transformedStream);
        return transformedBuffer;
    },

    set(args) {
        for (const key in args) {
            this[key] = args[key];
        }
    }
}