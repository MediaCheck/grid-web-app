import { Context } from './../Framework/Context';
import { AppContext } from './../AppContext';
import { ConnectedComponent } from '../Framework/View/ConnectedComponent';
import {Core, DeviceRenderer, Widgets} from "the-grid";
import { BlockoService } from '../BlockoService';
import { Store } from '../Framework/Store/store';

/**
 * 
 * 
 * Grid view component
 * 
 */
export class Grid extends ConnectedComponent {
    protected controller:Core.Controller = null;
    protected controllerRenderer:DeviceRenderer.ControllerRenderer = null;
    private loadingCheckInterval = null;

    protected _blockoService: BlockoService;

    constructor(context: Context) {
        super(context, {});

        this.connect((state: any) => {
            return {
                gridJson: state.app.gridJson,
                targetId: state.app.targetId,
                sockedOpened: state.temp.sockedOpened
            }
        });
    }

    /**
     * 
     * Render single container for grid component
     * 
     * Be carefull, because this container has content created by grid (not in shadow dom), it is using
     * ignore-shadow-copy flag set to false. When you changed something on container, this change will NOT be propagate to dom.
     * 
     */
    protected render(renderProps: any):string {
        return (`
            <div class="grid active" id="the-grid" ignore-shadow-copy="true"></div>
        `);
    }

    /**
     * 
     * On grid component is attached to container
     * 
     */
    protected onAttach() {
        if (this.documentDom) {
            this.initGrid(this.documentDom);

            //  check the initial active state
            if (this.state.sockedOpened) {
                this.documentDom.className = "grid active"
            } else {
                this.documentDom.className = "grid"
            }
        }


        //  checking ready of page... this is only one working solution :-/
        this.loadingCheckInterval = setInterval(() => {
           const ready = /loaded|complete/.test(document.readyState);

           if (ready) {
                if (this.controller) {
                    this.controller.invalidateWidgets();
                }
               clearInterval(this.loadingCheckInterval);
               this.loadingCheckInterval = null;
           }
        },10);
    }

    /**
     * 
     * When something in store is changed...
     * 
     */
    protected onStoreChange(property: string, value: any, prevValue: any, store: Store) {
        super.onStoreChange(property, value, prevValue, store);

        if (property == "gridJson" && this.controller) {
            if (this.state.gridJson) {
                this.setProgramJson(this.state.gridJson);
            } else {
                this.setProgramJson(JSON.stringify({
                    device: 'mobile',
                    screens: {}
                }));
            }
        }

        if (this.documentDom) {
            if (property == "sockedOpened") {
                if (this.state.sockedOpened) {
                    this.documentDom.className = "grid active"
                } else {
                    this.documentDom.className = "grid"
                }
            }
        }

        if (property == "targetId") {
            this.reloadConfig();
        }
    }

    /**
     * 
     * Initialize grid ...
     * 
     */
    protected initGrid(element: HTMLElement) {
        if (!this._blockoService) {
            this._blockoService = new BlockoService({});
        }

        this.controller = new Core.Controller();
        this.controllerRenderer = new DeviceRenderer.ControllerRenderer(this.controller, element);
        this.controller.setRenderer(this.controllerRenderer);
        this.controller.setBlockoService(<Core.BlockoService>this._blockoService);
        this.controller.registerRequestWidgetSourceCallback((type, resolve) => this.onWidgetSourceRequest(type, resolve));
        this.reloadConfig();

        //  add websocket handler to service
        this._blockoService.setWebsocket((<AppContext>this.context).websocketHandler);

        this.controllerRenderer.onError = (e) => {
            this.context.store.state.temp.error = "There was some error in widget's code.";
            console.error(e);
        }

        this.controllerRenderer.onLog = (id: number, type: string, message: string) => {
            console.log("(W-" + id + ")", "[" + type + "] ", message);
        }

        if (this.state.gridJson) {
            this.setProgramJson(this.state.gridJson);
        }
    }

    /**
     * 
     * When grid widget requests the source code
     * 
     */
    protected onWidgetSourceRequest(type: any, resolve: (code: string, safe?: boolean) => void) {
        (<AppContext>this.context).dao.getWidgetVersion(type.version_id)
            .then((result) => {
                resolve(result);
            });
    }

    /**
     * 
     * Set JSON program to grid
     * 
     */
    protected setProgramJson(data:string) {
        this.controller.setDataJson(data);
    }

    /**
     * 
     * 
     * Regenerate configuration...
     * 
     */
    protected reloadConfig() {
        if (this.state.targetId && this.controller) {
            this._blockoService.setNewConfig({
                targetId: this.state.targetId
            });
        }
    }
}