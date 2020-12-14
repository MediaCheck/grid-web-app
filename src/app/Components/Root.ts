import { Context } from './../Framework/Context';
import { AppContext } from './../AppContext';
import { ConnectedComponent } from '../Framework/View/ConnectedComponent';
import { Login } from './Login';
import { Grid } from './Grid';
import { ErrorView } from './ErrorView';
import { Store } from '../Framework/Store/store';
import { Connection } from '../Connection';

/**
 * 
 * 
 * Root view of app
 * 
 */
export class Root extends ConnectedComponent {

    protected instanceId: string = null;
    protected programId: string = null;

    constructor(context: Context) {
        super(context, {});

        this.connect((state: any) => {
            return {
                loginRequired: state.temp.loginRequired,
                auth_token: state.app.auth_token
            }
        });
 
        //  add components
        this.addComponent("login", new Login(context));
        this.addComponent("grid", new Grid(context));
        this.addComponent("errorView", new ErrorView(context));
        this.addComponent("Connection", new Connection(context));
    }

    /**
     * 
     * When something in store is changed...
     * 
     */
    protected onStoreChange(property: string, value: any, prevValue: any, store: Store) {
        super.onStoreChange(property, value, prevValue, store);

        if (property === 'auth_token' && this.state.loginRequired) {
            (<AppContext>this.context).dao.getGridProgramAppToken(this.props.args.instance, this.props.args.program);
            this.instanceId = this.props.args.instance;
            this.programId = this.props.args.program;
        }
    }

    /**
     * 
     * Before render method
     * 
     */
    protected beforeRender() {

        if (!this.props.args || (this.props.args && ( !this.props.args.instance || !this.props.args.program))) {
            (<AppContext>this.context).store.state.temp.error = "There is no selected app. You have to access the app through Byzance portal.";
            (<AppContext>this.context).store.state.app.gridJson = null;
            (<AppContext>this.context).store.state.app.targetId = null;
            (<AppContext>this.context).store.state.app.gridUrl = null;
            return;
        }

        if (this.instanceId != this.props.args.instance || this.programId != this.props.args.program) {
            (<AppContext>this.context).dao.getGridProgramAppToken(this.props.args.instance, this.props.args.program);
            this.instanceId = this.props.args.instance;
            this.programId = this.props.args.program;
        }
    }

    protected render(renderProps: any):string {
        return (`
            <div>
                <%- grid() %>
                <%- errorView() %>
                <% if (state.loginRequired) { %>
                    <%- login() %>
                <% } %>
            </div>
        `);
    }
}