/* eslint-disable no-undef */
/**
 * handle app inactivity trigger
 */
export default class InactivityDetector {
    constructor(config, loggerService) {
        this.config = config;
        this.logger = loggerService.getLogger().child({label: 'InactivityDetector'});
        this.INACTIVITY_DELAY_MIN = this.config.inactivityDelayMin || 3;
    }

    async clearTimerIfAny() {
        if (InactivityDetector.timer !== null) {
            await clearTimeout(InactivityDetector.timer);
        }
        InactivityDetector.timer = null;
    }

    async onInactivity() {
        this.clearTimerIfAny();
        for (const handler of InactivityDetector.onInactivityListeners) {
            try {
                await handler();
            } catch (exception) {
                this.logger.warn(`onInactivity handler error : ${exception.message}`);
            }
        }
    }

    async activityTic() {
        const {onInactivity, INACTIVITY_DELAY_MIN, logger} = this;
        await this.clearTimerIfAny();
        if (InactivityDetector.onInactivityListeners.length > 0) {
            if (InactivityDetector.timer === null) { // first time only
                logger.debug(`setTimeout(${INACTIVITY_DELAY_MIN} min, ...) with ${InactivityDetector.onInactivityListeners.length} listeners`)
            }
            InactivityDetector.timer = setTimeout(onInactivity.bind(this), INACTIVITY_DELAY_MIN * 60000);
        }
    }

    registerOnInactivityListener(listener) {
        InactivityDetector.onInactivityListeners.push(listener)
    }

    async shutdown() {
        this.logger.info(`shutdown`);
        await this.onInactivity();
    }
}
InactivityDetector.timer = null;
InactivityDetector.onInactivityListeners = [];