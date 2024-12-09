export = FnDefinition;
declare class FnDefinition {
    /**
     * Checks if a String of Text contains a Function Definition.
     * @param {string} line - The String to check for a Function Definition within.
     * @returns {{ isBody: boolean, name?: string }} - If the String contains a Function Definition, returns an Object with the name of the Function.
     */
    static isBodyStart(line: string): {
        isBody: boolean;
        name?: string;
    };
    /**
     * Checks if a String of Text ends a Function Definition.
     * @param {string} line - The String to check for a Function Definition end keyword within.
     * @returns {boolean}
     */
    static isBodyEnd(line: string): boolean;
    /**
     * Checks if a String of Text is a Documentation (comment) String.
     * @param {string} line - The String to check for being a Documentation Line.
     * @returns {boolean}
     */
    static isDocumentation(line: string): boolean;
    /**
     * @param {object} _
     * @param {import('../fileSystem/file')} _.file - The File that contains this Function Definition
     * @param {{ begin: number, end: number }} _.body - The index range of the lines that make up the body of this Function in the File
     * @param {{ begin: number, end: number }} _.doc - The index range of the lines that make up the documentation of this Function in the File
     * @param {string} _.name - The name of this Function
     */
    constructor({ file, doc, body, name }: {
        file: import('../fileSystem/file');
        body: {
            begin: number;
            end: number;
        };
        doc: {
            begin: number;
            end: number;
        };
        name: string;
    }, _calls: any);
    file: import("../fileSystem/file");
    doc: {
        begin: number;
        end: number;
    };
    body: {
        begin: number;
        end: number;
    };
    name: string;
    _calls: any;
    get bodyLines(): any;
    get bodyText(): any;
    get calls(): Map<string, FnCall>;
    /**
     * Extracts all of the Unique Function Calls from this Function Definition.
     * @param {import('./fnDefinition.js')[]} functions - All known Function Definitions.
     * @returns {Map.<string, FnCall>} - A Map of Function Call Names to Function Calls.
     */
    extractCalls(functions: import('./fnDefinition.js')[]): Map<string, FnCall>;
}
import FnCall = require("./fnCall");
