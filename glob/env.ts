import * as path from 'path';
import newAjv2 from '../utils/ajv2';
import _ from 'lodash';

const ajv = newAjv2();

const ajvEnvConfig = ajv({
    '@NAME': 'string',
    '@HTTP_PORT': 'integer|>0',
    '@LOGGING': 'boolean',
    '+@FILE_UPLOAD_DIR': 'string'
});
export interface ENV_CONFIG {
    NAME: string;
    HTTP_PORT?: number;
    LOGGING?: boolean;

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