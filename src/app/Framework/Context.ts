import { Store } from './Store/store';
//import * as DiffDOM from 'diff-dom'; 
import { Component } from './View/Component';
import { Router } from './Router/Router';

var diffDOMLib = require('./Dependencies/diffDom.js');
var DiffDOM = new diffDOMLib();

/**
 * 
 * Framework context
 * 
 */
export class Context {
    private _lastId: number;
    private _rootSelector: string;
    private _componentsList: {[id:string]:any};
    private _shadowDom: HTMLElement;
    private _dirtyTimeout: any;
    protected _root: Component;
    protected _store: Store;

    /**
     * 
     * Create with root selector and store
     * 
     */
    constructor(rootSelector: string, store?: Store) {
        this._lastId = 0;
        this._rootSelector = rootSelector;
        this._componentsList = {}
        this._store = store;
        this._root = null;
        window["template-context"] = this;

        this._shadowDom = <HTMLElement>(document.querySelector(this._rootSelector).cloneNode());
    }

    /**
     * 
     * Render timeout tick - apply diff from shadow dom
     * 
     */
    private renderTimeoutTick() {
        if (!this._root) {
            return;
        }

        this._root.handleBeforeRenderEvent();

        const rootElement = document.querySelector(this._rootSelector);

        if (!rootElement) {
            throw "Root element doesn't exists";
        }

        const diff = DiffDOM.diff(rootElement, this._shadowDom);

        DiffDOM.apply(rootElement, diff);

        this._root.handleAttachEvent();
        this._root.handleAfterRenderEvent();
    }

    /**
     * 
     * Returns reference to shadow dom
     * 
     */
    public get shadowDom(): HTMLElement {
        return this._shadowDom;
    }

    /**
     * 
     * Invalidate context, prepare for apply shadow dom
     * 
     */
    public invalidate() {
        if (this._dirtyTimeout) {
            clearTimeout(this._dirtyTimeout);
        }

        this._dirtyTimeout = setTimeout(() => {
            this.renderTimeoutTick();
        },0);
    }

    /**
     * 
     * Get root selector specified in constructor
     * 
     */
    public get rootSelector(): string {
        return this._rootSelector;
    }

    /**
     * 
     * Get component by id
     * 
     */
    public getComponent(id: number): any {
        if (this._componentsList[id.toString()]) {
            return this._componentsList[id.toString()];
        }
        return null;
    }

    /**
     * 
     * Get next id for new component
     * 
     */
    public getNextId(component: any): number {
        const id = this._lastId++;
        this._componentsList[id.toString()] = component;
        return id;
    }

    /**
     * 
     * Get store instance
     * 
     */
    public get store(): Store {
        return this._store;
    }

    /**
     * 
     * Get root element
     * 
     */
    public get root(): Component {
        return this._root;
    }

    /**
     * 
     * Run app with root element
     * 
     */
    public runApp(root: Component) {
        root.invalidate();
        this._root = root;
        this._root["_isRoot"] = true

        //  set root location for router
        if (root instanceof Router) {
            const fullHost = window.location.protocol + "//" + window.location.host;
            const parts = window.location.href.substr(fullHost.length);
            (<Router>root).setLocation(parts);
        }
    }
}