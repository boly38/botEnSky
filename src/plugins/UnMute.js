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
                return Promise.resolve({"text": `Aucun compte masqué`, "html": `Aucun compte masqué`, "status": 200});
            }
            return Promise.resolve({"text": `Démasqué ${result}`, "html": `Démasqué ${result}`, "status": 200});
    }

    unMuteMutedActors(context) {
        const plugin = this;
        return new Promise((resolve, reject) => {
            plugin.blueskyService.getMutes()
                .then(mutes => {
                    let unMuted = [];
                    Promise.all(mutes.map(
                        m => plugin.blueskyService.safeUnMuteMuted(m, context)
                            .then(() => unMuted.push(m.handle))
                    ))
                        .then(result => {
                            plugin.logger.debug(`unmuteOldMutedActors result: ${result}`);
                            if (unMuted?.length > 0) {
                                plugin.logger.info(`un-muted: ${unMuted}`, context);
                                return resolve(unMuted);
                            }
                            return resolve(null);
                        })
                        .catch(err => plugin.logger.warn(`unmuteOldMutedActors err: ${err.message}`, context))
                })
                .catch(reject)
        });
    }
}
