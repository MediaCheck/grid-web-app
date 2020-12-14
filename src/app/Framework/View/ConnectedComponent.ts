import { Component } from './Component';
import { StoreListenerHandler, Store } from '../Store/store';
import { watch, unwatch } from 'watchjs';

export class ConnectedComponent extends Component {
    private listener: StoreListenerHandler;
    private connectedFunc: (state: any) => Object;

    /**
     * 
     * Connect this component to store
     * 
     * Connect automaticaly add key to component state and changing it, when store value is changed
     */
    protected connect(func: (state: any) => Object) {
        console.log("ConnectedComponent: connect: ");
        if (!this.context.store) {
            console.error("CYou cant connect component, without store");
            throw "You cant connect component, without store";
        }

        unwatch(this.state, () => this.invalidate());

        this.connectedFunc = func;
        const watchObj = this.connectedFunc(this.context.store.state);
        const keys = Object.keys(watchObj);
        this.context.store.listen(keys, (property: string, value: any, prevValue: any, store: Store) => this.onStoreChange(property, value, prevValue, store));

        for(let i = 0; i < keys.length; i++) {
            this.state[keys[i]] = watchObj[keys[i]];
        }

        watch(this.state, () => this.invalidate());
    }

    /**
     * 
     * Unconnect this component from store
     * 
     */
    protected unconnect() {
        if (!this.context.store) {
            throw "You cant connect component, without store";
        }

        if (!this.listener) {
            throw "You cannot uncnnect component, that wasnt connected"
        }
        this.context.store.unlisten(this.listener);
        this.listener = null;
    }

    /**
     * 
     * @Override me...
     * 
     * But do not forget to call super.onStoreChange !!
     * 
     */
    protected onStoreChange(property: string, value: any, prevValue: any, store: Store) {
        const listenObject = this.connectedFunc(this.context.store.state);
        for(let propertyName in listenObject) {
            this.state[propertyName] = listenObject[propertyName]
        }
    }
}