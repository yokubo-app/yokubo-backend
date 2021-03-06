// tslint:disable-next-line:import-name
import _ = require("lodash");
import log from "./log";
import sequelize from "./sequelize";

export async function dropTables(): Promise<void> {
    await sequelize.getQueryInterface().dropAllTables();
}

export async function bulkImport(fixture: Object): Promise<void> {

    for (const modelName of Object.keys(fixture)) {
        log.debug(`Inserting fixture set for ${modelName}`);
        await (sequelize._[modelName] as any).bulkCreate((fixture as any)[[modelName] as any]);
    }

}

export async function preventTimingAttack(): Promise<any> {
    return Promise.delay(_.random(50, 300));
}
