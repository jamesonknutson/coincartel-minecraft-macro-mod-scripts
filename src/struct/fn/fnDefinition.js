let   occuranceCount                                        = new Map();
const path                                                  = require('path');
const { getWhitespaceCount, reindentString, getWhitespace } = require('../../util/whitespace');
const toposort                                              = require('toposort');
const FnCall                                                = require('./fnCall');
const constantDirectories                                   = require('../../constants');
const depMap                                                = new Map();
const expandedMap                                           = new Map();
const recursionMap                                          = new Map();

module.exports = class FnDefinition {
    /**
     * @param {object} _
     * @param {import('../fileSystem/file')} _.file - The File that contains this Function Definition
     * @param {{ begin: number, end: number }} _.body - The index range of the lines that make up the body of this Function in the File
     * @param {{ begin: number, end: number }} _.doc - The index range of the lines that make up the documentation of this Function in the File
     * @param {string} _.name - The name of this Function
     */
    constructor({ file, doc, body, name }, _calls) {
        this.file           = file;
        this.doc            = doc;
        this.body           = body;
        this.name           = name.toLowerCase();
        this._name          = name;
        this._calls         = _calls || null;
        this._formattedText = null;
    }

    get bodyLines() {
        return this.file.lines.slice(this.body.begin, this.body.end + 1);
    }

    get bodyText() {
        return this.bodyLines.join('\n');
    }

    /** @type {string} */
    get outputPath() {
        const thisPath = path.parse(this.file.path);
        return path.join(
            constantDirectories.OUTPUT, path.relative(constantDirectories.SOURCE, [
                thisPath.dir,
                thisPath.name,
                this._name + '.txt'
            ].join(path.sep))
        );
    }

    get formattedText() {
        if (this._formattedText) return this._formattedText;
        const firstPortion = this.file.lines.slice(this.doc.begin, this.body.begin + 1);
        const lastPortion  = this.file.lines.slice(this.body.begin + 1, this.body.end + 1);
        const textLines    = [
            ...firstPortion,
            `${getWhitespace(lastPortion[0])}// File: ${this.file.path.replace(/\\/g, '/')}:${this.body.begin}`,
            ...lastPortion
        ];

        const baseIndent = getWhitespaceCount(this.file.lines[this.body.begin]);
        return this._formattedText = textLines.map((line, i, arr) => {
            const reindented = reindentString(line, baseIndent);
            //console.log(`[${i + 1}/${arr.length}]\n\tBefore: ${line}\n\tAfter:  ${reindented}\n`);
            return reindented;
        });
    }

    /** @type {Map.<string, FnCall>} */
    get calls() {
        if (this._calls) return this._calls;
        return this.extractCalls(this.file.dir.root.recursiveFiles.flatMap(f => [...f.fnDefinitions.values()])).calls;
    }

    /**
     * Extracts all of the Unique Function Calls from this Function Definition.
     * @param {import('./fnDefinition.js')[]} functions - All known Function Definitions.
     * @returns {FnDefinition}
     */
    extractCalls(functions) {
        if (this._calls) return this;

        console.log(`hit extractCalls for ${this.name.toLowerCase()}, have ${functions.length} functions passed to fn`);

        /** @type {Map.<string, FnCall>} */
        const calls = new Map();
        const bodyLines = this.bodyLines;
        const bodyText  = bodyLines.join('\n');
        const defNames  = functions.map(f => f.name).sort((a, b) => b.length - a.length);
        
        // See docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
        const callExpression = new RegExp(`(?<!^\\s*(?:\\/\\/|function).*)(?<=call\\("?|\\s+)(?<name>${defNames.join('|')})(?=(?:"?,|\\))|\\()`, 'gim');
        const callMatches    = Array.from(bodyText.matchAll(callExpression));
        for (const callMatch of callMatches) {
            const name  = callMatch.groups.name;
            const def   = functions.find(f => f.name.toLowerCase() === name.toLowerCase());
            if (def && !calls.has(name)) {
                const range = { begin: callMatch.index, end: callMatch.index + name.length };
                const call  = new FnCall({ file: this.file, name, fnDefinition: def, range });
                calls.set(name, call);
            }
        }

        this._calls = calls;
        return this;
    }

    get recursive() {
        const rec = recursionMap.get(this.name.toLowerCase());
        if (rec) {
            console.log(`hit rec for ${this.name.toLowerCase()}.recursive`);
            return rec;
        }
        console.warn(`did not hit rec for ${this.name.toLowerCase()}.recursive`);

        const lastOccur = occuranceCount.get(this.name.toLowerCase());
        const thisOccur = Number.isFinite(lastOccur) ? lastOccur + 1 : 1;
        occuranceCount.set(this.name.toLowerCase(), thisOccur);
        console.log(`occurance count for ${this.name.toLowerCase()}.recursive is ${thisOccur}`);

        const returnMe = {
            call    : this,
            children: Array.from(this.calls.values()).filter(c => c.fnDefinition.name.toLowerCase() != this.name.toLowerCase()).map((c, i, arr) => {
                console.log(`<${this.name.toLowerCase()}.recursive[${i+1}/${arr.length}]> recursing into child ${c.fnDefinition.name.toLowerCase()} to grab it's dependencies`);
                return c.fnDefinition.recursive;
            })
        };

        recursionMap.set(this.name.toLowerCase(), returnMe);
        return returnMe;
    }

    get expanded() {
        const exp = expandedMap.get(this.name.toLowerCase());
        if (exp) {
            console.log(`hit exp for ${this.name.toLowerCase()}.expanded`);
            return exp;
        }
        console.warn(`did not hit exp for ${this.name.toLowerCase()}.expanded`);
        const returnMe = this.recursive.children.flatMap((c, i, arr) => {
            console.log(`<${this.name.toLowerCase()}.expanded[${i+1}/${arr.length}]> expanding child ${c.call.name.toLowerCase()}`);
            return [ [ this, c.call ], ...c.call.expanded ]
        });

        expandedMap.set(this.name.toLowerCase(), returnMe);
        return returnMe;
    }

    /** @type {FnDefinition[]} */
    get sortedDeps() {
        const deps = depMap.get(this.name.toLowerCase());
        if (deps) {
            console.log(`hit dep for ${this.name.toLowerCase()}`);
            return deps;
        }
        console.log(`did not hit dep for ${this.name.toLowerCase()}`);

        const sorted = toposort(this.expanded).reverse();
        if (!sorted.includes(this)) {
            sorted.push(this);
        }

        depMap.set(this.name.toLowerCase(), sorted);
        return sorted;
    }

    /**
     * Checks if a String of Text contains a Function Definition.
     * @param {string} line - The String to check for a Function Definition within.
     * @returns {{ isBody: boolean, name?: string }} - If the String contains a Function Definition, returns an Object with the name of the Function.
     */
    static isBodyStart(line) {
        const match = line.match(/^\s*function (?<name>.*?)\((?<args>.*?)\)/i);
        if (match) {
            return { isBody: true, name: match.groups.name };
        }
        return { isBody: false }
    }

    /**
     * Checks if a String of Text ends a Function Definition.
     * @param {string} line - The String to check for a Function Definition end keyword within.
     * @returns {boolean}
     */
    static isBodyEnd(line) {
        return /^\s*endfunction/i.test(line);
    }

    /**
     * Checks if a String of Text is a Documentation (comment) String.
     * @param {string} line - The String to check for being a Documentation Line.
     * @returns {boolean}
     */
    static isDocumentation(line) {
        return /^\s*\/\//.test(line) && !/(?:\\|\/).*?\.txt/.test(line);
    }
}