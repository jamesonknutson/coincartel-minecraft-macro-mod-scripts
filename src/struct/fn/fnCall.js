module.exports = class FnCall {
    /**
     * @param {object} _
     * @param {import('../fileSystem/file')} _.file - The File that contains this Function Call
     * @param {{ begin: number, end: number }} _.range - The index range of the Characters that make up this Function Call in the File
     * @param {string} _.name - The Name of the Function that is being Called
     * @param {import('./fnDefinition')} _.fnDefinition - The Function Definition that this Function Call is calling
     */
    constructor({ file, range, name, fnDefinition }) {
        this.file         = file;
        this.range = range;
        this.name         = name;
        this.fnDefinition = fnDefinition;
    }
}