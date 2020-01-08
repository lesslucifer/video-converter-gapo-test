import _ from 'lodash';
import * as amqp from 'amqplib';
import ENV, { ENV_CONN_CONFIG } from './env';
import HC from './hc';
import Redis = require('ioredis');
import RedisSMQ from 'rsmq';

// ************ CONFIGS ************
export class Connection {
    private redis: Redis.Redis;
    private rsmq: RedisSMQ;

    get REDIS() { return this.redis; }
    get RSMQ() { return this.rsmq; }
    
    get REDIS_ROOT() {
        return `${HC.APP_NAME}:${ENV.NAME}`;
    }
    
    async configureConnections(cf: ENV_CONN_CONFIG) {
        this.redis = cf.REDIS && new Redis(cf.REDIS);
        this.rsmq = cf.RSMQ && new RedisSMQ(cf.RSMQ);
    }
}

const CONN = new Connection();
export default CONN;