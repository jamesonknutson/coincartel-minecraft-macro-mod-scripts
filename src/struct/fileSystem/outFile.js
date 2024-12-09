const File         = require('./file');
const FnDefinition = require('../fn/fnDefinition');

module.exports = class OutFile extends File {
    /**
    * @param {string} path - The File Path
    * @param {import('./directory')} dir - The Directory that contains this File.
    * @param {'SOURCE'|'PRODUCTION'} [type='SOURCE'] - What type of Data this File holds. If set as 'SOURCE', then the
    * Files found within all subdirectories of this File will be scanned for Function Definitions. If set as 'PRODUCTION',
    * the Files found within will be scanned for Function Calls only, and any Function Calls found will be resolved to their Definitions
    * and added as an Import when writing the Output for this File.
    */
    constructor(path, dir, type='PRODUCTION', _text, _lines, _fnDefinitions) {
        super(path, dir, 'PRODUCTION', _text, _lines, _fnDefinitions);
        this._importRange = null;
        this._bodyRange   = null;
        this._bodyLines   = null;
        this._calls       = null;
    }
    
    /** @type {{ begin: number, end: number }} */
    get importRange() {
        if (this._importRange) return this._importRange;
        const lines = this.lines;
        return this._importRange = {
            begin : lines.findIndex(l => l.toLowerCase().includes('//! @mkb-import-begin')),
            end   : lines.findIndex(l => l.toLowerCase().includes('//! @mkb-import-end')),
        };
    }
    
    /** @type {{ begin: number, end: number }} */
    get bodyRange() {
        if (this._bodyRange) return this._bodyRange;
        const lines = this.lines;
        return this._bodyRange = { begin: this.importRange.end + 1, end: lines.length - 1 };
    }
    
    /** @type {string[]} */
    get bodyLines() {
        if (this._bodyLines) return this._bodyLines;
        return this._bodyLines = this.lines.slice(this.bodyRange.begin)
    }
    
    /** @type {string} */
    get bodyText() {
        return this.bodyText.join('\n');
    }
    
    /**
    * @param {FnDefinition[]} functions
    * @returns {FnDefinition[]}
    */
    extractCalls(functions) {
        if (this._calls) return this._calls;
        
        const bodyLines = this.bodyLines;
        const bodyText  = bodyLines.join('\n');
        const defNames  = functions.map(f => f.name).sort((a, b) => b.length - a.length);
        
        // See docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
        const callExpression = new RegExp(`(?<!^\\s*(?:\\/\\/|function).*)(?<=call\\("?|\\s+)(?<name>${defNames.join('|')})(?=(?:"?,|\\))|\\()`, 'gim');
        const callMatches    = Array.from(bodyText.matchAll(callExpression));

        return this._calls = [...new Set(callMatches.map(m => m.groups.name))].map(n => functions.find(f => f._name === n));
    }
}