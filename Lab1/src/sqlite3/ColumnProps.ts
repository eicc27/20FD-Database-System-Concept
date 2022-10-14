import chalk from "chalk";
import "reflect-metadata";
import {Logger, SigLevel} from "../utils/Logger.js";

export type ColumnPropType = {
    nn?: boolean,
    pri?: boolean,
    ai?: boolean,
    uni?: boolean,
    fri?: {
        table: string,
        column: string
    }
}

function multiplePri(C: any) {
    const keys = Reflect.getMetadataKeys(C);
    let priCount: number = 0;
    let aiCount: number = 0;
    for (let k of keys) {
        const value: ColumnPropType = Reflect.getMetadata(k, C);
        if (value.pri) ++priCount;
        if (value.ai) ++aiCount;
    }
    if (priCount > 1 || aiCount > 1) {
        Logger.log(SigLevel.error, `Class ${chalk.redBright(C.constructor.name)} has multiple primary keys`);
        throw new EvalError(`${C.name} has multiple primary keys`);
    }
}

export function nn(): PropertyDecorator {
    return (target, key: string) => {
        const sym = Symbol(`__column-prop-${key}`);
        Reflect.defineMetadata(sym, {nn: true}, target);
    };
}

export function pri(): PropertyDecorator {
    return (target, key: string) => {
        const sym = Symbol(`__column-prop-${key}`);
        Reflect.defineMetadata(sym, {pri: true, nn: true}, target);
        multiplePri(target);
    };
}

export function ai(): PropertyDecorator {
    return (target, key: string) => {
        const sym = Symbol(`__column-prop-${key}`);
        Reflect.defineMetadata(sym, {ai: true, pri: true, nn: true}, target);
        multiplePri(target);
    };
}

/** TODO: the referenced side of foreign key must be unique
*/
export function fri(table: string, column: string): PropertyDecorator {
    return (target, key: string) => {
        const sym = Symbol(`__column-prop-${key}`);
        Reflect.defineMetadata(sym, {fri: {table: table, column: column}}, target);
    };
}

export function uni(): PropertyDecorator {
    return (target, key: string) => {
        const sym = Symbol(`__column-prop-${key}`);
        Reflect.defineMetadata(sym, {uni: true}, target);
    };
}

export function col(): PropertyDecorator {
    return (target, key: string) => {
        const sym = Symbol(`__column-prop-${key}`);
        Reflect.defineMetadata(sym, {}, target);
    };
}