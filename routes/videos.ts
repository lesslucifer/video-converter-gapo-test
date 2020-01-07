import { ExpressRouter, POST, Req } from "express-router-ts";
import { SingleFileUpload } from "../utils/decors";
import multer = require("multer");
import ENV from "../glob/env";
import uuid = require("uuid");
import { AppLogicError } from "../utils/hera";


export class VideoRouter extends ExpressRouter {
    static DiskStorageEngine = multer.diskStorage({
        destination: (req, file, cb) => cb(null, ENV.FILE_UPLOAD_DIR),
        filename: (req, file, cb) => cb(null, `${uuid()}`)
    })

    static  VideoFileFilter = (req, file, cb) => {
        const extension = file.mimetype.split('/')[0];
        if(extension !== 'video'){
            return cb(null, false);
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

        // create file object and push to process queue

        return file
    }
}

export default new VideoRouter;