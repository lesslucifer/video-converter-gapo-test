import _ from 'lodash';
import * as amqp from 'amqplib';
import { ENV_CONN_CONFIG } from './env';


// ************ CONFIGS ************
export class Connection {
    private rmq: amqp.Connection;

    get RMQ() { return this.rmq; }

    async configureConnections(cf: ENV_CONN_CONFIG) {
        try {
            this.rmq = cf.AMQP && await amqp.connect(cf.AMQP.connection, cf.AMQP.options);
        }
        catch (err) {
            console.log(`RabbitMQ not connected!`);
            console.error(err);
        }
    }
}

const CONN = new Connection();
export default CONN;