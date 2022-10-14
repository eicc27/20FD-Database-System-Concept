import "reflect-metadata";
import * as fs from "fs";
import {Logger, SigLevel} from "./Logger.js";
import chalk from "chalk";

const checker = Symbol('require-checker');
type CheckerType = {
    index: number,
    type: string,
};

/** Declares a class method as for validation.
*
* Decorators are not available on constructors, but it can be used on functions that are called within constructors.
*
* Use along other string checking methods from this file.
*/
export function validate(target: any, propName: string, desc: TypedPropertyDescriptor<Function>) {
    const method = desc.value!;
    desc.value = function () {
//         console.log(arguments);
        const requiredParams: CheckerType[] = Reflect.getOwnMetadata(checker, target, propName);
        if (requiredParams) {
            for (let p of requiredParams) {
                const arg = arguments[p.index];
                switch (p.type) {
                    case 'pure-number':
                        pureNumber(String(arg));
                        break;
                    case 'dir':
                        hasDir(String(arg));
                        break;
                }
            }
        }
        return method.apply(this, arguments);
    };
}

function require(target: Object, propKey: string | symbol, paramIdx: number, type: string) {
    let existingRequiredParams: CheckerType[] = Reflect.getOwnMetadata(checker, target, propKey) || [];
    existingRequiredParams.push({
        index: paramIdx,
        type: type,
    });
    Reflect.defineMetadata(checker, existingRequiredParams, target, propKey);
}

function pureNumber(str: string) {
    if (str == 'null') return;
    const matches = str.match(/[0-9]/g) || [];
    if (matches.length == str.length) return;
    Logger.log(SigLevel.error, `${chalk.redBright(str)} is not pure number`);
    throw new TypeError(`${str} is not pure number`);
}

function hasDir(str: string) {
    if (fs.existsSync(str)) return;
    Logger.log(SigLevel.error, `${chalk.redBright(str)} is not a directory`);
    throw new TypeError(`${str} is not a directory`);
}

/** Checkes whether the parameter consists of pure number.
*
* Uses along with decorator `@validate` from this file.
*/
export function requirePureNumber(target: Object, propKey: string | symbol, paramIdx: number) {
    require(target, propKey, paramIdx, 'pure-number');
}

/** Checkes whether the parameter is a valid directory.
*
* Uses along with decorator `@validate` from this file.
*/
export function requireDir(target: Object, propKey: string | symbol, paramIdx: number) {
    require(target, propKey, paramIdx, 'dir');
}