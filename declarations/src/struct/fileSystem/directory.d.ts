export = Directory;
declare class Directory {
    static get fileExtensions(): string[];
    /**
     * @param {string} path - The Path to the Directory.
     * @param {Directory} [parentDir=null] - The Parent Directory of this Directory, or null if this is the Root Directory.
     * @param {'SOURCE'|'PRODUCTION'} [type='SOURCE'] - What type of Data this Directory holds. If set as 'SOURCE', then the
     * Files found within all subdirectories of this Directory will be scanned for Function Definitions. If set as 'PRODUCTION',
     * the Files found within will be scanned for Function Calls only, and any Function Calls found will be resolved to their Definitions
     * and added as an Import when writing the Output for this Directory.
     */
    constructor(path: string, parentDir?: Directory, type?: 'SOURCE' | 'PRODUCTION', _dirEnts: any, _subdirectories: any, _files: any, _recursiveFiles: any);
    path: string;
    type: "SOURCE" | "PRODUCTION";
    parentDir: import("./directory");
    lastModifiedAt: any;
    _dirEnts: any;
    _subdirectories: any;
    _files: any;
    _recursiveFiles: any;
    update(): void;
    get isOutOfDate(): boolean;
    /** @type {Directory} */
    get root(): import("./directory");
    get dirEnts(): any;
    get subdirectories(): any;
    get files(): any;
    /** @type {File[]} */
    get recursiveFiles(): File[];
}
import File = require("./file");
