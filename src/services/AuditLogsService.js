import dayjs from 'dayjs';
import {DEFAULT_TZ} from "../lib/Common.js";

class AuditLogsSingleton {
    constructor() {
        this.auditLogs = [];// in memory audit logs
    }

    static get() {
        if (!AuditLogsSingleton.instance) {
            AuditLogsSingleton.instance = new AuditLogsSingleton();
        }
        return AuditLogsSingleton.instance;
    }
}

export default class AuditLogsService {

    constructor(discordService) {
        this.discordService = discordService;
    }

    createAuditLog(log) {
        const instant = dayjs(new Date()).tz(DEFAULT_TZ).format("DD/MM/YYYY à HH:mm");
        AuditLogsSingleton.get().auditLogs.push({instant, log})
    }

    retrieveAuditLogs(cleanup = false) {
        const logs = AuditLogsSingleton.get().auditLogs;
        const clone = [].concat(logs);
        if (true === cleanup) {
            AuditLogsSingleton.get().auditLogs = [];
        }
        return clone;
    }

    async notifyLogs() {
        const logs = this.retrieveAuditLogs(true);
        // DEBUG // console.log(`*${logs?.length}`);// debug
        if (logs === undefined || logs.length < 1) {
            return;
        }
        let markdown = this.formatMarkdownMessageFromLogs(logs);
        return await this.discordService.sendMessage(markdown);
    }

    formatMarkdownMessageFromLogs(logs) {
        const count = logs.length;
        const nbMsg = count > 1 ? `${count} messages` : `${count} message`;
        let markdown = `${nbMsg} :\n` + "```\n";
        markdown += logs.map(entry => `${entry.instant}|${entry.log}`).join(" \n");
        markdown += "\n```";

        //~ prevent discord limit
        const MAX_DISCORD_MSG_LENGTH = 2000;
        if (markdown.length > MAX_DISCORD_MSG_LENGTH) {
            markdown = markdown.substring(0, MAX_DISCORD_MSG_LENGTH - 12);
            markdown += "\n(...)\n```";
        }
        return markdown;
    }
}
