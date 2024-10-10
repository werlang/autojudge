import fs from 'fs';

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

    replaceText: async function(text) {
        let template = text.replace(/{{title}}/g, this.problem.title);
        template = template.replace(/{{description}}/g, this.problem.description);

        // generate the table with the input and output
        const inputList = JSON.parse(this.problem.input_public);
        const outputList = JSON.parse(this.problem.output_public);
        const rows = inputList.map((input, i) => `<tr>
            <td>${input}</td>
            <td>${outputList[i]}</td>
        </tr>`).join('');
        template = template.replace('{{io}}', rows);
    
        // replace the body args
        for (const key in this.args) {
            template = template.replace(new RegExp(`{{${key}}}`, 'g'), this.args[key]);
        }

        // Convert all external image URLs in the template to Base64 using regex
        template = await this.convertImagesToBase64UsingRegex(template);

        return template;
    },

    getReplacedBuffer: async function(path, problem, args) {
        this.problem = problem || this.problem;
        this.args = args || this.args;
        const file = fs.readFileSync(path, 'utf8');
        const replacedFile = await this.replaceText(file);
        const transformedBuffer = Buffer.from(replacedFile);
        return transformedBuffer;
    },

    set(args) {
        for (const key in args) {
            this[key] = args[key];
        }
    }
}