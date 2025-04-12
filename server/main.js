import express from 'express';
import { Database } from './db.js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import crypto from 'crypto';
import ansiColors from 'ansi-colors';
import userAgent from 'user-agent';
import expressWs from 'express-ws';
const app = expressWs(express()).app;
const port = 3000;
const signer = "imasussysigner";
const sesslen = 3;
const dbfile= "main.db";
const logfile= "server.log";
const db = new Database(dbfile, JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'setupdb.json'), 'utf8')));
let adminSign; 
function genSessionId(k) {
    const sessionId = crypto.randomBytes(64);
    const hmac = crypto.createHmac('sha256', k);
    const sessionToken = Buffer.concat([sessionId, Buffer.from(hmac.update(sessionId).digest('base64'))]).toString('base64');
    return sessionToken;
}
function validateSess(s, k, db) {
    const stb = Buffer.from(s, 'base64');
    const valid = !Buffer.compare(Buffer.from(crypto.createHmac('sha256', k).update(stb.subarray(0, 64)).digest('base64')), stb.subarray(64));
    const sess = db.getEntry(`sessions.${s}`);
    //console.log(valid,sess,valid, !sess.morte, sess.expires, Date.now(),db.getEntry(`users.${sess.user}`).auth)
    if (valid && !sess.morte && sess.expires > Date.now() && db.getEntry(`users.${sess.user}`).auth) {
        return sess;
    }
    console.log("SESSION REJECTED:", valid, !sess.morte, sess.expires > Date.now(), db.getEntry(`users.${sess.user}`).auth)
    return false;
}
const log=(msg)=>{
    console.log(msg);
    fs.appendFileSync(logfile, `${ansiColors.unstyle(msg)}\n`, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    })
}
app.use((req, res, next) =>{
    const ua = userAgent.parse(req.headers['user-agent']);
    const logEntry = `${ansiColors.bold(new Date().toISOString())} - ${ansiColors.green(req.method)} ${req.url} ${ansiColors.yellowBright(req.ip.replace("::ffff:", ""))} ${ansiColors.cyan(`(${ua.name.replace(/(^|\s)[a-z]/gi, l => l.toUpperCase())} ${ua.version} ${ua.os})`)}`;
    log(logEntry);
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('dist'));
app.post('/api/timeout', (req, res) => {
    const sess = validateSess(req.body.sid, signer, db);
    if (sess != false) {
        res.json({ timeout: sess.expires - Date.now() });
        return;
    }
    res.json({ timeout: 0 });
})
app.get('/api/categories', (req, res) => {
    res.json(db.getEntry('categories'));
});
app.get('/api/restaurants', (req, res) => {
    res.json(db.getEntry('restaurants'));
});
app.get('/api/noc', (req, res) => { db.create('cOC', db.getEntry('cOC') + 1); res.json({ noc: db.getEntry('cOC') }) });
app.post('/api/login', async (req, res) => {
    const userData = req.body;
    let auth = true;
    try {
        await (await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?alt=json`, {
            headers: {
                'Authorization': `Bearer ${userData.access_token}`
            }
        })).json()
    } catch (e) { auth = false }
    if (!auth) {
        res.json({ error: true });
        return;
    }
    let user = { sessions: [], orders: [],admin:false }
    if (Object.keys(db.getEntry('users')).includes(userData.sub)) user = db.getEntry(`users.${userData.sub}`);
    user.auth = auth;
    let sid = genSessionId(signer);
    user.sessions.push(sid);
    if(db.getEntry('admins').includes(userData.sub)){user.admin=true;adminSign=genSessionId(signer);}
    db.create(`users.${userData.sub}`, user);
    db.create(`sessions.${sid}`, {
        user: userData.sub,
        expires: Date.now() + (3.6 * (10 ** 6) * sesslen),
        morte: false
    });
    let resr={ sid, exp: db.getEntry(`sessions.${sid}.expires`) };
    if(user.admin)resr.admin=adminSign;
    res.json(resr);
});
app.post('/api/order', (req, res) => {
    const sess = validateSess(req.body.sid, signer, db);
    if (sess == false) {
        res.json({ error: true });
        return;
    }
    const order = req.body.order;
    order.user = sess.user;
    db.create(`orders.${order.id}`, order);
    res.json({ error: false });
})
app.post('/api/logout', (req, res) => {
    try {
        const sess = validateSess(req.body.sid, signer, db);
        if (sess == false) {
            res.json({ error: true });
            return;
        }
        db.remove(`sessions.${req.body.sid}`);
        const user = db.getEntry(`users.${sess.user}`);
        user.sessions.splice(user.sessions.indexOf(req.body.sid), 1);
        user.auth = false;
        db.create(`users.${sess.user}`, user);
        res.json({ error: false });
    } catch (e) {
        res.json({ error: true });
    }
})
app.ws("/api/admin",(ws,res)=>{
    
})
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});