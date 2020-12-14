import { Component } from './../Framework/View/Component';
import { Context } from './../Framework/Context';
import { AppContext } from '../AppContext';

/**
 * 
 * 
 * Login component
 * 
 */
export class Login extends Component {
    private email: string;
    private password: string;

    constructor(context: Context) {
        super(context, {
            loading: false,
            error: null
        });

        this.email = "";
        this.password = "";
    }

    /**
     * 
     * Render whole login popup...
     * 
     */
    protected render(renderProps: any):string {
        renderProps.email = this.email;
        renderProps.password = this.password;

        return (`
            <div class="box-white login" onkeydown="<%= call("onKeyDown", "event") %>">
                <h1><i class="fa fa-fw fa-user-circle"></i> Log In</h1>
                <% if (state.loading) { %>
                    <div class="loading"><i class="fa fa-spinner fa-spin fa-fw"></i> Loading...</div>
                <% } else { %>
                    <% if (state.error) { %>
                        <div class="error"><%= state.error %></div>
                    <% } %>
                    <label for="email">E-mail</label>
                    <input type="email" id="email" value="<%= email %>" onchange="<%= call("onEmailChange","this.value") %>">
                    <label for="password">Password</label>
                    <input type="password" id="password" value="<%= password %>" onchange="<%= call("onPasswordChange","this.value") %>">
                    <input type="submit" id="submit" value="Login" onclick="<%= call("onLogin") %>">

                    <div class="social-login-wrap">
                        <hr />
                        <label>Or login with</label>
                        <ul>
                            <li><a class="icon" onclick="<%= call("onLoginFacebook") %>"><i class="fa fa-facebook-square" data-original-title="Facebook"></i></a></li>
                            <li><a class="icon" onclick="<%= call("onLoginGithub") %>"><i class="fa fa-github-square" data-original-title="GitHub"></i></a></li>
                        </ul>
                    </div>

                <% } %>
            </div>
        `);
    }

    /**
     * 
     * Read input email value
     * 
     */
    protected onEmailChange(value) {
        this.email = value;
    }

    /**
     * 
     * Read input password value
     * 
     */
    protected onPasswordChange(value) {
        this.password = value;
    }

    /***********************************
     * 
     * User events
     * 
     ***********************************/

    /**
     * 
     * When user press enter in inputs
     * 
     */
    public onKeyDown(e) {
        if (e.key == "Enter") {
            this.onLogin(e);
        }
    }

    /**
     * 
     * When user clicked the login button
     * 
     */
    public onLogin(e) {
        this.state.error = null;

        if (!this.email) {
            this.state.error = 'Email is required';
            return;
        }

        if (!this.password) {
            this.state.error = 'Password is required';
            return;
        }

        this.state.loading = true;

        (<AppContext>this.context).dao.login(this.email, this.password)
            .then((res) => {
                this.state.error = null;
                this.state.loading = false;
            })
            .catch((err) => {
                this.state.error = err;
                this.state.loading = false;
            });
    }

}