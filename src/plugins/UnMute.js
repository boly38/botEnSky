import {pluginResolve} from "../services/BotService.js";

export default class UnMute {
    constructor(config, loggerService, blueskyService) {
        this.logger = loggerService.getLogger().child({label: 'UnMute'});
        this.logger.level = "INFO"; // DEBUG will show search results
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
        let {context} = config;
        const result = await plugin.unMuteMutedActors(context);
        if (result === null) {
            return Promise.resolve(pluginResolve(`Aucun compte masqué`, `Aucun compte masqué`));
        }
        return Promise.resolve(pluginResolve(`Démasqué ${result}`, `Démasqué ${result}`, 200));
    }

    async unMuteMutedActors(context) {
        try {
            const mutes = await this.blueskyService.getMutes();
            let unMuted = [];
            const result = await Promise.all(mutes.map(
                m => this.blueskyService.safeUnMuteMuted(m, context)
                    .then(() => unMuted.push(m.handle))
            ));
            if (unMuted?.length > 0) {
                this.logger.debug(`unMuteMutedActors result: ${result}`);
                return unMuted;
            }
        } catch (err) {
            this.logger.warn(`unMuteMutedActors err: ${err.message}`, context);
        }
        return null;
    }
}
