import {nn, pri, fri, uni} from "../sqlite3/ColumnProps.js";
import {requirePureNumber, validate} from "../utils/StrCheckers.js";

export default class Student {
    @pri()
    public id: number;
    @nn()
    @uni()
    public registno: string;
    @nn()
    public name: string;
    @nn()
    public kdno: string;
    @nn()
    public kcno: string;
    @nn()
    public ccno: string;
    @nn()
    public seat: string;

    public constructor(registno: string,
                       name: string,
                       kdno: string,
                       kcno: string,
                       ccno: string,
                       seat: string,
    ) {
        this.validate(registno, name, kdno, kcno, ccno, seat);
    }

    @validate
    private validate(@requirePureNumber registno: string,
                     name: string,
                     @requirePureNumber kdno: string,
                     @requirePureNumber kcno: string,
                     @requirePureNumber ccno: string,
                     seat: string,) {
        this.registno = registno;
        this.name = name;
        this.kdno = kdno;
        this.kcno = kcno;
        this.ccno = ccno;
        this.seat = seat;
    }
}