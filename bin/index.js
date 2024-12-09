#!/usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const main = require('../src')

console.log("hit!");

yargs(hideBin(process.argv))
    .command('export', `Compiles MKBSource Files into the MKBDist Directory.`, (yargs) => {
        return yargs.option('targetFiles', {
            description : 'An optional Array of Production File Paths to Target with updated Function Calls.',
            type : 'array',
            alias: 't',
            array: true,
            string: true,
            default: [],
        })
    }, (argv) => {
        const { targetFiles } = argv
        console.info(`Running with TargetFiles Len ${targetFiles.length}`)
        main(targetFiles)
        console.info(`All Done!`)
    })
    .parse()