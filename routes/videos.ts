import { ExpressRouter, POST, Req, GET, Query, Params } from "express-router-ts";
import { SingleFileUpload, ExpressResponse } from "../utils/decors";
import multer = require("multer");
import ENV from "../glob/env";
import uuid = require("uuid");
import { AppLogicError } from "../utils/hera";
import { FFMPEGVideoConvertHandler } from "../serv/workers/handlers/ffmpeg_video_convert_handler";
import WorkerServ from "../serv/workers";
import Video, { VideoModel, IVideo } from "../models/video";
import path = require('path');

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

        const codecs = ['480p_60fps_hlsh264', '480p_30fps_hlsh264'];
        const outDir = `${ENV.FILE_UPLOAD_DIR}/output`;

        const video: IVideo = {
            id: file.filename,
            name: file.originalname,
            created_at: Date.now(),
            
            files: codecs.map(c => ({
                codecName: c,
                path: `${file.filename}_${c}`,
                status: 'WAITING'
            }))
        }

        await Video.addVideo(video);

        video.files.forEach(f => WorkerServ.addJob(f.codecName, {
            id: video.id,
            src: file.path,
            dest: `${outDir}/${f.path}`,
            name: file.filename,
            codec: f.codecName
        }))

        return video
    }

    @GET({path: '/'})
    async getVideos() {
        return await Video.getVideos();
    }

    @GET({path: '/upload.html'})
    @ExpressResponse((data, req, resp) => {
        resp.sendFile(path.resolve(process.cwd(), data))
    })
    async getUploadPage() {
        return 'video_upload.html'
    }

    @GET({path: '/:id'})
    async getVideosById(@Params('id') id: string) {
        return await Video.getVideoById(id);
    }
}

export default new VideoRouter;