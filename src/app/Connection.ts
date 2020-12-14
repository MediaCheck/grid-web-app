import { Context } from './Framework/Context';
import { AppContext } from './AppContext';
import { ConnectedComponent } from './Framework/View/ConnectedComponent';
import { WebsocketHandler } from './Utils/Websocket';
import { Store } from './Framework/Store/store';

/**
 * 
 * 
 * Connection holder component
 * 
 */
export class Connection extends ConnectedComponent {
    private socketConnectionUrl: string;
    protected websocketHandler: WebsocketHandler;

    constructor(context: Context) {
        super(context, {});

        this.websocketHandler = (<AppContext>context).websocketHandler;
        this.websocketHandler.onSocketStatusChanged = (opened: boolean) => this.onSockedOpenedChanged(opened);
        this.websocketHandler.onSocketError = (e:string) => this.onSocketError(e);
        this.socketConnectionUrl = null;

        this.connect((state: any) => {
            return {
                gridUrl: state.app.gridUrl
            }
        });

        this.tryToConnect();
    }

    /**
     * 
     * Handle socket error
     * 
     */
    protected onSocketError(e: string) {
        if (e) {
            this.context.store.state.temp.error = "Connection error";
        }
    }

    /**
     * On socket status opened changed
     */
    protected onSockedOpenedChanged(opened: boolean) {
        if (opened) {
            this.context.store.state.temp.error = null;
        }
        this.context.store.state.temp.sockedOpened = opened;
    }

    /**
     * 
     * 
     * Wait for changes
     * 
     */
    protected onStoreChange(property: string, value: any, prevValue: any, store: Store) {
        super.onStoreChange(property, value, prevValue, store);

        if (property == "gridUrl") {
            if (this.socketConnectionUrl != this.state.gridUrl) {
                this.socketConnectionUrl = this.state.gridUrl;
                this.tryToConnect();
            }
        }
    }

    /**
     * 
     * Connection - try to connect
     * 
     */
    protected tryToConnect() {
        if (this.state.gridUrl) {
            this.websocketHandler.reconnect(this.state.gridUrl);
        }
    }
}