import { Context } from '../Context';
import { Component } from '../View/Component';
import * as UrlPattern from 'url-pattern';

export interface Route {
    patern: UrlPattern;
    componentName: string;
}

export class Router extends Component {
    protected _currentComponent: Component;

    protected _routes: Route[];

    constructor(context: Context) {

        console.log("Router: Context: ", context);

        super(context, {
            location: null,
            args: null,
        });

        this._routes = [];
        this.getRoutedComponent();
    }

    public setLocation(location: string) {
        for(let i = 0; i < this._routes.length; i++) {
            const route = this._routes[i];
            const match = route.patern.match(location);
            if (match) {
                this.state.args = match;
                this.state.location = route.componentName;
                this.getRoutedComponent();
                return;
            }
        }
    }

    public addRoute(path: string, component) {
        const name = this._routes.length.toString();
        this.addComponent(name, component);
        this._routes.push({
            patern: new UrlPattern(path),
            componentName: name
        });
    }

    protected getRoutedComponent() {
        console.log("Router: getRoutedComponent: ", this.state.location);
        let component = this.getComponent(this.state.location);

        if (this._currentComponent != component && component) {
            this._currentComponent = component;
            this.context.invalidate();
        }
    }

    protected render(renderProps: any): string {
        let html = "";
        if (this._currentComponent) {
            html = this.componentPreprare(this._currentComponent,{args: this.state.args});
        }

        const tag = this.elementSelect().tagName;
        return "<"+tag+">"+html+"</"+tag+">";
    }
}