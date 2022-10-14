import {nn, col, ai} from "../sqlite3/ColumnProps.js"
import { validate, requirePureNumber } from "../utils/StrCheckers.js";


export default class Room {
    @ai()
    public id: number;
    @nn()
    public kdno: string;
    @nn()
    public kcno: string;
    @nn()
    public ccno: string;
    @nn()
    public kdname: string;
    @nn()
    public exptime: Date;
    @col()
    public papername: string | null;

    public constructor(kdno: string,
                       kcno: string,
                       ccno: string,
                       kdname: string,
                       exptime: string,
                       papername?: string) {
        this.validator(kdno, kcno, ccno, kdname, exptime, papername);
    }

    @validate
    private validator(@requirePureNumber kdno: string,
                      @requirePureNumber kcno: string,
                      @requirePureNumber ccno: string,
                       kdname: string,
                       exptime: string,
                       papername: string) {
        this.kdno = kdno;
        this.kcno = kcno;
        this.ccno = ccno;
        this.kdname = kdname;
        this.exptime = exptime ? new Date(exptime) : null;
        this.papername = papername;
    }
}