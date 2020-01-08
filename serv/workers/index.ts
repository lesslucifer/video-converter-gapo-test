import { Channel } from "amqplib";
import { Worker } from "./worker";
import { RMQEngine } from "./engines/rmq_engine";
import ENV from "../../glob/env";
import hera, { AppLogicError } from "../../utils/hera";
import CONN from "../../glob/conn";

export class WorkerServ {
    static rmqChannel?: Channel;
    static workers: Worker[] = [];

    static async init() {
        if (CONN.RMQ) {
            this.rmqChannel = await CONN.RMQ.createChannel();

            

            await this.rmqChannel.assertExchange(ENV.WORKER.exchange, 'direct', ENV.WORKER.options);
        }
    }

    static addJob(type: string, data: any) {
        if (this.rmqChannel) {
            return this.rmqChannel.publish(ENV.WORKER.exchange, type, new Buffer(JSON.stringify(data)));
        } else {
            console.log('RabitMQ Channel not found. Cannot add job ', type, JSON.stringify(data));
            throw new AppLogicError("RabitMQ Channel not found");
        }
    }

    static async startWorkers() {
        await this.init();
        await Promise.all(this.workers.map(w => w.start()));
    }
}

export default WorkerServ;