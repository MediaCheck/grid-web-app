import { Context } from './Framework/Context';
import { Dao } from './Dao';
import { Store } from './Framework/Store/store';
import { WebsocketHandler } from './Utils/Websocket';

export class AppContext extends Context {
    protected _dao: Dao;
    protected _websocketHandler: WebsocketHandler;

    constructor(dao: Dao, store: Store, rootSelector: string) {
        super(rootSelector, store);
        this._dao = dao;

        //  create websocket handler for whole app
        this._websocketHandler = new WebsocketHandler();
    }

    public get dao(): Dao {
        return this._dao;
    }

    /**
     * 
     * 
     * Get main websocket handler
     * 
     */
    public get websocketHandler(): WebsocketHandler {
        return this._websocketHandler;
    }
}