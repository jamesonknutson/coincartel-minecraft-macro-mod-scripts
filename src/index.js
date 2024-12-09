const fs                                                 = require('fs-extra');
const { outdent }                                        = require('outdent');
const { Directory, File, FnCall, FnDefinition, OutFile } = require('./struct');
const { getWhitespace }                                  = require('./util/whitespace');
const constantDirectories                                = require('./constants');
const toposort                                           = require('toposort');
const path                                               = require('path');

/**
 * @param {FnDefinition[]} fns
 * @returns {string}
 */
const fnsToText = fns => {
    return fns.reduce((lines, fn, i, fns) => {
        return [
            ...lines,
            '\t' + `// ${fn.outputPath.replace(constantDirectories.OUTPUT, '').slice(1, (fn.name.length + '.txt'.length) * -1).replace(/\\/g, '/') + fn._name}`,
            ...fn.formattedText.map(l => `\t\t` + l),
            ...(i === fns.length - 1 ? ['//! @mkb-import-end'] : [])
        ]
    }, [ `//! @mkb-import-begin` ]).join('\n').replace(/\t/g, '    ');
}

/**
 * @param {string[]} [targetFiles=[]] - An optional Array of Production File Paths to Target with updated Function Calls.
 */
const main = (targetFiles=[]) => {
    const sourceDirectory = new Directory(constantDirectories.SOURCE, null, 'SOURCE');
    const sourceFiles     = sourceDirectory.recursiveFiles;

    /** @type {FnDefinition[]} */
    const _allFuncs = [];
    sourceFiles.forEach(f => {
        Array.from(f.fnDefinitions.values()).forEach(fn => {
            if (!_allFuncs.some(o => o.name.toLowerCase() == fn.name.toLowerCase())) {
                console.log(`[sourceFiles.forEach(f => f.fnDefinitions.values()).forEach(fn))]: adding ${fn.name.toLowerCase()} to _allFuncs (length: ${_allFuncs.length})`);
                _allFuncs.push(fn);
            }
        })
    });

    console.log(`done sourceFiles loop`)

    /** @type {FnDefinition[]} */
    const sourceFunctions = [];
    for (let i = 0; i < _allFuncs.length; i++) {
        const fnDef = _allFuncs[i];
        const callsBefore = Array.isArray(fnDef._calls) ? fnDef._calls.length : 0;
        const newDef      = fnDef.extractCalls(_allFuncs);
        const callsAfter  = Array.isArray(newDef._calls) ? newDef._calls.length : 0;
        console.log(`[sourceFunctions.forEach(fnDef)]: updated calls for ${fnDef.name.toLowerCase()} from ${callsBefore} to ${callsAfter}`);
        sourceFunctions.push(newDef);
    }

    console.log(`done sourceFunctions loop`);

    
    /** @type {FnDefinition[]} */
    /* const sourceFunctions = [...new Set(sourceFiles.flatMap(f => [...f.fnDefinitions.entries()])).values()].map((fn, i, fns) => {
        console.log(`\t[${i+1}/${fns.length}] Extracting Calls for ${fn.name.toLowerCase()}`);
        return fn.extractCalls(fns);
    }); */

    console.log('--------')
    console.log(`Writing updated Function Calls to ${constantDirectories.OUTPUT}...`);
    const fnMap = new Map();
    sourceFunctions.forEach((fn, i, arr) => {
        if(i < arr.length - 1) {
            console.info(`\t[${i + 1}/${arr.length}] Writing ${fn._name} to:\n\t\t${fn.outputPath}\n\tNext Name: ${arr[i+1]._name}\n\tNext Path: ${arr[i+1].outputPath}`);
        } else {
            console.info(`\t[${i + 1}/${arr.length}] Writing ${fn._name} to:\n\t\t${fn.outputPath}`);
        }
        fs.ensureFileSync(fn.outputPath);
        fs.writeFileSync(fn.outputPath, fnsToText(fn.sortedDeps), { encoding: 'utf8', flag: 'w' });
        console.log('-------------------------');
        console.log('');
    });

    console.log('-----------')
    targetFiles.forEach((f, i, arr) => {
        console.info(`\t[${i + 1}/${arr.length}] Updating ${f}...`);
        const out    = new OutFile(f, null, 'PRODUCTION');
        const calls  = out.extractCalls(sourceFunctions);
        const edges  = calls.flatMap(c => c.expanded);
        const sorted = toposort(edges).reverse();
        const text   = fnsToText(sorted);

        let writeText;
        const { begin, end } = out.importRange;
        if (begin !== null && end !== null) {
            const before  = out.lines.slice(0, begin);
            const after   = out.lines.slice(end + 1);
            const indent  = getWhitespace(out.lines[begin]);
            writeText     = [
                ...before,
                ...text.split('\n').map(l => indent + l),
                ...after
            ].join('\n')
        } else {
            writeText = [
                text,
                ...out.lines
            ].join('\n');
        }

        fs.writeFileSync(out.path, writeText, { encoding: 'utf8', flag: 'w' });
    });
}

module.exports = main