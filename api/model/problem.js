import CustomError from '../helpers/error.js';
import Model from './model.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import sharp from 'sharp';

export default class Problem extends Model {
    constructor({
        id,
        hash,
        title,
        description,
        input_public,
        output_public,
        input_hidden,
        output_hidden,
        solution,
        author,
        language,
        is_public,
    }) {
        super('problems', {
            fields: {
                id,
                hash,
                created_at: null,
                title,
                description,
                input_public,
                output_public,
                input_hidden,
                output_hidden,
                solution,
                author,
                language,
                is_public,
            },
            allowUpdate: ['title', 'description', 'input_public', 'output_public', 'input_hidden', 'output_hidden', 'solution', 'language', 'is_public'],
            insertFields: ['title', 'description', 'author', 'language', 'hash', 'is_public'],
        });
    }
    
    static async getAll(filter) {
        return Model.getAll('problems', filter);
    }

    async get() {
        if (this.id) {
            return super.get();
        }
        else if (this.hash) {
            return super.getBy('hash');
        }

        throw new CustomError(400, 'ID or hash is required');
    }

    async insert() {
        this.hash = uuidv4().replace(/-/g, '');
        return super.insert();
    }

    async saveImage(data) {
        if (!data) {
            throw new CustomError(400, 'Image is required.');
        }

        if (data.startsWith('data:image/')) {
            data = data.replace(/^data:image\/\w+;base64,/, '');
        }
        const buffer = Buffer.from(data, 'base64');
        const imgId = uuidv4().replace(/-/g, '');
        const dir = `upload/problem/${this.id}/`;
        const outputPath = `${dir}${imgId}`;

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        await sharp(buffer).resize({ width: 800, withoutEnlargement: true }).toFormat('webp').toFile(outputPath);

        return imgId;
    }

    getImage(id) {
        const dir = `upload/problem/${this.id}/`;
        const path = `${dir}${id}`;

        if (!fs.existsSync(path)) {
            throw new CustomError(404, 'Image not found');
        }

        const buffer = fs.readFileSync(path);
        return buffer;
    }

    removeImage(id) {
        const dir = `upload/problem/${this.id}/`;
        const path = `${dir}${id}`;

        if (!fs.existsSync(path)) {
            throw new CustomError(404, 'Image not found');
        }

        fs.unlinkSync(path);
    }
}