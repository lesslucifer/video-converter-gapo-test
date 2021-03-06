import multer = require('multer');
import express = require('express');
import { addMiddlewareDecor, updateAPIInfo, IExpressRouterResponseHandler } from "express-router-ts";

export function SingleFileUpload(fieldName: string, multerOpts?: multer.Options) {
    const single = multer(multerOpts).single(fieldName);

    return addMiddlewareDecor(async (req: express.Request) => {
        await new Promise(res => single(req, undefined, res));
    })
}

export function ExpressResponse(respHandler: IExpressRouterResponseHandler) {
    return updateAPIInfo((api) => {
        api.responseHandler = respHandler;
    });
}