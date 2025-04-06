import express from 'express';
import { Database } from './db.js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import crypto from 'crypto';
const app = express();
const port = 4000;
const signer= "imasussysigner";
const sesslen=3;
const db = new Database('main.db',JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'setupdb.json'), 'utf8')));
function genSessionId(k){
    const sessionId = crypto.randomBytes(64);
    const hmac = crypto.createHmac('sha256', k);
    const sessionToken = Buffer.concat([sessionId, Buffer.from(hmac.update(sessionId).digest('base64'))]).toString('base64');
    return sessionToken;
}
function validateSess(s,k,db){
    const stb = Buffer.from(s, 'base64');
    const valid=!Buffer.compare(Buffer.from(crypto.createHmac('sha256', k).update(stb.subarray(0, 64)).digest('base64')),stb.subarray(64));
    const sess=db.getEntry(`sessions.${s}`);
    if(valid&&!sess.morte&&sess.expires>Date.now()&&db.getEntry(`users.${sess.user}`).auth){
        return sess;
    }
    return false;
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('dist'));
app.get('/api/categories', (req, res) => {
    res.json(db.getEntry('categories'));
});
app.get('/api/restaurants', (req, res) => {
    res.json(db.getEntry('restaurants'));
});
app.get('/api/noc', (req, res) => {db.create('cOC',db.getEntry('cOC')+1);res.json({noc:db.getEntry('cOC')})});
app.post('/api/login', async (req, res) => {
    const userData = req.body;
    let auth=true;
    try{await (await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?alt=json`,{
        headers:{
          'Authorization': `Bearer ${userData.access_token}`
        }
      })).json()}catch(e){auth=false}
    if(!auth){
        res.json({error:"Invalid token"});
        return;
    }
    let user={sessions:[]}
    if(Object.keys(db.getEntry('users')).includes(userData.sub))user = db.getEntry(`users.${userData.sub}`);
    user.auth=auth;
    let sid=genSessionId(signer);
    user.sessions.push(sid);
    db.create(`users.${userData.sub}`,user);
    db.create(`sessions.${sid}`,{
        user: userData.sub,
        expires: Date.now() + (3.6*10^3*sesslen),
        morte:false
    });
    res.json({sid,exp:db.getEntry(`sessions.${sid}.expires`)});
});
app.post('/api/logout', (req, res) => {
    const sess = validateSess(req.body.sid,signer,db);
    if(sess){
        db.remove(`sessions.${req.body.sid}`);
        const user=db.getEntry(`users.${sess.user}`);
        user.sessions.splice(user.sessions.indexOf(req.body.sid),1);
        user.auth=false;
        db.create(`users.${sess.user}`,user);
        res.json({success:true});
    }else{
        res.json({error:"Invalid session"});
    }
})
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});