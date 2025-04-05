import * as fs from 'fs'
import * as crypto from 'crypto'
import fuzzysort from 'fuzzysort'
import * as dbfile from './dbfile.js'
export function genUUID() {
    var bytes = crypto.randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return bytes.toString('hex');
}
export class Database {
    constructor(path, schema) {
        if (fs.existsSync(path)) {
            this.loaded = true
            this.db = dbfile.read(path)
        } else {
            this.db = schema || {}
        }
        this.file = path
    }
    getEntry(name) {
        this.writeDB()
        return name.split('.').reduce((prev, cur) => {

            if ((typeof prev[cur] == 'string') && prev[cur].includes('${') && (prev[cur][prev[cur].length - 1] == '}')) {
                return this.getEntry(prev[cur].replaceAll('${', '').slice(0, -1))
            }
            return prev[cur]
        }, this.db)
    }
    update() {
        this.create(...arguments)
    }
    create(name, value) {
        name.split('.').reduce((prev, cur, i) => {
            prev[cur] = prev[cur] || {};
            if (i == name.split('.').length - 1) {

                if ((typeof prev[cur] == 'string') && prev[cur].includes('${') && (prev[cur][prev[cur].length - 1] == '}')) { return this.create(prev[cur].replaceAll('${', '').slice(0, -1), value); }
                prev[cur] = value
                return;
            }; return prev[cur]
        }, this.db)
        this.writeDB()
    }
    remove(name) {
        this.create(name, undefined)
    }
    writeDB() {
        dbfile.write(this.file,this.db)
        this.db=dbfile.read(this.file)
    }
    exists() {
        return !!this.loaded
    }
    createLink(from, to) {

        if (!(this.db[from.split('.')[0]]) || (this.getEntry(from) != `\${${to}}`)) this.create(from, `\${${to}}`)
    }
    search(path, term, options) {
        var entry = this.getEntry(path)
        var results = []
        if (options.key) {

            var keys = fuzzysort.go(term, Object.values(entry), { key: options.key, limit: options.amount })
            keys.forEach((key) => {
                results.push(key.obj)
            })
        } else {
            var keys = fuzzysort.go(term, Object.keys(entry), { limit: options.amount })
            keys.forEach((key) => {
                results.push(entry[key.target])
            })
        }
        return results
    }
}