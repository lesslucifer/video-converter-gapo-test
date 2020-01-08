import { ExpressRouter, POST, Req } from "express-router-ts";
import { SingleFileUpload } from "../utils/decors";
import multer = require("multer");
import ENV from "../glob/env";
import uuid = require("uuid");
import { AppLogicError } from "../utils/hera";
import { FFMPEGVideoConvertHandler } from "../serv/workers/handlers/video_convert_480p_60pfs_hlsh264";


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

        const dest = `${ENV.FILE_UPLOAD_DIR}/output/${file.filename}`

        const result = await new FFMPEGVideoConvertHandler().doJob({
            data: {
                src: file.path,
                dest,
                name: file.filename
            },
            meta: {}
        })

        return file
    }
}

export default new VideoRouter;