import { Context } from './../Framework/Context';
import { AppContext } from './../AppContext';
import { ConnectedComponent } from '../Framework/View/ConnectedComponent';
import { Store } from '../Framework/Store/store';

/**
 * 
 * 
 * Top menu component
 * 
 */
export class ErrorView extends ConnectedComponent {
    protected errorTimeout = null

    constructor(context: Context) {
        super(context, {
            errorMessage: null
        });

        this.connect((state: any) => {
            return {
                error: state.temp.error
            }
        });
    }

    /**
     * 
     * 
     * Wait for error
     * 
     */
    protected onStoreChange(property: string, value: any, prevValue: any, store: Store) {
        super.onStoreChange(property, value, prevValue, store);

        if (property == "error") {
            if (this.errorTimeout) {
                clearTimeout(this.errorTimeout);
                this.errorTimeout = null;
            }
            this.errorTimeout = setTimeout(() => this.setError(),500);
        }
    }

    /**
     * 
     * Timeout error show histeresis
     * 
     */
    protected setError() {
        this.state.errorMessage = this.context.store.state.temp.error;
    }

    /**
     * 
     * Render popup
     * 
     */
    protected render(renderProps: any):string {
        return (`
            <% if (state.errorMessage) { %>
                <div class="errorView" style="display: block;">
                    <div class="box">
                        <p>
                            <i class="fa fa-fw fa-exclamation-triangle"></i>
                            <strong><%= state.errorMessage.main %></strong>
                            <%= state.errorMessage %>
                        </p>
                        <a class="reload" onclick="<%= call("onAppReload") %>">Reload app</a>
                    </div>
                </div>
            <% } else { %>
                <div class="error" style="display: none;"></div>
            <% } %>
        `);
    }

    /**
     * 
     * When user clicks reload button
     * 
     */
    public onAppReload(e) {
        window.location.reload();
    }
}