import { Channel } from "amqplib";
import { Worker } from "./worker";
import { RMQEngine } from "./engines/rmq_engine";
import ENV from "../../glob/env";
import hera, { AppLogicError } from "../../utils/hera";
import CONN from "../../glob/conn";
import { FFMPEGVideoConvertHandler, _480p_30fps_hlsh264Mod, _480p_60fps_hlsh264Mod } from "./handlers/ffmpeg_video_convert_handler";
import { RSMQEngine } from "./engines/rsmq_engine";
import RedisSMQ = require("rsmq");

export class WorkerServ {
    static rsmq: RedisSMQ;
    static workers: Worker[] = [];

    static async init() {
        this.rsmq = CONN.RSMQ;
        if (!this.rsmq) return;

        this.workers.push(new Worker(new FFMPEGVideoConvertHandler(_480p_60fps_hlsh264Mod), new RSMQEngine(this.rsmq, {qname: '480p_60fps_hlsh264'})));
        this.workers.push(new Worker(new FFMPEGVideoConvertHandler(_480p_30fps_hlsh264Mod), new RSMQEngine(this.rsmq, {qname: '480p_30fps_hlsh264'})));
    }

    static addJob(type: string, data: any) {
        if (this.rsmq) {
            return this.rsmq.sendMessageAsync({qname: type, message: JSON.stringify(data)})
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