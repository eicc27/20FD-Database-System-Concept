import {validate, requireDir} from "./utils/StrCheckers.js";
import {parse} from "csv-parse/sync";
import * as fs from "fs";
import {StringDecoder} from "string_decoder";

/** CSV data loader.
 * @param dir The CSV file path.
 */
export class DataLoader {
    private dir: string;

    public constructor(dir: string) {
        this.validate(dir);
    }

    @validate
    private validate(@requireDir dir: string) {
        this.dir = dir;
    }

    /** Loads the CSV file with given delimiter.
     * @param delimiter The specified delimiter. Default is `','`(comma).
     * @param head Whether the CSV has a column head.
     * @param encoding The file encoding which is used to decode the input.
     */
    public load(delimiter: string = ',', head: boolean = false, encoding: string = 'utf-8') {
        const file = fs.readFileSync(this.dir);
        const content = new TextDecoder(encoding).decode(file);
        const result = parse(content, {delimiter: delimiter});
        if (head)
            result.shift();
        return result;
    }
}