import express from 'express';
import { Database } from './db';
import fs from 'fs';
const app = express();
const port = 4000;
const db = new Database('main.db',JSON.parse(fs.readFileSync('setupdb.json', 'utf8')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('../dist'));
app.get('/api/categories', (req, res) => {
    res.json(db.getEntry('categories'));
});
app.get('/api/restaurants', (req, res) => {
    res.json(db.getEntry('restaurants'));
});
app.post('/api/login', (req, res) => {
    console.log(req.body);
    res.json({ success: true });
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});