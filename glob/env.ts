import * as path from 'path';
import newAjv2 from '../utils/ajv2';
import _ from 'lodash';

const ajv = newAjv2();

const ajvConnConfig = {
    'REDIS': {},
    'RSMQ': {}
};
export interface ENV_CONN_CONFIG {
    REDIS?: any;
    RSMQ?: any;
}

const ajvWorkerConfig = {
    '+@exchange': 'string',
    'options': {}
}
export interface ENV_WORKER_CONFIG {
    exchange: string;
    options?: any;
}

const ajvProcessConfig = {
    '@worker': 'boolean',
    '@http': 'boolean'
}
interface ENV_PROCESS_CONFIG {
    worker: boolean;
    http: boolean;
}

const ajvEnvConfig = ajv({
    '@NAME': 'string',
    '@HTTP_PORT': 'integer|>0',
    '+@CONN': ajvConnConfig,
    '@WORKER': ajvWorkerConfig,
    '+@PROCESS': ajvProcessConfig,
    '+@FILE_UPLOAD_DIR': 'string'
});
export interface ENV_CONFIG {
    NAME: string;
    HTTP_PORT?: number;
    
    CONN: ENV_CONN_CONFIG;
    WORKER?: ENV_WORKER_CONFIG;
    PROCESS: ENV_PROCESS_CONFIG;

    FILE_UPLOAD_DIR: string;
}



function loadConfig() {
    const config = require(path.resolve(process.cwd(), process.env.config || './env.json'));
    if (ajvEnvConfig(config) != true) {
        throw new Error(`Invalid config format! ${ajvEnvConfig.errors.map(err => `${err.message} (${err.schemaPath})`).join('\n')}`);
    }

    return config;
}

export const ENV: ENV_CONFIG = loadConfig();
export default ENV;