import { watch } from 'watchjs';
import { Context } from './../Context';
import { union } from '../Utils/array';

declare var ejs: any;

/**
 * 
 * Main framework component
 * 
 */
export class Component {
    private _state: any;
    private _props: any;
    private _childrens: Component[];
    private _components: {[name:string]:Component}
    private _id: number;
    private _dom: HTMLElement;
    private _context: Context;
    private _renderLocked: boolean;
    private _dirtyTimeout: any;
    private _nowVisible: boolean;
    private _isRoot: boolean;

    /**
     * 
     * You must create component with context
     * 
     */
    constructor(context: Context, initialState?: any) {

        this._context = context;

        this._props = {};
        this._state = initialState;
        this._childrens = [];
        this._components = {};
        this._id = context.getNextId(this);
        this._renderLocked = false;
        this._dirtyTimeout = null;
        this._nowVisible = false;
        this._isRoot = false;

        if (this._state) {
            watch(this._state, () => this.invalidate());
        }
    }

    /**
     * 
     * Select my element
     * 
     */
    protected elementSelect(): HTMLElement {
        let element = null;
        if (this._isRoot) {
            element = this.context.shadowDom;
        } else {
            element = this.context.shadowDom.querySelector("[template-id='" + this._id + "']");
        }
        return element;
    }

    /**
     * 
     * Internal - prepare dom structure
     * 
     */
    protected prepareDom(html): any {
        if (!html) {
            this._dom = null;
            return;
        }

        let parser = new DOMParser();

        const htmlBody = parser.parseFromString(html, "text/html").querySelector("body");

        if (htmlBody && htmlBody.childNodes && htmlBody.childNodes[0]) {
            this._dom = <HTMLElement>htmlBody.childNodes[0];
            if (this._dom) {
                this._dom.setAttribute("template-id", this._id.toString());
            }
        } else {
            this._dom = null;
        }
    }

    /**
     * 
     * Get root string html for this component
     * 
     */
    protected getDomContainer(): string {
        if (!this._dom) {
            return "";
        }

        if (this._id == 0) {
            throw "cannot get container for root element";
        }

        return "<" + this._dom.tagName + " template-id='" + this._id + "'></" + this._dom.tagName + ">";
    }

    /**
     * 
     * Apply inner html to prepared html elements in document
     * 
     * Apply dom structures to containers, prepared in shadow dom
     * 
     */
    protected applyDom() {
        let element = this.elementSelect();

        if (!element || !this._dom) {
            return;
        }

        element.innerHTML = this._dom.innerHTML;
        let attributesString = "";
        for (var i = 0, atts = this._dom.attributes, n = atts.length; i < n; i++){
            if (atts[i].name != "template-id") {
                element.setAttribute(atts[i].name, atts[i].value);
            }
        }

        //  apply childrens dom
        for( let i = 0; i < this._childrens.length; i++) {
            this._childrens[i].applyDom();
        }

        //  apply components dom
        for( let i in this._components) {
            if (this._components.hasOwnProperty(i)) {
                this._components[i].applyDom();
            }
        }
    }

    /**
     * 
     * Main render scope
     * 
     * In this scope will be rondered containers for all childs and components inside this component.
     * It will also prepare the dom structure for this component, its childs and components.
     * The dom will be applied to shadow dom in applyDom loop.
     * 
     */
    protected renderScope() {
        //  prepare containers
        let childHtmlStringContainers = "";
        for( let i = 0; i < this._childrens.length; i++) {
            this._childrens[i].renderScope();
            childHtmlStringContainers += this._childrens[i].getDomContainer();
        }

        //  prepare render reference object
        const thisRef = this;
        let renderProps = {
            props: this.props,
            state: this.state,
            this: this,
            childrens: childHtmlStringContainers,
            call: function() {
                let argList = "";
                for(let i = 1; i < arguments.length; i++) {
                    argList += arguments[i].toString();
                    if (i < arguments.length - 1 ) {
                        argList += ", ";
                    }
                }
                return "window['template-context'].getComponent("+thisRef._id+")." + arguments[0] + "("+argList+")";
            }
        };

        //  prepare components
        for(let i in this._components) {
            if (this._components.hasOwnProperty(i)) {
                this._components[i].renderScope();
                renderProps[i] = (props: any) => {
                    return this.componentPreprare(this._components[i], props);
                }
            }
        }

        //  render element (prepare it)
        const html = ejs.render(this.render(renderProps), renderProps);
        this.prepareDom( html );
    }

    /**
     * 
     * Prepare component with adding props to it
     * 
     */
    protected componentPreprare(component: Component, props: any): string {
        if (props) {
            const p = union(Object.keys(props), Object.keys(component._props));
            for(let i = 0; i < p.length; i++) {
                const property = p[i];

                //  if this property isnt in the new props, it must be in old props, ...or this is deleted property...
                if (typeof props[property] == 'undefined') {
                    delete component._props[property];
                    component.invalidate();
                } else if (component._props[property] != props[property]) {
                    component._props[property] = props[property];
                    component.invalidate();
                }
            }
        }

        return component.getDomContainer();
    }

    /**
     * 
     * Tick, after invalidate, render will comes in next loop
     * 
     * Its called one loop after component invalidating.
     * 
     */
    protected renderTimeoutTick() {
        this._renderLocked = true;
        this.renderScope();
        this.applyDom();
        this._renderLocked = false;
        this._dirtyTimeout = null;

        this.context.invalidate();
    }

    /**
     * 
     * Handle on attach event from context
     * 
     */
    public handleAttachEvent() {
        let element = this.elementSelect();
        if (!element) {
            if (this._nowVisible) {
                this.onDetach();
                this._nowVisible = false;
            }
        } else {
            if (!this._nowVisible) {
                this.onAttach();
                this._nowVisible = true;
            }
        }

        //  apply childrens dom
        for( let i = 0; i < this._childrens.length; i++) {
            this._childrens[i].handleAttachEvent();
        }

        //  apply components dom
        for( let i in this._components) {
            if (this._components.hasOwnProperty(i)) {
                this._components[i].handleAttachEvent();
            }
        }
    }

    /**
     * 
     * Handle after render event
     * 
     */
    public handleAfterRenderEvent() {
        this.afterRender();

        //  apply childrens dom
        for( let i = 0; i < this._childrens.length; i++) {
            this._childrens[i].handleAfterRenderEvent();
        }

        //  apply components dom
        for( let i in this._components) {
            if (this._components.hasOwnProperty(i)) {
                this._components[i].handleAfterRenderEvent();
            }
        }
    }

    /**
     * 
     * Handle before render event
     * 
     */
    public handleBeforeRenderEvent() {
        this.beforeRender();

        //  apply childrens dom
        for( let i = 0; i < this._childrens.length; i++) {
            this._childrens[i].handleBeforeRenderEvent();
        }

        //  apply components dom
        for( let i in this._components) {
            if (this._components.hasOwnProperty(i)) {
                this._components[i].handleBeforeRenderEvent();
            }
        }
    }

    /*************************************
     * 
     * Component life cycle
     * 
     *************************************/

    /**
     * 
     * Render method, that must returns html as string for ejs parser.
     * You can use this.props or this.state for accesing properties in this template.
     * You can access props and state in root structure
     * 
     */
    protected render(renderProps: any): string {
        return "";
    }

    /**
     * 
     * Method, that is called before local render
     * 
     */
    protected beforeRender() {

    }

    /**
     * 
     * Method, that is called after local render
     * 
     */
    protected afterRender() {

    }

    /**
     * 
     * Event called, when component is attached to element
     * 
     */
    protected onAttach() {

    }

    /**
     * 
     * Event called, when component is detached to element
     * 
     */
    protected onDetach() {

    }

    /*************************************
     * 
     * Internal methods for working with component
     * 
     *************************************/

    /**
     * 
     * Add component
     * 
     */
    protected addComponent(refName: string, component: Component) {
        if (component == this) {
            throw "You can add self as child";
        }
        this._components[refName] = component;
        this.invalidate();
    }

    /**
     * 
     * Remove component
     * 
     */
    protected removeComponent(refName: string) {
        if (this._components[refName]) {
            delete this._components[refName];
            this.invalidate();
        }
    }

    /**
     * 
     * Get component by ref name
     * 
     */
    protected getComponent(refName: string): Component {
        return this._components[refName];
    }

    /*************************************
     * 
     * Public methods for working with component
     * 
     *************************************/

    /**
     * 
     * Force render
     * 
     */
    public invalidate() {
        if (this._renderLocked) {
            console.error("you cant invalidate component, when rendering");
            return;
        }

        if (this._dirtyTimeout) {
            clearTimeout(this._dirtyTimeout);
        }

        this._dirtyTimeout = setTimeout(() => {
            this.renderTimeoutTick();
        },0);
    }

    /**
     * 
     * Return actual state
     * 
     */
    public get state(): any {
        return this._state;
    }

    /**
     * 
     * Return actual props
     * 
     */
    public get props(): any {
        return this._props;
    }

    /**
     * 
     * View context
     * 
     */
    public get context(): Context {
        return this._context;
    }

    /**
     * 
     * Get dom object inside shadow dom
     * 
     */
    public get dom(): HTMLElement {
        return <HTMLElement>this._dom;
    }

    /**
     * 
     * Get dom object inside document
     * 
     */
    public get documentDom(): HTMLElement {
        if (!this._id) {
            return null;
        }
        return <HTMLElement>document.querySelector("[template-id='" + this._id + "']");
    }

    /**
     * 
     * Add children
     * 
     */
    public addChild(child: Component) {
        if (child == this) {
            throw "You can add self as child";
        }
        this._childrens.push(child);
        this.invalidate();
    }

    /**
     * 
     * Remove children
     * 
     */
    public removeChild(child: Component) {
        const i = this._childrens.indexOf(child);
        if (i != -1) {
            this._childrens.splice(i,1);
            this.invalidate();
        }
    }

    /**
     * 
     * Clean component and its childs
     * 
     */
    public destroy() {
        //  apply childrens dom
        for( let i = 0; i < this._childrens.length; i++) {
            this._childrens[i].destroy();
        }

        //  apply components dom
        for( let i in this._components) {
            if (this._components.hasOwnProperty(i)) {
                this._components[i].destroy();
            }
        }
    }
}