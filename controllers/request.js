'use strict';

const _ = require('lodash');
const request = require('request-promise');
const querystring = require('querystring');
const memjs = require('memjs');
const crypto = require('crypto');
const Constants = require('./constants.js');

const cache = memjs.Client.create(null, Constants.CACHE_OPTIONS);

class Request {
    /**
     * Generates a cache key for the given URL.
     * To get around the 250 character memcache key size limit,
     * a base64 encoded SHA512 hash is used for urls exceding 250 characters.
     */
    static key(url) {
        if (url.length <= 250) return url;
        return crypto.createHash('sha512').update(url).digest('base64');
    }

    static get(url, timeout) {
        return new Promise((resolve, reject) => {
            if (!cache) {
                console.log('WARNING: no cache found');

                Request.timeout(request(url), timeout).then(body => {
                    resolve(body);
                }, reject);
            } else {
                const key = Request.key(_.isString(url) ? url : url.uri);

                cache.get(key, (error, value) => {
                    if (value) {
                        resolve(value);
                    } else {
                        Request.timeout(request(url), timeout).then(body => {
                            resolve(body);
                            if (!error) cache.set(key, body);
                        }, reject);
                    }
                });
            }
        });
    }

    static getJSON(url, timeout) {
        return new Promise((resolve, reject) => {
            Request.get(url, timeout).then(value => {
                resolve(JSON.parse(value.toString()));
            }, reject);
        });
    }

    static timeout(promise, milliseconds) {
        return new Promise((resolve, reject) => {
            Promise.race([Request._timeout(milliseconds), promise]).then(resolve, reject);
        });
    }

    static _timeout(milliseconds) {
        milliseconds = milliseconds || Constants.TIMEOUT_MS;

        return new Promise((resolve, reject) => {
            setTimeout(reject, milliseconds);
        });
    }

    static buildURL(path, params) {
        const validParams = _.omit(params, param => param == []);
        const paramString = querystring.stringify(validParams);
        return `${path}${path[path.length - 1] == '?' ? '' : '?'}${paramString}`;
    }
}

module.exports = Request;
