export interface IWorkerJob {
    data: any;
    meta: any;
}

export interface IWorkerHandler {
    init(): Promise<void>;
    doJob(job: IWorkerJob): Promise<void>
}

export interface IWorkerEngineConsumer {
    (msg: IWorkerJob): Promise<void>;
}

export interface IWorkerEngine {
    init(): Promise<void>;
    consume(consumer: IWorkerEngineConsumer): Promise<any>;
    ack(msg: any): Promise<any>;
}

export class Worker {
    constructor(private handler: IWorkerHandler, private engine: IWorkerEngine) { }

    async start() {
        await this.engine.init();
        await this.handler.init();

        this.engine.consume(async (msg) => {
            try {
                await this.handler.doJob(msg);
                this.engine.ack(msg); // TODO: handle infity ack
            }
            catch (err) {
                console.error(err);
            }
        })
    }
}