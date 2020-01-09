import * as bodyParser from 'body-parser';
import { EventEmitter } from 'events';
import express from 'express';
import _ from 'lodash';
import moment from 'moment';
import * as path from 'path';
import { ENV } from './glob/env';
import hera, { AppLogicError, AppApiResponse } from './utils/hera';
import { APIInfo, ExpressRouter } from 'express-router-ts'
import WorkerServ from './serv/workers';
import CONN from './glob/conn';

// Import routers
export class Program {
    static server: express.Express;

    public static async setUp() {
        await CONN.configureConnections(ENV.CONN);
    }

    public static async startHttp() {
        const server = express();
        this.server = server;
        server.use(bodyParser.json());
        
        // CORS
        server.all('*', function (req, res, next) {
            res.header('Access-Control-Allow-Origin', "*");
            res.header('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, DELETE');
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Max-Age', '86400');
            res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, ' +
                'Content-Type, Accept, Authentication, Authorization, X-Consumer-Username, sess, apikey, clientid');

            if (req.method.toUpperCase() == 'OPTIONS') {
                res.statusCode = 204;
                res.send();
                return;
            }

            next();
        });

        server.use('/hls', express.static(`${ENV.FILE_UPLOAD_DIR}/output`))

        APIInfo.Logging = false;
        await ExpressRouter.loadDir(server, `${__dirname}/routes`);
        
        ExpressRouter.ResponseHandler = this.expressRouterResponse.bind(this)
        ExpressRouter.ErrorHandler = this.expressRouterError.bind(this)
        
        await new Promise(res => this.server.listen(ENV.HTTP_PORT, () => {
            console.log(`Listen on port ${ENV.HTTP_PORT}...`);
            res();
        }));
    }

    public static async main() {
        await this.setUp();
        if (ENV.PROCESS.worker == true) {
            await WorkerServ.startWorkers();
        }
        

        if (ENV.PROCESS.http == true) {
            await this.startHttp();
        }
        
        return 0;
    }

    static expressRouterResponse(data: any, req: express.Request, resp: express.Response) {
        let appResp = new AppApiResponse();
        if (data instanceof AppApiResponse) {
            appResp = data;
        }
        else {
            appResp.success = true;
            appResp.httpCode = 200;
            appResp.data = data;
        }

        this.doResponse(appResp, resp);
    }

    static expressRouterError(err: any, req: express.Request, resp: express.Response) {
        let appResp = new AppApiResponse();
        appResp.success = false;
        appResp.err = {
            message: err.message || 'Unknown error',
            code: err.code,
            params: err.params
        }
        appResp.httpCode = _.isNumber(err.httpCode) ? err.httpCode : 500;

        this.doResponse(appResp, resp);
    }

    static doResponse(appResp: AppApiResponse, resp: express.Response) {
        // Remove http code from response body
        if (_.isNumber(appResp.httpCode)) {
            resp.statusCode = appResp.httpCode;
        }
        delete appResp.httpCode;

        // Remove headers from response body
        if (!_.isEmpty(appResp.headers)) {
            _.keys(appResp.headers).forEach(h => resp.setHeader(h, appResp.headers[h]));
        }
        delete appResp.headers;

        resp.send(appResp);
    }
}

if (require.main == module) { // this is main file
    Program.main();
}

export default Program;