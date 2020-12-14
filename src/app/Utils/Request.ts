declare function fetch(url: string, params: any);
export class Request {
    /*
     *
     *  Base api requests
     *
     */
    static base(url, method, headers = null, data = null) {
        let params = {
            method,
            credentials:'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (headers) {
            for(let i in headers) {
                if (headers.hasOwnProperty(i)) {
                    params.headers[i] = headers[i];
                }
            }
        }

        if (data) {
            params['body'] = JSON.stringify(data);
        }

        let res = {
            status: null,
            data: null
        };

        return fetch(url,params).then((response) => {
            res.status = response.status;
            return response.json();
        }).then((response) => {
            res.data = response;
            return res;
        });
    }

    static get(url, headers = null) {
        return Request.base(url, 'GET', headers, null);
    }

    static post(url, headers = null, data = {}) {
        return Request.base(url, 'POST', headers, data);
    }

    static put(url, headers = null, data = {}) {
        return Request.base(url, 'PUT', headers, data);
    }

    static delete(url, headers = null) {
        return Request.base(url, 'DELETE', headers, null);
    }

    static STATUS_OK:number = 200;
    static STATUS_CREATED:number = 201;
    static STATUS_UNAUTHORIZED:number = 401;
    static STATUS_FORBIDEN:number = 403;
    static STATUS_NOT_FOUND:number = 404;
    static STATUS_METHOD_NOT_ALOWED:number = 405;
    static STATUS_UNSUPORTED_MEDIA_TYPE:number = 415;
    static STATUS_SERVER_ERROR:number = 500;
}