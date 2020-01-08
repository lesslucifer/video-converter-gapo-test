import { ExpressRouter, POST, Req } from "express-router-ts";
import { SingleFileUpload } from "../utils/decors";
import multer = require("multer");
import ENV from "../glob/env";
import uuid = require("uuid");
import { AppLogicError } from "../utils/hera";
import { FFMPEGVideoConvertHandler } from "../serv/workers/handlers/ffmpeg_video_convert_handler";
import WorkerServ from "../serv/workers";


export class VideoRouter extends ExpressRouter {
    static DiskStorageEngine = multer.diskStorage({
        destination: (req, file, cb) => cb(null, ENV.FILE_UPLOAD_DIR),
        filename: (req, file, cb) => cb(null, `${uuid()}`)
    })

    static  VideoFileFilter = (req, file, cb) => {
        const extension = file.mimetype.split('/')[0];
        if(extension !== 'video'){
            return cb(new Error('Not a video'), false);
        }
        cb(null, true);
    }

    static MulterOpts = {
        storage: VideoRouter.DiskStorageEngine,
        fileFilter: VideoRouter.VideoFileFilter
    }

    @POST({path: '/'})
    @SingleFileUpload('video', VideoRouter.MulterOpts)
    async uploadNewVideo(@Req('file') file: any) {
        if (!file) throw new AppLogicError(`Invalid file uploaded! Please check and try again!!`, 400);

        const dest = `${ENV.FILE_UPLOAD_DIR}/output/${file.filename}`;
        WorkerServ.addJob('480p_60fps_hlsh264', {
            src: file.path,
            dest: `${dest}_480p_60fps_hlsh264`,
            name: file.filename
        })
        WorkerServ.addJob('480p_30fps_hlsh264', {
            src: file.path,
            dest: `${dest}_480p_30fps_hlsh264`,
            name: file.filename
        })

        return file
    }
}

export default new VideoRouter;