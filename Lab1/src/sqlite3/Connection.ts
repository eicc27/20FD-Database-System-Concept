import "reflect-metadata";
import Database from 'better-sqlite3';
import {requireDir, validate} from '../utils/StrCheckers.js';
import {ColumnPropType} from "./ColumnProps.js";
import {createHash} from "crypto";
import chalk from "chalk";
import {Logger, SigLevel} from "../utils/Logger.js";
import moment from "moment";

export function identifier() {
    let timeStr = String((new Date()).getUTCMilliseconds());
    let salt = '';
    for (let i = 0; i < 10; i++) {
        salt += String(Math.floor((Math.random() * 10) % 10));
    }
    let hashStr = timeStr + salt;
    return createHash('sha256').update(hashStr).digest('hex').slice(0, 6);
}

function dbLogger(db: 'SQLite', query: string, id: string, direction: 'from' | 'to', result?: any) {
    let arrow = direction == 'from' ? '<-' : '->';
    let log = ` [${chalk.bgGrey.whiteBright(db)}] [${chalk.bgBlueBright.whiteBright(`#${id}`)} ${chalk.bgGreenBright.whiteBright(arrow)}]: ${chalk.yellowBright(query)}`;
    if (result) {
        if (typeof result == 'object') {
            if (Array.isArray(result))
                log += `length of return: ${chalk.blueBright(result.length)}`;
            else
                log += ` return value's length: ${chalk.blueBright(JSON.stringify(result))}`;
        } else
            log += ` returned ${chalk.blueBright(result)}`;
    }
    Logger.log(SigLevel.info, log);
}

function sqlify(value: string | number | Date) {
    // single quote
    if (value.constructor.name == 'Date')
        value = `${moment(value).format('YYYY-MM-DD HH:MM')}`;
    else
        value = String(value);
    value = value.split("'").join("''");
    value = `'${value}'`;
    return value;
}

function auto(value: any) {
    switch (typeof value) {
        case "number":
            return "integer";
        case "undefined":
            return "null";
        default:
            return "text";
    }
}

/** Establishes a SQLite3 connection.
 * @param database The database file to connect.
 * @param initialTable The table to connect. If the given table is not created, create implicitly.
 */
export default class Connection {
    private table: string;
    private connection: Database.Database;

    public constructor(database: string, initialTable?: any) {
        this.validate(database, initialTable);
    }

    @validate
    private validate(@requireDir database: string, initialTable?: any) {
        this.connection = new Database(database);
        this.table = initialTable.name;
    }

    /** Switches to the given table.
     * @param table The class that represents the table name.
     */
    public switchTable(table: any) {
        this.table = table.name;
        return this;
    }

    /** Creates a table with a given class type.
     * Automatically handles primary key, not null, foreign, auto increment.
     */
    public createTable(type: any) {
        const keys: symbol[] = Reflect.getMetadataKeys(type.prototype);
        let queryStrs: string[] = [];
        let extraStrs: string[] = [];
        let columns: any = {};
        for (let k of keys) {
            const columnProp: ColumnPropType = Reflect.getMetadata(k, type.prototype);
            // `symbol(__column-prop-`.length => 21
            const columnName = k.toString().slice(21, -1);
            // console.log(columnName);
            const columnType = Reflect.getMetadata('design:type', type.prototype, columnName);
            // console.log(columnType);
            if (columns[columnName]) {
                Object.assign(columns[columnName], columnProp);
            } else {
                columns[columnName] = columnProp;
            }
            columns[columnName].type = columnType;
        }
        for (let col in columns) {
            const columnProp = columns[col];
            let queryStr: string;
            if (columnProp.pri)
                queryStr = `\`${col}\` integer`;
            else
                queryStr = `\`${col}\` ${auto(columnProp.type)}`;
            if (columnProp.fri)
                extraStrs.push(`foreign key (\`${col}\`) references ${columnProp.fri.table}(\`${columnProp.fri.column}\`)`);
            if (columnProp.pri)
                queryStr += ` primary key`;
            if (columnProp.ai)
                queryStr += ' autoincrement';
            if (columnProp.nn && !columnProp.ai)
                queryStr += ' not null';
            if (columnProp.uni)
                queryStr += ' unique';
            queryStrs.push(queryStr);
        }
        const query = `create table if not exists ${type.name}
                       (
                           ${queryStrs.concat(extraStrs).join(',')}
                       );`;
        const id = identifier();
        dbLogger('SQLite', query, id, 'to');
        const ret = this.connection.prepare(query).run().changes;
        dbLogger('SQLite', query, id, 'from', ret);
        return this;
    }

    /** Selects some given columns when data equals a given class instance.
     * @param instance The class instance to match data with.
     * @param cols The properties in the class that represent the selected columns
     */
    public selectAllWhenPropertyEqual(instance: any, ...cols: string[]) {
        let selector = '*';
        if (cols.length)
            selector = `\`${cols.join('`,`')}\``;
        let query = `select ${selector}
                     from ${instance.constructor.name}`;
        let conditions: string[] = [];
        const descs = Object.getOwnPropertyDescriptors(instance);
        for (const propName in descs) {
            const value = descs[propName].value;
            if (value === undefined || value === null)
                continue;
            conditions.push(`\`${propName}\`=${sqlify(value)}`);
        }
        if (conditions.length)
            query += ` where ${conditions.join(' and ')};`;
        const id = identifier();
        dbLogger('SQLite', query, id, 'to');
        const ret = this.connection.prepare(query).all();
        dbLogger('SQLite', query, id, 'from', ret.length);
        return ret;
    }

    /**
     * Perform an upsert for each of the instances given.
     * Explicitly making `refCol` `null`(instead of `undefined`) will lead to auto-detection for primary key
     * (excluding auto-increment key) of the instance(s).
     * Throws `EvalException` if `refCol` is given `null` and auto detection is failed,
     * or the instance doesn't contain `refCol`'s value.
     * @param instance The instance to insert or update.
     * @param refCol The reference column to detect conflict. Must be unique.
     */
    public upsert(instance: any | any[], refCol?: string) {
        // pre condirions
        if (!instance || (Array.isArray(instance) && !instance.length))
            return;
        const isArray = Array.isArray(instance);
        let reference = refCol;
        if (reference === null) {
            let i: any = instance;
            if (isArray) i = instance[0];
            // checks `pri` in metadata
            const props = Reflect.getMetadataKeys(i);
            for (const prop of props) {
                const metadata: ColumnPropType = Reflect.getMetadata(prop, i);
                if (metadata.pri && !metadata.ai) {
                    reference = prop.toString().slice(21, -1);
                    break;
                }
            }
            if (reference === null) { // hasn't change during the for loop: detection failed
                Logger.log(SigLevel.error, `Upsert failed for explicitly omitted refCol and auto-detection failure`);
                throw new EvalError(`Upsert failed for explicitly omitted refCol and auto-detection failure`);
            }
        }
        // upsert itself
        if (!isArray)
            this._upsert(instance, refCol);
        else {
            for (const i of instance) this._upsert(i, refCol);
        }
        return this;
    }

    private _upsert(instance: any, refCol?: string) {
        let columns = [];
        let values = [];
        const props = Object.getOwnPropertyDescriptors(instance);
        // the instance doesn't contain `refCol`'s value
        if (refCol && (!Object.keys(props).includes(refCol) || !props[refCol].value)) {
            Logger.log(SigLevel.error, `Upsert failed for not providing ${refCol}'s value in the instance.`);
            throw new EvalError(`Upsert failed for not providing ${refCol}'s value in the instance.`);
        }
        for (const prop in props) {
            const value = props[prop].value;
            if (value !== undefined && value !== null) {
                values.push(sqlify(value));
                columns.push(`\`${prop}\``);
            }
        }
        let query = `insert into ${this.table} (${columns.join(',')})
                     values (${values.join(',')})`;
        if (refCol) {
            // extracts ref column and its value out
            let i = columns.findIndex((v) => {
                return v.slice(1, -1) == refCol;
            });
            // console.log(i);
            if (i >= 0) {
                columns.splice(i, 1);
                let v = values.splice(i, 1)[0];
                query += ` on conflict (${refCol}) do update set (${columns.join(',')})=(${values.join(',')}) where (${refCol}=${v});`;
            }
        }
        let id = identifier();
        dbLogger('SQLite', query, id, 'to');
        let ret = this.connection.prepare(query).run().changes;
        dbLogger('SQLite', query, id, 'from', ret);
    }

    /** The non-upsert version that typically takes 2 steps for update: first query, if satisfies then update the
     * first query result, else insert.
     * @param instance The instance to be inserted or updated.
     * @param conditionalInstance Some part of key names that serve as a query(`and`), which is a subset of `instance`.
     */
    public insert_or_update(instance: any | any[], ...conditionalInstance: string[]) {
        if (Array.isArray(instance)) {
            for (const i of instance) {
                this._insert_or_update(i, ...conditionalInstance);
            }
        } else
            this._insert_or_update(instance, ...conditionalInstance);
        return this;
    }

    private _insert_or_update(instance: any, ...conditionalInstance: string[]) {
        const conditionalInstances = [...conditionalInstance];
        let resultMap: any = {};
        for (const condition of conditionalInstances) {
            const value = Object.getOwnPropertyDescriptor(instance, condition).value;
            resultMap[condition] = value;
        }
        let query = `select *
                     from ${instance.constructor.name}
                     where `;
        let conditions: string[] = [];
        for (const k in resultMap) {
            conditions.push(`\`${k}\`=${sqlify(resultMap[k])}`);
        }
        query += `${conditions.join(' and ')};`;
        const id = identifier();
        dbLogger('SQLite', query, id, 'to');
        const ret = this.connection.prepare(query).all();
        dbLogger('SQLite', query, id, 'from', ret);
        if (!ret.length) // performs an insert
        {
            this.upsert(instance);
            return this;
        }
        // else performs an update
        const target = ret[0];
        query = `update ${instance.constructor.name}
                 set `;
        const props = Object.getOwnPropertyDescriptors(instance);
        let updates: string[] = [];
        for (const p in props) {
            const val = props[p].value;
            if (val === undefined || val === null) continue;
            updates.push(`\`${p}\`=${sqlify(val)}`);
        }
        query += updates.join(',');
        query += ' where ';
        let queries: string[] = [];
        for (const k in resultMap) {
            queries.push(`\`${k}\`=${sqlify(resultMap[k])}`);
        }
        query += `(${queries.join(' and ')});`;
        const id_2 = identifier();
        dbLogger('SQLite', query, id_2, 'to');
        const ret_2 = this.connection.prepare(query).run().changes;
        dbLogger('SQLite', query, id_2, 'from', ret);
    }
}