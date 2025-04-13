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
const signer = 'mdUrOYz19C9gIMtd0+V3TVl3m6Yz1eReXDbB5BkEhG2e5Kl0vmgnDu80FyNdStpjmk3rcp2Um1P9EM+nA8m253soke1gbcNSZzeSp+Ndj4aScQl8yK4W3ASF3kNRYYrOGl04n611VSCLh6d70SqVbJiUsQYFDzck3jl2Q+pfOWdxz2oU/oBJtTj0omp1GmExiBzdud7q+/V6oPyRxIc7liEiF70u/k+aqauhE56F5Whu10CBLKyXkPV6GCLx5kbCUVu0fH/yvuZwW4SJYzEqpN+0QMFvaW62J/OgxT/gV5mHNMR4U/cIC12Art9S0RRbqHdE+AVReGYvR1JKAeSmKTtqG7fCSvXskz6ZwOu8dtl7vGiREC/0klNq22L2io2aeKuWLptJXdZbCwAMM2oygK+m+exJs72yGZbzAtVLtWjcRaU0BtF9iyAp3Wu4yjSFLMGBfNl3BPs6/Asn9GWqk7NKPlgUPJ6XcqKTjTq7STi5vmVMqfQoGHEGVfcIz/Jk+ffvgbsmhAArf19JbBreiXPWh6pTw++/c4Hb+DjTqA3AMWWkgqwUD7FwWIqpYt82GnELe0mb4+Tp5IYqVvVSLkKB/zKXnOCL0Xg4/k9HlvKGXUa9dwjdYE+qC0a+HWH8DB6hnWnkbis7TGH6ynpYZ6OmXXwHr7vJK8UGJ/s3bGg=';
const sesslen = 3;
const dbfile= "main.db";
const logfile= "server.log";
const subcost = 0;
const iv = crypto.randomBytes(12).toString('base64');
const db = new Database(dbfile, JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'setupdb.json'), 'utf8')));
let adminSign; 
const encryptSymmetric = (key, plaintext) => {
    const cipher = crypto.createCipheriv(
      "aes-256-gcm", 
      Buffer.from(key, 'base64'), 
      Buffer.from(iv, 'base64')
    );
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const tag = cipher.getAuthTag()
    
    return { ciphertext, tag }
  }
  const decryptSymmetric = (key, ciphertext, tag) => {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm", 
      Buffer.from(key, 'base64'),
      Buffer.from(iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
  
    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
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
    let name;
    try {
        name=await (await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?alt=json`, {
            headers: {
                'Authorization': `Bearer ${userData.access_token}`
            }
        })).json().name
    } catch (e) { auth = false }
    if (!auth) {
        res.json({ error: true });
        return;
    }
    let user = { sessions: [], orders: [],admin:false,name }
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
    ws.on("message",(msg)=>{
        msg=JSON.parse(msg);
        if(!validateSess(msg.sess,signer,db)){ws.send(JSON.stringify({error:true}));return}
        try{const body=JSON.parse(decryptSymmetric(adminSigner,msg.body,iv,msg.tag));}catch(e){ws.send(JSON.stringify({error:true}));return}
        switch (body.type){
            case 'addRestuarnt':
                db.create(`restaurants.${body.data.id}`, body.data);
                ws.send(JSON.stringify({error:false}));
                break;
            case 'removeRestuarnt':
                db.remove(`restaurants.${body.data.id}`);
                ws.send(JSON.stringify({error:false}));
                break;
            case 'addCategory':
                db.create(`categories.${body.data.id}`, body.data);
                ws.send(JSON.stringify({error:false}));
                break;
            case 'removeCategory':
                db.remove(`categories.${body.data.id}`);
                ws.send(JSON.stringify({error:false}));
                break;
            case 'addAdmin':
                let admins=db.getEntry('admins');
                if(!admins.includes(body.data.id)){
                    admins.push(body.data.id);
                    db.create('admins',admins);
                }
                ws.send(JSON.stringify({error:false}));
                break;
            case 'dumpDB':
                ws.send(JSON.stringify({error:false,db:db.db}));
        }
    })
    let stats=JSON.stringify({
        restaurants: db.getEntry('restaurants').length,
        drivers: Object.keys(db.getEntry('drivers')).length,
        uc: Object.keys(db.getEntry('users')).length,
        orders: Object.keys(db.getEntry('orders')).length,
        revenue: Object.keys(db.getEntry('users')).length*subcost,
        totalTransactionVal: db.getEntry('orders').reduce((a,b)=>a+b.price,0),
        users: Object.values(db.getEntry('users')).map((u)=>u.name)
    })
    const estats=encryptSymmetric(adminSign, stats);
    ws.send(JSON.stringify({error:false,body:estats.ciphertext,tag:estats.tag}));
})
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});