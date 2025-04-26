import crypto from 'crypto';
let idrs={}
let ah={}
export function setAdminHandler(type, handler) {
    ah[type] = handler;
}
export const encrypt = (key, plaintext) => {
    const iv = crypto.randomBytes(12).toString('base64');
    const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        Buffer.from(key, 'base64'),
        Buffer.from(iv, 'base64')
    );
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const tag = cipher.getAuthTag()

    return { ciphertext, iv }
}
export const decrypt = (key, obj) => {
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
export async function adminDecode(session, socket, res) {
    socket.onmessage = async (m) => {
      let msg = JSON.parse(m.data);
      msg = JSON.parse(decrypt(session.user.adminSign, msg));
      if (res[msg.type] == undefined) {
        res[msg.type] = []
      }
      if(ah[msg.type] != undefined) {
        ah[msg.type](msg);
      }
      if(idrs[msg.id] != undefined) {
        idrs[msg.id](msg);
        delete idrs[msg.id];
      }
    }
  }
export function sendAdmin(session, socket,type, data) {
    const id=crypto.randomUUID()
    socket.send(JSON.stringify({sess:session.sess,body:encrypt(session.user.adminSign, JSON.stringify({type,id,data}))}));
    return new Promise((r) => {
        idrs[id] = r;
    })
}