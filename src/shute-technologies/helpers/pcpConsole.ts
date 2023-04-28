import { STHelpers } from "shute-technologies.common-and-utils";

export class PCPDebugConsole {

  static log<TInstance extends Object>(fromClass: TInstance, message: string, ...args: string[]): void {
    console.log(`${fromClass.constructor.name}-> ${STHelpers.formatString (message, ...args)}`);
  }

  static warn<TInstance extends Object>(fromClass: TInstance, message: string, ...args: string[]): void {
    console.warn(`${fromClass.constructor.name}-> ${STHelpers.formatString (message, ...args)}`);
  }

  static error<TInstance extends Object>(fromClass: TInstance, message: string, ...args: string[]): void {
    console.error(`${fromClass.constructor.name}-> ${STHelpers.formatString (message, ...args)}`);
  }

  static throwError<TInstance extends Object>(fromClass: TInstance, message: string, ...args: string[]) {
    throw Error(`${fromClass.constructor.name}-> ${STHelpers.formatString (message, ...args)}`);
  }
}
