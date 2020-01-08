import { IWorkerEngine, IWorkerJob, IWorkerEngineConsumer } from "../worker";
import RedisSMQ = require("rsmq");
import hera from "../../../utils/hera";
import { isEmpty } from "lodash";

export class RSMQEngine implements IWorkerEngine {
    private consumeTimer: NodeJS.Timeout;

    constructor(
        private rsmq: RedisSMQ,
        private queueOpts: RedisSMQ.CreateQueueOptions,
        private fetchInterval: number = 1000
    ) { }

    async init(): Promise<void> {
        try {
            await this.rsmq.createQueueAsync(this.queueOpts);
        }
        catch (err) {
            // ignore if the queue is exist
        }
    }

    async consume(consumer: IWorkerEngineConsumer): Promise<any> {
        this.consumeTimer = setInterval(async () => {
            while (true) {
                const msg = await this.rsmq.receiveMessageAsync({ qname: this.queueOpts.qname }) as RedisSMQ.QueueMessage;
                if (isEmpty(msg)) break;
                
                consumer({
                    data: JSON.parse(msg.message),
                    meta: {
                        msg: msg
                    }
                });
            }
        }, this.fetchInterval)
    }

    async ack(job: IWorkerJob): Promise<any> {
        return await this.rsmq.deleteMessageAsync({ qname: this.queueOpts.qname, id: job.meta.msg.id })
    }
}