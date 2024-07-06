import {pluginResolve} from "../services/BotService.js";

const TEST_SIMULATION_HANDLE = "martijnrijk.bsky.social";

export default class UnMute {
    constructor(config, loggerService, blueskyService) {
        this.logger = loggerService.getLogger().child({label: 'UnMute'});
        this.blueskyService = blueskyService;
        this.isAvailable = true;
    }

    getName() {
        return "UnMute";
    }

    isReady() {
        return this.isAvailable;
    }

    async process(config) {
        const plugin = this;
        let {context, doSimulate} = config;
        const result = await plugin.unMuteMutedActors({context, doSimulate});
        if (result === null) {
            return Promise.resolve(pluginResolve(`Aucun compte masqué`, `Aucun compte masqué`));
        }
        return Promise.resolve(pluginResolve(`Démasqué ${result}`, `Démasqué ${result}`));
    }

    async unMuteMutedActors(config) {
        const {logger, blueskyService} = this;
        const {context, doSimulate} = config;
        try {
            let mutes = await blueskyService.getMutes();
            logger.debug(`MUTES ARE: ${JSON.stringify(mutes)}`, context);
            let unMuted = [];
            if (doSimulate === true) {
                mutes = mutes.filter(m => TEST_SIMULATION_HANDLE === m?.handle);// for tests unmute is limited to one entry
            }
            const result = await Promise.all(mutes.map(
                m => blueskyService.safeUnMuteMuted(m, context)
                    .then(() => unMuted.push(m.handle))
            ));
            if (unMuted?.length > 0) {
                logger.debug(`${doSimulate === true ? "SIMULATE" : ""} unMuteMutedActors result: ${result}`, context);
                return unMuted;
            }
        } catch (err) {
            logger.warn(`unMuteMutedActors err: ${err.message}`, context);
        }
        return null;
    }
}
