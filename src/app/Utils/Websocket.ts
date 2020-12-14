/**
 * 
 * Helper for websocket handler
 * Chanel filtering messages from socket and add channel id to message, that will be sended through the socket
 * 
 */
export class WebsocketChannel {
    protected _name: string;
    protected _handler: WebsocketHandler;
    protected _onMessageCallback: ((message: any) => void);
    protected _onOpenCallback: ((e: any) => void);

    constructor(handler: WebsocketHandler, name: string) {
        this._handler = handler;
        this._name = name;
    }

    /**
     * 
     * Get channel name
     * 
     */
    public get name(): string {
        return this._name;
    }

    /**
     * 
     * Set on message callback, its called, when any message is recieved from
     * socket, and its body must be json.
     * 
     */
    public set onMessage(callback: ((message: any) => void) ) {
        this._onMessageCallback = callback;
    }

    /**
     * 
     * Set on open callback, its called, when websocket is ready
     * 
     */
    public set onOpen(callback: ((e: any) => void) ) {
        this._onOpenCallback = callback;
    }

    /**
     * 
     * Send message to this channel
     * 
     */
    public sendMessage(message: WebsocketMessage) {
        message.channel(this._name);
        this._handler.sendMessage(message);
    }

    /**
     * 
     * Recieve message from websocket handler
     * 
     */
    public receiveMessage(message: any) {
        if (message && message.message_channel == this._name) {
            if (this._onMessageCallback) {
                this._onMessageCallback(message);
            }
        }
    }

    /**
     * 
     * Call on open websocket callback
     * 
     */
    public callOnOpen(e: Event) {
        if (this._onOpenCallback) {
            this._onOpenCallback(e);
        }
    }
}

/**
 * 
 * Message object, for websocket stream
 * 
 */
export class WebsocketMessage {
    static STATUS_SUCCESS = "success";
    protected _message: any;

    constructor(message: any = {}) {
        this._message = message;
    }

    /**
     * 
     * Adds uuid to message, if you not specify uuid, it will be generated automaticaly
     * 
     */
    public uuid(uuid?: string): WebsocketMessage {
        if (!uuid) {
            uuid = Math.round(Math.random()*1000000).toString();
        }
        this._message.message_id = uuid;
        return this;
    }

    /**
     * 
     * Adds channel to message
     * 
     */
    public channel(channel: string): WebsocketMessage {
        this._message.message_channel = channel;
        return this;
    }

    /**
     * 
     * Adds type to message
     * 
     */
    public type(type: string): WebsocketMessage {
        this._message.message_type = type;
        return this;
    }

    /**
     * 
     * Adds status to message
     * 
     */
    public status(status: string): WebsocketMessage {
        this._message.status = status;
        return this;
    }

    /**
     * 
     * Add target id to message
     * 
     */
    public targetId(id: string): WebsocketMessage {
        this._message.target_id = id;
        return this;
    }

    public interfaceName(name: string): WebsocketMessage {
        this._message.interface_name = name;
        return this;
    }

    /**
     * 
     * Get message object from message holder
     * 
     */
    public get message(): any {
        return this._message;
    }
}


/**
 * 
 * Websocket holder...
 * 
 */
export class WebsocketHandler {

    private _url:string;
    private _socket:WebSocket;
    private _onOpenCallback: ((e: any) => void);
    private _onMessageCallback: ((message: any) => void);
    protected _channels: {[name: string]: WebsocketChannel};
    protected _socketOpened: boolean;
    protected _reconnectTime: number;
    protected _onSocketStatusChanged: ((opened: boolean) => void);
    protected _onSocketError: ((error: string) => void);
    private _reconnectAfterClose: boolean;

    protected _reconnectTimer: any;

    constructor(url?: string) {
        this.connect(url);
        this._channels = {};
        this._socketOpened = false;
        this._reconnectTime = 0;
        this._reconnectAfterClose = true;
        this._reconnectTimer = null;
    }

    /**
     * 
     * Set internal socket status
     * 
     */
    private setSocketOpenedStatus(opened: boolean) {
        if (this._socketOpened != opened) {
            this._socketOpened = opened;
            if (this._onSocketStatusChanged) {
                this._onSocketStatusChanged(this._socketOpened);
            }
        }
    }

    /**
     * 
     * Add channel to this websocket
     * 
     */
    public addChannel(channel: WebsocketChannel) {
        this._channels[channel.name] = channel;
    }

    /**
     * 
     * Recoonect,
     * You can change url in parameter
     * 
     */
    public reconnect(url?: string) {
        console.info('Websocket::reconnect');
        this.close();
        this.connect(url);
    }

    /**
     * 
     * Close connection
     * 
     */
    public close() {
        this._reconnectAfterClose = false;
        this.setSocketOpenedStatus(false);

        if (this._socket) {
            this._socket.onmessage = null;
            this._socket.onerror = null;
            this._socket.onclose = null;
            this._socket.close();
            this._socket = null;
        }
    }

    /**
     * 
     * Connect to url
     * 
     */
    public connect(url?: string) {
        if (url) {
            this._url = url;
        }

        if (!this._url) {
            console.info("ws.error","url is empty");
            return;
        }

        console.info("ws.connection","connecting to ",this._url);

        this._reconnectAfterClose = true;

        this._socket = new WebSocket(this._url);
        this._socket.onopen = (evt) => this.onOpenHandle(evt); 
        this._socket.onmessage = (evt) => this.onMessageHandle(evt);
        this._socket.onclose = (evt) => this.onCloseHandle(evt);
        this._socket.onerror = (evt) => this.onErrorHandle(evt);
    }

    /**
     * 
     * Send message to websocket
     * 
     */
    public sendMessage(message: WebsocketMessage) {
        if (!this._socket) {
            console.info("ws.send.error","socket not exists");
            return;
        }
        if (this._socketOpened) {
            this._socket.send(JSON.stringify(message.message));
        } else {
            console.info("ws.send.error","socket is not open");
        }
    }

    /**
     * 
     * Set on open callback, its called, when websocket is ready
     * 
     */
    public set onOpen(callback: ((e: any) => void) ) {
        this._onOpenCallback = callback;
    }

    /**
     * 
     * Set on message callback, its called, when any message is recieved from
     * socket, and its body must be json.
     * 
     */
    public set onMessage(callback: ((message: any) => void) ) {
        this._onMessageCallback = callback;
    }

    /**
     * 
     * Callback for status of websocket changed
     * 
     */
    public set onSocketStatusChanged(callback: ((status: boolean) => void)) {
        this._onSocketStatusChanged = callback;
    }

    /**
     * 
     * Set on error handler
     * 
     */
    public set onSocketError(callback: ((error: string) => void)) {
        this._onSocketError = callback;
    }

    /**
     * 
     * Get socket status instantly
     * 
     */
    public get opened(): boolean {
        return this._socketOpened;
    }

    /**
     * 
     * Private on close callback
     * 
     */
    private onCloseHandle(e:CloseEvent) {
        console.info("ws.close",e);
        this.setSocketOpenedStatus(false);
        if (this._reconnectAfterClose) {
            if (this._onSocketError) {
                let reason = e.reason;
                if (!reason) {
                    reason = "Connection was closed.";
                }
                this._onSocketError(reason);
            }
            this.again();
        }
    }

    /**
     * 
     * Private error callback, when error occured, try to restart websocket
     * 
     */
    private onErrorHandle(e:Event) {
        this.setSocketOpenedStatus(false);
        console.info("ws.error",e);
        this.again();
    }

    /**
     * 
     * Private callback on message from socket
     * 
     */
    private onMessageHandle(e: MessageEvent) {
        let msgJson = null;
        try {
            msgJson = JSON.parse(e.data);
        } catch (e) {
            console.error("ws.error", "parse message json", e);
        } finally {
            if (this._onMessageCallback) {
                this._onMessageCallback(msgJson);
            }
            for(let i in this._channels) {
                if (this._channels.hasOwnProperty(i)) {
                    this._channels[i].receiveMessage(msgJson);
                }
            }
        }
    }

    /**
     * 
     * Handle open callback
     * 
     */
    private onOpenHandle(e: Event) {
        console.info("ws.connection ","connected")
        this._reconnectTime = 0;
        this.setSocketOpenedStatus(true);
        if (this._onOpenCallback) {
            this._onOpenCallback(e);
        }

        for(let i in this._channels) {
            if (this._channels.hasOwnProperty(i)) {
                this._channels[i].callOnOpen(e);
            }
        }
    }

    private clearReconnectTimeout() {
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
    }

    /**
     * 
     * Try to reconnect
     * 
     */
    private again() {
        console.info("ws.reconnecting","next try to reconnect to websocket in",(Math.max(this._reconnectTime,10000)/1000) + "s");
        this.clearReconnectTimeout();
        this._reconnectTimer = setTimeout(() => {
            this.reconnect();
        }, Math.max(this._reconnectTime,10000));

        if (this._reconnectTime < 30000) {
            this._reconnectTime += 5000;
        }
    }
}