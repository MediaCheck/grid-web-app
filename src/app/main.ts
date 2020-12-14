import { Root } from './Components/Root';
import { AppContext } from './AppContext';
import { Dao } from './Dao';
import * as ts from 'typescript';
import ejs from 'ejs';
import autolayout from 'autolayout';
import { Store } from './Framework/Store/store';
import { StoreCache } from './Framework/Store/StoreCache';
import { Router } from './Framework/Router/Router';

//  define typescript globaly!
window["ts"] = ts;
declare var Offline:any;

/**
 * 
 * 
 * Prepare store for program run
 * 
 */
const store = new Store({
    app: {
        auth_token: null, //User token
        gridJson: null, //Grid source json
        targetId: null,
        gridUrl: null
    },
    temp: {
        loginRequired: false,
        error: null, //Some error, that will be showed in popup
        sockedOpened: false
    }
});

/**
 * 
 * Create persistent store holder (it will cache app object from store)
 * 
 */
const cache = new StoreCache(store, ["app"]);

/**
 * 
 * Create app
 * 
 */
const context = new AppContext(new Dao(store), store, "#views-holder");

/**
 * 
 * Create router - run application
 * 
 */
const router = new Router(context);
const root = new Root(context);
router.addRoute('/', root);
router.addRoute('/:instance/:program', root);
context.runApp(router);


//TODO
document.getElementById('loading-view').style.display = "none";

/**
 * 
 * Configure offline notification
 * 
 */
Offline.options = {
    checkOnLoad: false,
    interceptRequests: true,
    checks: {xhr: {url: '/connection-test'}}
};

Offline.on('down', function() {
    //store.state.connection.gridOnline = false;
});

Offline.on('up', function() {
    //store.state.connection.gridOnline = true;
});
/*
function testConnection() {
    Offline.check();
    setTimeout(testConnection, 5000);
}

testConnection();
*/
/**
 * 
 * Automatic cache updater
 * 
 */
window.applicationCache.addEventListener('updateready', function(e) {
    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
        // Browser downloaded a new app cache.
        alert('A new version of grid app is available. App will be reloaded');
        window.location.reload();
    } else {
        // Manifest didn't changed. Nothing new to server.
    }
}, false);