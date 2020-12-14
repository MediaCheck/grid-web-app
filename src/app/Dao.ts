/**
 * Created by davidhradek on 08.11.16.
 */
import { Store } from './Framework/Store/store';
import { Request } from './Utils/Request';
import { getDevice } from './Utils/Enviroment';
import {ILogicJson, IPerson, ITerminalConnectionSummary, IWidgetVersion} from "./backend/TyrionAPI";

let request = require('sync-request');

export class Dao {
    protected _store: Store;
    protected serverUrl:string = null;
    protected _cache: any;

    protected _protocol: string;

    /**
     * 
     * 
     * Create dao handler with store ref
     * 
     */
    constructor(store: Store, serverUrl:string = null) {
        this._store = store;

        this._protocol = 'http';
        if (location && location.protocol) {
            if (location.protocol === 'https:') {
                this._protocol = 'https';
            }
        }

        if (serverUrl) {
            this.serverUrl = serverUrl;
        } else if (location.hostname.indexOf('app.') === 0) {
            this.serverUrl = this._protocol + '://'+'tyrion.cluster.cloud.byzance.cz';
        } else {
            this.serverUrl = this._protocol + '://'+location.hostname+':9000';
        }

    }

    /**
     * 
     * Get local machine cache object
     * 
     */
    public get cache(): any {
        if (!this._cache) {
            let cache = window.localStorage.getItem("cache");
            if (cache) {
                cache = JSON.parse(cache);
            }
            if (cache) {
                this._cache = cache;
            } else {
                this._cache = {};
            }
        }

        return this._cache;
    }

    /**
     * 
     * 
     * Save local cache to local storage
     * 
     */
    public saveCache() {
        window.localStorage.setItem("cache", JSON.stringify(this._cache));
    }

    /**
     * 
     * 
     * Clear local cache
     * 
     */
    public clearCache() {
        window.localStorage.removeItem("cache");
    }

    /*****************************************
     * 
     * Requests....
     * 
     *****************************************/

    /**
     * 
     * Login
     * 
     */
    public loginRequest(email:string, pass:string):Promise<any> {
        return Request.post(this.serverUrl+"/login", {}, {
            email: email,
            password: pass
        }).then((response) => {
            console.info('loginRequest : Response: Status', response.status, 'response.data.auth_token', response.data.auth_token)
            if (response.status == Request.STATUS_OK && response.data && response.data.auth_token) {
                console.info('token set');
                this._store.state.app.auth_token = response.data.auth_token;

            } else {
                var e = "Unknown error";
                if (response.data && response.data.message) {
                    e = response.data.message;
                }
                throw e;
            }
        }).catch((e) => {
            this._store.state.app.auth_token = null;
            throw e;
        });
    }

    /**
     * 
     * 
     * Logout with clear cache
     * 
     */
    public logout():Promise<any> {
        console.log('Logout!');
        this.clearCache();
        const tokenCopy = this._store.state.app.auth_token;
        this._store.state.app.gridJson = null;
        this._store.state.app.targetId = null;
        this._store.state.app.gridUrl = null;

        if (this._store.state.app.auth_token) {
            this._store.state.app.auth_token = null;

            return Request.post(this.serverUrl+"/logout", {
                'x-auth-token': tokenCopy
            }, {}).then((response) => {

                if (response.status != Request.STATUS_OK) {
                    var e = "Unknown error";

                    if (response.data && response.data.message) {
                        e = response.data.message;
                    }

                    throw e;
                }
            });
        }
    }

    /**
     * 
     * 
     * Get person
     * 
     */
    public getPerson():Promise<IPerson> {
        return Request.get(this.serverUrl+"/login/person", {
            'x-auth-token': this._store.state.app.auth_token
        }).then((response) => {
            if (response.status == Request.STATUS_UNAUTHORIZED) {
                console.error("getPerson: STATUS_UNAUTHORIZED");
                this.logout();
            } else if (response.status == Request.STATUS_OK && response.data && response.data.person) {
                console.info("getPerson: Success Return person data");
                return response.data.person;
            } else {
                var e = "Unknown error";

                if (response.data && response.data.message) {
                    e = response.data.message;
                }

                this._store.state.temp.error = e.toString();

                throw e;
            }
        });
    }

    /**
     * 
     * 
     * Get widget source version
     * Cached output
     * 
     */
    public getWidgetVersion(id:string):Promise<string> {
        if (this.cache["widget-" + id]) {
            return new Promise<string>((resolve, reject)=> {
                resolve(<string>this.cache["widget-" + id])
            })
        }

        return Request.get(this.serverUrl + "/widget/version/" + id, {
            'x-auth-token': this._store.state.app.auth_token
        }).then((response) => {
            if (response.status == Request.STATUS_UNAUTHORIZED) {
                console.error("getWidgetVersion: STATUS_UNAUTHORIZED");
                this.logout();
                this._store.state.temp.loginRequired = true;
            } else if (response.status == Request.STATUS_OK && response.data) {
                let res = request('GET', (<IWidgetVersion>response.data).link_to_download);
                let logic = (<ILogicJson> res.getBody());
                this.cache["widget-"+id] = logic.program;

                console.log('getWidgetVersion:: widget program : ', logic.program );

                this._store.state.temp.loginRequired = false;
                return logic.program;
            } else {
                var e = "Unknown error";

                if (response.data && response.data.message) {
                    e = response.data.message;
                }

                this._store.state.temp.error = e.toString();

                throw e;
            }
        });
    }

    /**
     *
     *
     * Get grid source version
     *
     */
    public getGridProgramAppToken(instance_id: string, program_id: string):Promise<ITerminalConnectionSummary> {
        return Request.get(this.serverUrl + "/grid_program/app/token/" + instance_id + "/" + program_id, {
            'x-auth-token': this._store.state.app.auth_token
        }).then((response) => {
            if (response.status == Request.STATUS_UNAUTHORIZED) {
                console.error("getGridProgramAppToken: STATUS_UNAUTHORIZED");
                this.logout();
                this._store.state.temp.loginRequired = true;
            } else if (response.status == Request.STATUS_OK && response.data) {
                console.log('getMProgramAppToken: response:: ' + response.data);
                this._store.state.temp.loginRequired = false;
                const data = <ITerminalConnectionSummary>response.data;

                // fill cache
                data.source_code_list.forEach((item) => {
                    console.log(' getGridProgramAppToken - Logic program', item.logic_json.program );
                    this.cache["widget-"+item.id] = item.logic_json.program;
                });

                this.saveCache();

                this._store.state.app.targetId = data.grid_project_id;
                this._store.state.app.gridJson = data.grid_program;
                this._store.state.app.gridUrl =  data.grid_app_url;

                return data;
            } else {
                var e = "Unknown error";

                if (response.data && response.data.message) {
                    e = response.data.message;
                }

                this._store.state.temp.error = e.toString();

                throw e;
            }
        });
    }


    /*****************************************
     * 
     * Actions...
     * 
     *****************************************/

    /**
     * 
     * Login with user name and password
     * 
     */
    public login(email:string, password:string):Promise<IPerson> {
        return new Promise<IPerson>((resolve, reject) => {
            this.loginRequest(email, password)
                .then((response) => {
                    return this.getPerson();
                })
                .then((person) => {
                    resolve(person)
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

}
