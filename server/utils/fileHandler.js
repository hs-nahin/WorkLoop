const fs = require('fs').promises;
const path = require('path');

class FileHandler {
    constructor(filename) {
        this.filePath = path.join(__dirname, '..', 'data', filename);
    }

    async read() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    async write(data) {
        try {
            await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('Error writing to file:', error);
            throw error;
        }
    }
}

module.exports = FileHandler;
