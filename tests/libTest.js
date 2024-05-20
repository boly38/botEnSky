import {expect} from "chai";
import dotEnvFlow from 'dotenv-flow';
export const initEnv = () => {
    //~ project init of environment
    dotEnvFlow.config({ path: 'env/' });
}
export const _expectNoError = (err) => {
    console.error("_expectNoError", err);
    console.trace();// print stack
    expect.fail(err);
}
export const assumeSuccess = (err, res) => {
    if (err) {
        expect.fail(err);
    }
    if (res.status && (res.status < 200 || res.status > 299)) {
        console.log("res status:", res.status, "body:", res.body);
    }
    expect(res.status).to.be.within(200, 299, `response status 2xx success expected`);
}

