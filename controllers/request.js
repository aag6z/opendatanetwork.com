'use strict';

const _ = require('lodash');
const NodeCache = require('node-cache');
const request = require('request-promise');
const querystring = require('querystring');

const Constants = require('./constants');

const cache = new NodeCache({stdTTL: 60 * 60});

class Request {
    static getJSON(url, timeoutMS) {
        const jsonPromise = new Promise((resolve, reject) => {
            cache.get(url, (error, value) => {
                if (value === undefined) {
                    request(url).then(body => {
                        const json = JSON.parse(body);
                        cache.set(url, json);
                        resolve(json);
                    }, reject);
                } else {
                    resolve(value);
                }
            });
        });

        timeoutMS = timeoutMS || Constants.TIMEOUT_MS;
        const timeoutPromise = Request.timeout(timeoutMS);

        return new Promise((resolve, reject) => {
            Promise.race([timeoutPromise, jsonPromise]).then(result => {
                if (!result) {
                    reject(`request to ${url} timed out after ${timeoutMS}ms`);
                } else {
                    resolve(result);
                }
            }, reject);
        });
    }

    static timeout(milliseconds) {
        return new Promise(resolve => {
            setTimeout(resolve, milliseconds);
        });
    }

    static buildURL(path, params) {
        const validParams = _.omit(params, param => param == []);
        const paramString = querystring.stringify(validParams);
        return `${path}${path[path.length - 1] == '?' ? '' : '?'}${paramString}`;
    }
}

module.exports = Request;
