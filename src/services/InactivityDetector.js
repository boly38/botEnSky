/**
 * handle app inactivity trigger
 */
export default class InactivityDetector {
    constructor(config, loggerService) {
        this.config = config;
        this.logger = loggerService.getLogger().child({label: 'InactivityDetector'});
        this.INACTIVITY_DELAY_MIN = this.config.inactivityDelayMin || 3;
    }

    onInactivity() {
        InactivityDetector.timer = null;
        for (const handler of InactivityDetector.onInactivityListeners) {
            try {
                handler();
            } catch (exception) {
                this.logger.warn(`onInactivity handler error : ${exception.message}`);
            }
        }
    }

    activityTic() {
        const {onInactivity, INACTIVITY_DELAY_MIN, logger} = this;
        if (InactivityDetector.timer !== null) {
            clearTimeout(InactivityDetector.timer);
        }
        if (InactivityDetector.onInactivityListeners.length > 0) {
            if (InactivityDetector.timer === null) { // first time only
                logger.info(`setTimeout(${INACTIVITY_DELAY_MIN} min, ...) with ${InactivityDetector.onInactivityListeners.length} listeners`)
            }
            InactivityDetector.timer = setTimeout(onInactivity.bind(this), INACTIVITY_DELAY_MIN * 60000);
        }
    }

    registerOnInactivityListener(listener) {
        InactivityDetector.onInactivityListeners.push(listener)
    }
}
InactivityDetector.timer = null;
InactivityDetector.onInactivityListeners = [];