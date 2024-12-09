export = File;
declare class File {
    /**
     * @param {string} path - The File Path
     * @param {import('./directory')} dir - The Directory that contains this File.
     * @param {'SOURCE'|'PRODUCTION'} [type='SOURCE'] - What type of Data this File holds. If set as 'SOURCE', then the
     * Files found within all subdirectories of this File will be scanned for Function Definitions. If set as 'PRODUCTION',
     * the Files found within will be scanned for Function Calls only, and any Function Calls found will be resolved to their Definitions
     * and added as an Import when writing the Output for this File.
    */
    constructor(path: string, dir: import('./directory'), type?: 'SOURCE' | 'PRODUCTION', _text: any, _lines: any, _fnDefinitions: any);
    path: string;
    dir: import("./directory");
    type: "SOURCE" | "PRODUCTION";
    lastModifiedAt: any;
    _text: any;
    _lines: any;
    _fnDefinitions: any;
    update(): void;
    get isOutOfDate(): boolean;
    get text(): any;
    get lines(): any;
    get fnDefinitions(): any;
}
