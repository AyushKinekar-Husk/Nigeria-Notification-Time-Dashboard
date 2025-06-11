const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper to get metadata path
function getMetadataPath() {
    return path.join(__dirname, 'downloads', 'metadata.json');
}

// Helper to read metadata
function readMetadata() {
    const metadataPath = getMetadataPath();
    if (!fs.existsSync(metadataPath)) return {};
    return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
}

// Helper to write metadata
function writeMetadata(metadata) {
    const metadataPath = getMetadataPath();
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Accept JSON: { filename, link }
app.post('/upload', (req, res) => {
    const { filename, link } = req.body;
    if (!filename || !link) {
        return res.status(400).json({ error: 'filename and link are required' });
    }
    const metadata = readMetadata();
    metadata[filename] = {
        link,
        uploadedAt: new Date().toISOString()
    };
    writeMetadata(metadata);
    res.json({ message: 'Link saved successfully', filename, link });
});

app.get('/files', (req, res) => {
    const metadata = readMetadata();
    const files = Object.keys(metadata).map(filename => ({
        name: filename,
        link: metadata[filename].link,
        uploadedAt: metadata[filename].uploadedAt
    }));
    res.json(files);
});

// Delete file endpoint
app.delete('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    const metadataPath = getMetadataPath();
    if (!fs.existsSync(metadataPath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        if (!metadata[filename]) {
            return res.status(404).json({ error: 'File not found' });
        }
        delete metadata[filename];
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting file' });
    }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 