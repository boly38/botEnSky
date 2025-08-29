import net from "net";

export const tryToConnectToSocketWithRetry = (timeout, port, host, maxRetries, logger) => {
    const tryConnect = async (retryCount = 0) => {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            let isConnected = false;

            socket.setTimeout(timeout);

            socket.on('connect', () => {
                isConnected = true;
                socket.destroy();
                resolve(true);
            });

            socket.on('timeout', () => {
                socket.destroy();
                reject(new Error('Connection timeout'));
            });

            socket.on('error', (err) => {
                socket.destroy();
                reject(err);
            });

            socket.connect(port, host);
        }).catch(async (err) => {
            if (retryCount < maxRetries) {
                logger.warn(`Retry ${retryCount + 1}/${maxRetries} for port check: ${err.message}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return tryConnect(retryCount + 1);
            }
            throw err;
        });
    };
    return tryConnect;
}