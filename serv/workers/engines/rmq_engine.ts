import { IWorkerEngine, IWorkerJob, IWorkerEngineConsumer } from "../worker";
import * as rmq from 'amqplib';

export class RMQEngine implements IWorkerEngine {
    constructor(
        private channel: rmq.Channel,
        private exchange: string,
        private queue: string,
        private routingKey: string,
        private queueOpts?: rmq.Options.AssertQueue
    ) { }

    async init(): Promise<void> {
        await this.channel.assertQueue(this.queue, this.queueOpts);
        await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);
    }    
    
    async consume(consumer: IWorkerEngineConsumer): Promise<any> {
        return await this.channel.consume(this.queue, (msg) => {
            const job: IWorkerJob = {
                data: msg.content && JSON.parse(msg.content.toString()),
                meta: { msg: msg }
            };

            consumer(job);
        });
    }

    async ack(job: IWorkerJob): Promise<any> {
        job.meta && job.meta.msg && this.channel.ack(job.meta.msg);
    }
}