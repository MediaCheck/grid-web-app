import { Store } from './store';

export class StoreCache {
    protected _store: Store;
    protected _keys: string[];

    /**
     * 
     * 
     * Construct offline store cache
     * 
     */
    constructor(store: Store, keys: string[]) {
        this._store = store;
        this._keys = keys;

        let loadedState = {};
        let loadedStateString = localStorage.getItem("store-cache-permanent");
        if (loadedStateString) {
            try {
                loadedState = JSON.parse(loadedStateString);
            } catch(e) {}
        }

        for(let propertyName in loadedState) {
            this._store.state[propertyName] = loadedState[propertyName];
        }
        
        store.listen(["*"], (property: string, value: any, prevValue: any, store: Store) => this.onStoreChange(property, value, prevValue, store));

    }

    /**
     * 
     * 
     * Listen changes on store
     * 
     */
    protected onStoreChange(property: string, value: any, prevValue: any, store: Store) {
        let output = {};
        for(let i = 0; i < this._keys.length; i++) {
            output[this._keys[i]] = this._store.state[this._keys[i]];
        }

        let data = null;
        try {
            data = JSON.stringify(output);
        } catch(e) {
            data = null;
        }

        if (data) {
            localStorage.setItem("store-cache-permanent",data);
        }
    }
}