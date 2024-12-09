const { Dirent } = require('fs');
const fs   = require('fs-extra');
const path = require('path');
const File = require('./file');

module.exports = class Directory {
    static get fileExtensions() {
        return [ 'txt' ];
    }

    /**
     * @param {string} path - The Path to the Directory.
     * @param {Directory} [parentDir=null] - The Parent Directory of this Directory, or null if this is the Root Directory.
     * @param {'SOURCE'|'PRODUCTION'} [type='SOURCE'] - What type of Data this Directory holds. If set as 'SOURCE', then the
     * Files found within all subdirectories of this Directory will be scanned for Function Definitions. If set as 'PRODUCTION',
     * the Files found within will be scanned for Function Calls only, and any Function Calls found will be resolved to their Definitions
     * and added as an Import when writing the Output for this Directory.
     */
    constructor(path, parentDir=null, type='SOURCE', _dirEnts, _subdirectories, _files, _recursiveFiles) {
        this.path            = path;
        this.type            = type;
        this.parentDir       = parentDir;
        this.lastModifiedAt  = fs.statSync(this.path).mtime;
        this._dirEnts        = _dirEnts || null;
        this._subdirectories = _subdirectories || null;
        this._files          = _files || null;
        this._recursiveFiles = _recursiveFiles || null;
    }

    update() {
        this.lastModifiedAt = fs.statSync(this.path).mtime;
        this._dirEnts        = null;
        this._subdirectories = null;
        this._files          = null;
        this._recursiveFiles = null;
    }

    /** @type {boolean} */
    get isOutOfDate() {
        return fs.statSync(this.path).mtime > this.lastModifiedAt;
    }

    /** @type {Directory} */
    get root() {
        if (!this.parentDir) return this;
        return this.parentDir.root;
    }

    /** @type {Dirent[]} */
    get dirEnts() {
        if (this.isOutOfDate) this.update();
        if (this._dirEnts) return this._dirEnts;
        return this._dirEnts = fs.readdirSync(this.path, { encoding: 'utf8', withFileTypes: true });
    }
    
    /** @type {Directory[]} */
    get subdirectories() {
        if (this.isOutOfDate) this.update();
        if (this._subdirectories) return this._subdirectories;
        return this._subdirectories = this.dirEnts.filter(dirEnt => dirEnt.isDirectory()).map(d => new Directory(path.join(this.path, d.name), this.type));
    }

    /** @type {File[]} */
    get files() {
        if (this.isOutOfDate) this.update();
        if (this._files) return this._files;
        return this._files = this.dirEnts.filter(dirEnt => {
            return dirEnt.isFile() && Directory.fileExtensions.some(ext => dirEnt.name.endsWith(ext))
        }).map(f => {
            return new File(path.join(this.path, f.name), this.type);
        });
    }

    /** @type {File[]} */
    get recursiveFiles() {
        if (this.isOutOfDate) this.update();
        if (this._recursiveFiles) return this._recursiveFiles;
        return this._recursiveFiles = [ ...this.files, ...this.subdirectories.flatMap(d => d.recursiveFiles) ];
    }
}