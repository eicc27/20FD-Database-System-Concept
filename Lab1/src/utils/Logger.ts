import chalk, {ChalkInstance} from "chalk";

export enum SigLevel {
    ok = 'ok',
    error = 'error',
    warning = 'warning',
    info = 'info'
}

export class Logger {
    private static defaultColorMapper(sigLevel: SigLevel): ChalkInstance {
        switch (sigLevel) {
            case SigLevel.ok:
                return chalk.green;
            case SigLevel.error:
                return chalk.red;
            case SigLevel.info:
                return chalk.blueBright;
            case SigLevel.warning:
                return chalk.yellowBright;
        }
    }

    public static log(sigLevel: SigLevel, msg: string | unknown) {
        let colorFunction = Logger.defaultColorMapper(sigLevel);
        console.log(`[${colorFunction(sigLevel)}] [${chalk.gray(new Date())}] ${msg}`);
    }
}