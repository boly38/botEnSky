import dotEnvFlow from 'dotenv-flow';
export const initEnv = () => {
    //~ project init of environment
    dotEnvFlow.config({ path: './env/' });
}