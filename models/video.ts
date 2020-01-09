import CONN from "../glob/conn";
import _ from "lodash";
import { AppLogicError } from "../utils/hera";

export interface IVideoFile {
    codecName: string;
    path: string;

    status: string;
}

export interface IVideo {
    id: string;
    name: string;
    created_at: number;

    files: IVideoFile[];
}

export class VideoModel {
    get Redis() {
        return CONN.REDIS;
    }

    get RedisKey() {
        return `${CONN.REDIS_ROOT}:videos`
    }

    VideoKey(id: string) {
        return `${this.RedisKey}:${id}`
    }

    async addVideo(video: IVideo) {
        const time = Date.now();

        await this.Redis.zadd(this.RedisKey, `${time}`, video.id)
        await this.updateVideo(video, true)
    }

    private serializeVideo(video: Partial<IVideo>, withVideoList: boolean) {
        const data: any = {}
        if('id' in video) data['id'] = video['id'];
        if('name' in video) data['name'] = video['name'];
        if('created_at' in video) data['created_at'] = video['created_at'];

        if('files' in video) {
            if (withVideoList) {
                data['files'] = video.files.map(f => f.codecName).join(',')
            }
            _.extend(data, this.serVideoFilesData(video.files))
        }

        return data;
    }

    private serVideoFilesData(files: Partial<IVideoFile>[]) {
        return files.reduce((d, f) => {
            if (!('codecName' in f)) throw new AppLogicError(`Cannot serialize video data. File data must have codecName`)
            d[`files.${f.codecName}.codecName`] = f.codecName;
            if ('path' in f) d[`files.${f.codecName}.path`] = f.path;
            if ('status' in f) d[`files.${f.codecName}.status`] = f.status;

            return d;
        }, {});
    }

    private parseVideo(data: Object) {
        return {
            id: data['id'],
            name: data['name'],
            created_at: Number(data['created_at']),
            files: this.parseVideoFiles(data),
        }
    }

    private parseVideoFiles(data: Object) {
        const codecNames: string[] = data['files'] ? data['files'].split(',') : [];

        return codecNames.map(cn => <IVideoFile> {
            codecName: cn,
            path: data[`files.${cn}.path`],
            status: data[`files.${cn}.status`],
        })
    }

    async updateVideo(video: Partial<IVideo>, updateVideoList: boolean = false) {
        if (!video.id) throw new AppLogicError(`Cannot serialize video data. Id not found`)
        await this.Redis.hmset(this.VideoKey(video.id), this.serializeVideo(video, updateVideoList))
    }

    async getVideos() {
        const videoIds = await this.Redis.zrange(this.RedisKey, 0, -1);

        const videos = await Promise.all(videoIds.map(id => this.getVideoById(id)));
        return videos.filter(v => v != null);
    }

    async getVideoById(id: string) {
        const data = await this.Redis.hgetall(this.VideoKey(id));
        if (!data) return null;

        return this.parseVideo(data);
    }
}

export const Video = new VideoModel;
export default Video;