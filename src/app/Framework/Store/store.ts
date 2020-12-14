import { watch, unwatch } from 'watchjs';

/**
 * 
 * Listener handler
 * 
 */
export class StoreListenerHandler {
    protected _keys: string[];
    protected _callback: (property: string, value: any, prevValue: any, store: Store) => void;
    protected _store: Store;

    constructor(keys: string[], callback: (property: string, value: any, prevValue: any, store: Store) => void, store: Store) {
        this._keys = keys;
        this._callback = callback;
        this._store = store;
    }

    /**
     * 
     * Is this listener listening specific key
     * 
     */
    public isKey(key: string) {
        if (this._keys.indexOf("*") != -1) {
            return true;
        }
        return this._keys.indexOf(key) != -1
    }

    /**
     * 
     * Execute listener
     * 
     */
    public exec(property: string, value: any, prevValue: any, store: Store) {
        if (this._callback) {
            this._callback(property,value,prevValue, this._store);
        }
    }
}

/**
 * 
 * Store class
 * 
 */
export class Store {
    private _state: any;
    private _listeners: StoreListenerHandler[];

    /**
     * 
     * Create store with initial state
     * 
     */
    constructor(initialState: any) {
        this._listeners = [];
        this.setState(initialState);
    }

    /**
     * 
     * Set state without change handling
     * 
     */
    protected setState(state: any) {
        if (this.state) {
            unwatch(this._state, (property, type, value, prevValue) => this.onStateChanged(property, type, value, prevValue));
        }
        this._state = state;
        watch(this._state, (property, type, value, prevValue) => this.onStateChanged(property, type, value, prevValue));
    }

    /**
     * 
     * Get current state
     * 
     */
    public get state(): any {
        return this._state;
    }

    /**
     * 
     * Listen store changes
     * 
     */
    public listen(keys: string[], callback: (property: string, value: any, prevValue: any, store: Store) => void): StoreListenerHandler {
        const listener = new StoreListenerHandler(keys, callback, this);
        this._listeners.push(listener);
        return listener;
    }

    /**
     * 
     * Stop listening changes for specific listener
     * 
     */
    public unlisten(listener: StoreListenerHandler) {
        const index = this._listeners.indexOf(listener);
        if (index != -1) {
            this._listeners.splice(index,1);
        }
    }

    /**
     * 
     * Internal, handle store changes
     * 
     */
    protected onStateChanged(property: string, type: string, value: any, prevValue: any) {
        for(let i = 0; i < this._listeners.length; i++) {
            const listener = this._listeners[i];
            if (listener.isKey(property)) {
                listener.exec(property, value, prevValue, this);
            }
        }
    }
}