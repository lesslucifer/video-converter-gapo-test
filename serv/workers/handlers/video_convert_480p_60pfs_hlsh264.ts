import _ from "lodash";
import { IWorkerHandler, IWorkerJob } from "../worker";
import { AppLogicError } from "../../../utils/hera";
import moment from "moment";
import ENV from "../../../glob/env";
import newAjv2 from "../../../utils/ajv2";
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs-extra';

interface IFFMPEGVideoConverterData {
    src: string;
    dest: string;
    name: string;
}

export class FFMPEGVideoConvertHandler implements IWorkerHandler {
    private dataAssertion = newAjv2()({
        '+@src': 'string',
        '+@dest': 'string',
        '+@name': 'string'
    })

    async init() { }

    assertData(data: any) {
        if (!this.dataAssertion(data)) throw new Error(`Invalid data format!!`)

        return <IFFMPEGVideoConverterData> data;
    }

    async doJob(job: IWorkerJob): Promise<void> {
        try {
            const data = this.assertData(job.data);

            await fs.mkdirp(data.dest);
            
            const cmd = ffmpeg(data.src).outputFPS(60).size('640x?').aspect('4:3').videoCodec('libx264')
            .outputOptions(['-crf 24', '-preset veryfast', '-scodec copy'])
            .outputOptions(['-g 48', '-keyint_min 48', '-sc_threshold 0', '-hls_time 4', '-hls_playlist_type vod'])
            .output(`${data.dest}/${data.name}.m3u8`);

            await FFMPEGVideoConvertHandler.promisifyRunFFMPEGCommand(cmd);
        }
        catch (err) {
            // TODO: need to have a way to trace back, not just log
            console.error(err);
        }
    }

    static promisifyRunFFMPEGCommand(cmd: ffmpeg.FfmpegCommand, timeout: number = 600000) { // default 10 mins timeout
        let isTimedout = false;
        return new Promise((res, rej) => {
            if (timeout > 0) {
                setTimeout(() => {
                    isTimedout = true;
                    rej(new Error(`Timed out! No response after ${timeout} msecs`));
                }, timeout);
            }

            cmd.on('error', (...args) => !isTimedout && rej(...args)).on('end', (...args) => !isTimedout && res(...args)).run();
        })
    }
}