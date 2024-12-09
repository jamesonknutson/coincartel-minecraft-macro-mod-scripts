const fs           = require('fs-extra');
const path         = require('path');
const FnDefinition = require('../fn/fnDefinition');

module.exports = class File {
    /**
     * @param {string} path - The File Path
     * @param {import('./directory')} dir - The Directory that contains this File.
     * @param {'SOURCE'|'PRODUCTION'} [type='SOURCE'] - What type of Data this File holds. If set as 'SOURCE', then the
     * Files found within all subdirectories of this File will be scanned for Function Definitions. If set as 'PRODUCTION',
     * the Files found within will be scanned for Function Calls only, and any Function Calls found will be resolved to their Definitions
     * and added as an Import when writing the Output for this File.
    */
    constructor(path, dir, type='SOURCE', _text, _lines, _fnDefinitions) {
        this.path           = path;
        this.dir            = dir;
        this.type           = type;
        this.lastModifiedAt = fs.statSync(this.path).mtime;
        this._text          = _text || null;
        this._lines         = _lines || null;
        /** @type {Map.<string, FnDefinition>} */
        this._fnDefinitions = _fnDefinitions || null;
    }

    update() {
        console.log(`called update() on file ${this.path}`);
        this.lastModifiedAt = fs.statSync(this.path).mtime;
        this._text          = null;
        this._lines         = null;
        this._fnDefinitions = null;
    }

    /** @type {boolean} */
    get isOutOfDate() {
        return fs.statSync(this.path).mtime > this.lastModifiedAt;
    }

    /** @type {string} */
    get text() {
        if (this.isOutOfDate) this.update();
        if (this._text) return this._text;
        return this._text = fs.readFileSync(this.path, { encoding: 'utf8'}).replace(/\t/g, '    ');
    }

    /** @type {string[]} */
    get lines() {
        if (this.isOutOfDate) this.update();
        if (this._lines) return this._lines;
        return this._lines = this.text.split(/\r?\n/);
    }

    /** @type {Map.<string, FnDefinition>} */
    get fnDefinitions() {
        if (this.isOutOfDate) this.update();
        if (this._fnDefinitions) return this._fnDefinitions;
        if (this.type === 'PRODUCTION') return this._fnDefinitions = [];
        
        /** @type {Map.<string, FnDefinition>} */
        const fnDefinitions = new Map();
        const fileLines     = this.lines;
        const getFreshRange = () => ({ begin: null, end: null });
        const getFreshFnDef = () => {
            return {
                doc   : getFreshRange(),
                body  : getFreshRange(),
                name  : null,
                get inProgress() { return this.name !== null }
            }
        };

        let currFnDef = getFreshFnDef();
        let docLines  = getFreshRange();

        for (let i = 0; i < fileLines.length; i++) {
            const lineText = fileLines[i];
            if (currFnDef.inProgress) {
                if (FnDefinition.isBodyEnd(lineText)) {
                    currFnDef.body.end = i;
                    fnDefinitions.set(currFnDef.name, new FnDefinition({ file: this, ...currFnDef }));
                    currFnDef = getFreshFnDef();
                }
            } else {
                const bodyStart = FnDefinition.isBodyStart(lineText);
                if (bodyStart.isBody) {
                    currFnDef.name       = bodyStart.name;
                    currFnDef.body.begin = i;
                    currFnDef.doc        = docLines;
                } else {
                    if (FnDefinition.isDocumentation(lineText)) {
                        if (docLines.begin === null) {
                            docLines.begin = i;
                        } else {
                            docLines.end = i;
                        }
                    } else {
                        docLines = getFreshRange();
                    }
                }
            }
        }

        return this._fnDefinitions = fnDefinitions;
    }
}