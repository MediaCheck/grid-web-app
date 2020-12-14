import { WebsocketHandler, WebsocketChannel, WebsocketMessage } from './Utils/Websocket';
import { Core } from 'the-grid';

/**
 * 
 * Main service for communication with blocko (homer)
 * It is creates websocket holder automaticaly and try to connect to websocket,
 * if url was specified.
 * 
 */
export class BlockoService implements Core.BlockoService {

    static getServiceName():string {
        return "BlockoService";
    }

    private analogCache:{ [interfaceName:string]:number };
    private digitalCache:{ [interfaceName:string]:boolean };
    private digitalCallbacks:any[];
    private analogCallbacks:any[];
    private messageCallbacks:any[];
    private refreshInterval:any;
    private gridChannel: WebsocketChannel;
    private config: any;

    constructor(config:any) {
        this.analogCache = {};
        this.digitalCache = {};
        this.digitalCallbacks = [];
        this.analogCallbacks = [];
        this.messageCallbacks = [];
        this.refreshInterval = null;

        this.setNewConfig(config);
    }

    /**
     * 
     * 
     * Add websocket handler from external source
     * 
     */
    public setWebsocket(handler: WebsocketHandler) {
        console.info('BlockoService::setWebsocket');
        this.gridChannel = new WebsocketChannel(handler, "the-grid");
        this.gridChannel.onOpen = (e: Event) => this.onOpen(e);
        handler.addChannel(this.gridChannel);
        this.gridChannel.onMessage = (message: any) => this.onMessage(message);

        if (handler.opened) {
            this.getAllStatus();
        }
    }

    /**
     * 
     * Set new config for this service
     * 
     */
    public setNewConfig(config:any) {
        this.config = config;
    }

    /**
     * 
     * Get last configuration
     * 
     */
    public getConfig(): any {
        return this.config;
    }

    /**
     * 
     * Register callback for handling changes on digital input from websocket
     * 
     */
    public registerDigitalCallback(interfaceName:string, callback:(value:boolean, interfaceName:string)=>void) {
        this.digitalCallbacks.push({
            interfaceName: interfaceName,
            callback: callback
        });

        if (this.digitalCache.hasOwnProperty(interfaceName)) {
            callback(this.digitalCache[interfaceName], interfaceName);
        }
    }

    /**
     * 
     * Unregister callback
     * 
     */
    public unregisterDigitalCallback(interfaceName: string, callback:(value: boolean, name:string)=>void) {
        let i = -1;
        this.digitalCallbacks.forEach((cbObj:any, index:number) => {
            if (cbObj.callback == callback && cbObj.interfaceName == interfaceName) {
                i = index;
            }
        });

        if (i > -1) {
            this.digitalCallbacks.splice(i);
        }
    }

    /**
     * 
     * Register callback for handling changes on analog input from websocket
     * 
     */
    public registerAnalogCallback(interfaceName:string, callback:(value:number, name:string)=>void) {
        this.analogCallbacks.push({
            interfaceName: interfaceName,
            callback: callback
        });

        if (this.analogCache.hasOwnProperty(interfaceName)) {
            callback(this.analogCache[interfaceName], interfaceName);
        }
    }

    /**
     * 
     * Unregister callback
     * 
     */
    public unregisterAnalogCallback(interfaceName:string, callback:(value:number, name:string)=>void) {
        let i = -1;
        this.analogCallbacks.forEach((cbObj:any, index:number) => {
            if (cbObj.callback == callback && cbObj.interfaceName == interfaceName) {
                i = index;
            }
        });

        if (i > -1) {
            this.analogCallbacks.splice(i);
        }
    }

    /**
     * 
     * Register callback for handling changes on digital input from websocket
     * 
     */
    public registerMessageCallback(interfaceName:string, callback:(message:any, interfaceName:string)=>void) {
        this.messageCallbacks.push({
            interfaceName: interfaceName,
            callback: callback
        });
    }

    /**
     * 
     * Unregister callback
     * 
     */
    public unregisterMessageCallback(interfaceName: string, callback:(message:any, name:string)=>void) {
        let i = -1;
        this.messageCallbacks.forEach((cbObj:any, index:number) => {
            if (cbObj.callback == callback && cbObj.interfaceName == interfaceName) {
                i = index;
            }
        });

        if (i > -1) {
            this.digitalCallbacks.splice(i);
        }
    }

    /**
     * 
     * Set digital value - send it
     * 
     */
    public setDigitalValue(interfaceName:string, value:boolean) {
        if (!this.gridChannel) {
            return;
        }

        let message = new WebsocketMessage({ value: value })
            .uuid()
            .targetId(this.config.targetId)
            .interfaceName(interfaceName)
            .type("set_digital_value");

        this.gridChannel.sendMessage(message);
    }

    /**
     * 
     * Set analog value - send it
     * 
     */
    public setAnalogValue(interfaceName:string, value:number) {
        if (!this.gridChannel) {
            return;
        }

        let message = new WebsocketMessage({ value: value })
            .uuid()
            .targetId(this.config.targetId)
            .interfaceName(interfaceName)
            .type("set_analog_value");

        this.gridChannel.sendMessage(message);
    }

    /**
     * 
     * Send new message
     * 
     * MessageValue interface as parameter
     */
    public sendMessage(interfaceName:string, value:any) {
        if (!this.gridChannel) {
            return;
        }

        const messageObj = {
            values: value.values,
            argTypes: value.types
        };

        let message = new WebsocketMessage({ value: messageObj })
            .uuid()
            .targetId(this.config.targetId)
            .interfaceName(interfaceName)
            .type("set_message");

        this.gridChannel.sendMessage(message);
    }

    /**
     * 
     * Private on open callback
     * It will create interval, that is checking websocket status every 10 seconds
     * 
     */
    private onOpen(e:Event) {
        clearInterval(this.refreshInterval);
        setTimeout(() => {
            this.getAllStatus();
        }, 100);

        this.refreshInterval = setInterval(() => {
            this.getAllStatus();
        }, 10000);
    }

    /**
     * 
     * TODO message router - its nasty code
     * 
     */
    private onMessage(eventMessage: any) {

        console.log('Received: ' + JSON.stringify(eventMessage));
        if (!eventMessage) {
            return;
        }

        if (eventMessage.message_type == "new_external_output_connector_value") {

            if (typeof eventMessage.value === 'boolean') {
                this.newDigitalValue(eventMessage.interface_name, eventMessage.value);
            } else if (typeof eventMessage.value === 'number') {
                this.newAnalogValue(eventMessage.interface_name, eventMessage.value);
            } else if (typeof eventMessage.value === 'object') {
                this.newMessage(eventMessage.interface_name, eventMessage.value);
            } else {
                return;
            }

            let message = new WebsocketMessage()
                .uuid(eventMessage.messageId)
                .type("new_external_output_connector_value")
                .interfaceName(eventMessage.interface_name)
                .status(WebsocketMessage.STATUS_SUCCESS);

            this.gridChannel.sendMessage(message);
        } else if (eventMessage.message_type == "new_digital_value") {
            this.newDigitalValue(eventMessage.interface_name, eventMessage.value);

            let message = new WebsocketMessage()
                .uuid(eventMessage.messageId)
                .type("new_digital_value")
                .interfaceName(eventMessage.interface_name)
                .status(WebsocketMessage.STATUS_SUCCESS);

            this.gridChannel.sendMessage(message);
        } else if (eventMessage.message_type == "new_analog_value") {
            this.newAnalogValue(eventMessage.interface_name, eventMessage.value);

            let message = new WebsocketMessage()
                .uuid(eventMessage.messageId)
                .type("new_analog_value")
                .interfaceName(eventMessage.interface_name)
                .status(WebsocketMessage.STATUS_SUCCESS);

            this.gridChannel.sendMessage(message);
        } else if (eventMessage.message_type == "new_message") {
            this.newMessage(eventMessage.interface_name, eventMessage.value);

            let message = new WebsocketMessage()
                .uuid(eventMessage.messageId)
                .type("new_message")
                .interfaceName(eventMessage.interface_name)
                .status(WebsocketMessage.STATUS_SUCCESS);

            this.gridChannel.sendMessage(message);
        } else if (eventMessage.message_type == "get_values") {
            if (eventMessage.status == WebsocketMessage.STATUS_SUCCESS) {
                let external = eventMessage.external[this.config.targetId];

                if (external && external.hasOwnProperty('outputs')) {
                    let outputs = external['outputs'];
                    for (let key in outputs) {
                        if (outputs.hasOwnProperty(key)) {
                            let output = outputs[key];
                            if (typeof output === 'boolean') {
                                this.newDigitalValue(key, output)
                            } else if (typeof output === 'number') {
                                this.newAnalogValue(key, output);
                            } else if (typeof output === 'object') {
                                this.newMessage(key, output);
                            } else {
                                console.warn('Unknown output:', key);
                            }
                        }
                    }
                }

                if (external && external.hasOwnProperty('inputs')) {
                    let inputs = external['inputs'];
                    for (let key in inputs) {
                        if (inputs.hasOwnProperty(key)) {
                            let input = inputs[key];
                            if (typeof input === 'boolean') {
                                this.newDigitalValue(key, input)
                            } else if (typeof input === 'number') {
                                this.newAnalogValue(key, input);
                            } else if (typeof input === 'object') {
                                this.newMessage(key, input);
                            } else {
                                console.warn('Unknown input:', key);
                            }
                        }
                    }
                }

                /*
                let analogEventCache = eventMessage.analog[this.config.targetId];
                let digitalEventCache = eventMessage.digital[this.config.targetId];

                if (analogEventCache) {
                    for (let interfaceName in analogEventCache) {
                        if (!analogEventCache.hasOwnProperty(interfaceName)) continue;
                        this.newAnalogValue(interfaceName, analogEventCache[interfaceName]);
                    }
                }

                if (digitalEventCache) {
                    for (let interfaceName in digitalEventCache) {
                        if (!digitalEventCache.hasOwnProperty(interfaceName)) continue;
                        this.newDigitalValue(interfaceName, digitalEventCache[interfaceName]);
                    }
                }*/
            }
        }
    }

    /**
     * 
     * Private handle new digital value from socket...
     * 
     */
    private newDigitalValue(interfaceName:string, value:boolean):void {
        this.digitalCache[interfaceName] = value;
        this.sendDigitalValueToInterface(interfaceName);
    }

    /**
     * 
     * Private handle new analog value from socket...
     * 
     */
    private newAnalogValue(interfaceName:string, value:number):void {
        this.analogCache[interfaceName] = value;
        this.sendAnalogValueToInterface(interfaceName);
    }

    /**
     * 
     * Private handle message from socket...
     * 
     */
    private newMessage(interfaceName:string, value:any):void {
        const messageObj = {
            values: value.values,
            types: value.argTypes
        }
        this.sendMessageToInterface(interfaceName, messageObj);
    }

    /**
     * 
     * Private send new value into hw (callback that was registred)
     * 
     */
    private sendDigitalValueToInterface(interfaceName:string) {
        if (this.digitalCache.hasOwnProperty(interfaceName)) {
            this.digitalCallbacks.forEach((cbObj:any) => {
                if (cbObj.interfaceName == interfaceName) {
                    cbObj.callback(this.digitalCache[interfaceName], interfaceName);
                }
            });
        }
    }

    /**
     * 
     * Private send new value into hw (callback that was registred)
     * 
     */
    private sendAnalogValueToInterface(interfaceName:string) {
        if (this.analogCache.hasOwnProperty(interfaceName)) {
            this.analogCallbacks.forEach((cbObj:any) => {
                if (cbObj.interfaceName == interfaceName) {
                    cbObj.callback(this.analogCache[interfaceName], interfaceName);
                }
            });
        }
    }

    /**
     * 
     * Private send new message into hw  (callback that was registred)
     * 
     */
    private sendMessageToInterface(interfaceName:string, message:any) {
        this.messageCallbacks.forEach((cbObj:any) => {
            if (cbObj.interfaceName == interfaceName) {
                cbObj.callback(message, interfaceName);
            }
        });
    }

    /**
     * 
     * Send request for get status about all...
     * 
     */
    private getAllStatus() {
        if (!this.gridChannel) {
            return;
        }

        let message = new WebsocketMessage()
            .uuid()
            .type("get_values");

        this.gridChannel.sendMessage(message);
    }
}