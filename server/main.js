import express from 'express';
import { Database } from './db.js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import crypto from 'crypto';
import ansiColors from 'ansi-colors';
import userAgent from 'user-agent';
import expressWs from 'express-ws';
import 'dotenv/config'
const app = expressWs(express()).app;
const port = 3000;
const signer = process.env.SIGNER;
const sesslen = 3;
const dbfile = "main.db";
const logfile = "server.log";
const subcost = 5;
const db = new Database(dbfile, JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'setupdb.json'), 'utf8')));
let adminSign = crypto.randomBytes(32).toString('base64');
let senders = [];
setInterval(() => {
    const a = adminData(db);
    log(`${ansiColors.bold(new Date().toISOString())} - ${ansiColors.green('WS: dashUpdate')} ${ansiColors.yellowBright(JSON.stringify(a))}`)
    senders.forEach((s) => {
        s.send(JSON.stringify(encryptSymmetric(adminSign, JSON.stringify({ type: 'adminData', data: a }))));
    });
}, 10000)
const encryptSymmetric = (key, plaintext) => {
    const iv = crypto.randomBytes(12).toString('base64');
    const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        Buffer.from(key, 'base64'),
        Buffer.from(iv, 'base64')
    );
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const tag = cipher.getAuthTag()

    return { ciphertext, iv, tag }
}
const decryptSymmetric = (key, obj) => {
    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        Buffer.from(key, 'base64'),
        Buffer.from(obj.iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(obj.tag, 'base64'));

    let plaintext = decipher.update(obj.ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
}
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
    log("SESSION REJECTED:", valid, !sess.morte, sess.expires > Date.now(), db.getEntry(`users.${sess.user}`).auth)
    return false;
}
const adminData = (db) => {
    const bdata = {
        restaurantCount: db.getEntry('restaurants').length,
        driverCount: Object.keys(db.getEntry('drivers')).length,
        userCount: Object.keys(db.getEntry('users')).length,
        orders: Object.keys(db.getEntry('orders')).length,
        revenue: Object.keys(db.getEntry('users')).length * subcost,
        totalTransactionVal: Object.values(db.getEntry('orders')).map((i) => i.items.reduce((a, b) => a + b.price, 0)).reduce((a, b) => a + b, 0),
        monthlyTransactionVal: db.getEntry('lmoids').map(i => db.getEntry('orders')[i.id].items.reduce((a, b) => a + b.price, 0)).reduce((a, b) => a + b, 0),
        dailySpending:db.getEntry('lmoids').map(i => { return { v: db.getEntry('orders')[i.id].items.reduce((a, b) => a + b.price, 0), d: db.getEntry('orders')[i.id].time } }).sort((a, b) => b.d - a.d).map(i => i.v)
    };
    let userInfo = {};
    Object.keys(db.getEntry('users')).forEach((uid) => {
        userInfo[db.getEntry(`users.${uid}.name`)] = {
            uid,
            profile: db.getEntry(`users.${uid}.profile`),
            orders: db.getEntry(`users.${uid}.orders`).length,
            admin: db.getEntry(`users.${uid}.admin`),
            transactionVolume: db.getEntry(`users.${uid}.orders`).map((i) => db.getEntry(`orders.${i}`).items.reduce((a, b) => a + b.price, 0)).reduce((a, b) => a + b, 0),
            spending: Object.values(db.getEntry('lmoids')).filter((i) => i.user == uid).map((i) => db.getEntry(`orders.${i.id}`).items.reduce((a, b) => a + b.price, 0)).reduce((a, b) => a + b, 0),
        }
    })
    let spenders = Object.keys(userInfo).map((i) => { return { s: userInfo[i].spending, i } }).sort((a, b) => b.s - a.s).map((i) => i != undefined ? i.i : '');
    /*let driverInfo={};
    Object.keys(db.getEntry('drivers')).forEach((uid) => {
        driverInfo[db.getEntry(`drivers.${uid}.name`)] = {
            orders: db.getEntry(`drivers.${uid}.orders`).length,
            transactionVolume:db.getEntry(`drivers.${uid}.orders`).map((i)=>db.getEntry(`orders.${i}`).price).reduce((a,b)=>a+b,0)
        }
    })*/
    return { userInfo, spenders, newUsers: db.getEntry('nuc').length, ...bdata };
}
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logfile, `${ansiColors.unstyle(msg)}\n`, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    })
}
app.use((req, res, next) => {
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
    let name;
    let profile;
    try {
        const req = (await (await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?alt=json`, {
            headers: {
                'Authorization': `Bearer ${userData.access_token}`
            }
        })).json())
        name = req.name
        profile = req.picture;
    } catch (e) { auth = false }
    if (!auth) {
        res.json({ error: true });
        return;
    }
    let user = { sessions: [], orders: [], admin: false, name, profile }
    if (Object.keys(db.getEntry('users')).includes(userData.sub)) { user = db.getEntry(`users.${userData.sub}`) } else {
        let nuc = db.getEntry('nuc');
        nuc.push(Date.now());
        nuc = nuc.filter((i) => i > Date.now() - (2.629746 * 10 ** 9));
        db.create('nuc', nuc)
    };
    user.auth = auth;
    let sid = genSessionId(signer);
    user.sessions.push(sid);
    if (db.getEntry('admins').includes(userData.sub)) { user.admin = true; }
    db.create(`users.${userData.sub}`, user);
    db.create(`sessions.${sid}`, {
        user: userData.sub,
        expires: Date.now() + (3.6 * (10 ** 6) * sesslen),
        morte: false
    });
    let resr = { sid, exp: db.getEntry(`sessions.${sid}.expires`) };
    if (user.admin) { resr.admin = adminSign; }
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
    let u = db.getEntry(`users.${sess.user}`)
    u.orders.push(order.id);
    let lmoids = db.getEntry(`lmoids`)
    lmoids.push({ id: order.id, time: Date.now(), user: sess.user });
    lmoids.sort((a, b) => b.time - a.time);
    lmoids = lmoids.filter((i) => i.time > Date.now() - (2.629746 * 10 ** 9))
    db.create(`lmoids`, lmoids);
    db.create(`users.${sess.user}`, u);
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
app.ws("/api/admin", (ws, res) => {
    senders.push(ws);
    const encryptObj = (msg, obj) => {
        return JSON.stringify(encryptSymmetric(adminSign, JSON.stringify({ type: "resp", id: msg.id, obj })));
    }
    ws.on("message", (msg) => {
        msg = JSON.parse(msg);
        if (!validateSess(msg.sess, signer, db)) { ws.send(JSON.stringify({ error: true })); return }
        try { msg = JSON.parse(decryptSymmetric(adminSign, msg.body)); } catch (e) { ws.send(JSON.stringify({ error: true })); return }
        const logEntry = `${ansiColors.bold(new Date().toISOString())} - ${ansiColors.green('WS: '+msg.type)} ${ansiColors.yellowBright(msg.data)}`;
        log(logEntry)
        switch (msg.type) {
            case 'addRestuarnt':
                db.create(`restaurants.${body.data.id}`, body.data);
                ws.send(encryptObj(msg, { error: false }));
                break;
            case 'removeRestuarnt':
                db.remove(`restaurants.${body.data.id}`);
                ws.send(encryptObj(msg, { error: false }));
                break;
            case 'addCategory':
                db.create(`categories.${body.data.id}`, body.data);
                ws.send(encryptObj(msg, { error: false }));
                break;
            case 'removeCategory':
                db.remove(`categories.${body.data.id}`);
                ws.send(encryptObj(msg, { error: false }));
                break;
            case 'addAdmin':
                let admins = db.getEntry('admins');
                if (!admins.includes(body.data.id)) {
                    admins.push(body.data.id);
                    db.create('admins', admins);
                }
                ws.send(encryptObj(msg, { error: false }));
                break;
            case 'dumpDB':
                ws.send(encryptObj(msg, { db: db.db, error: false }));
                break;
        }
    })


})
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});