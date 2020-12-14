import * as parser from 'ua-parser-js';

export interface DeviceInfo {
    deviceName: string;
    deviceType: string;
    browserName: string;
}

/**
 * 
 * Get simple info about device...
 * 
 */
export function getDevice(): DeviceInfo {
    const ua = parser(navigator.userAgent);

    let ret = {
        deviceName: "",
        deviceType: "",
        browserName: ""
    }

    if (!ua.device.model) {
        ret.deviceName += ua.os.name;
    } else if (ua.device.model){
        ret.deviceName = ua.device.model;
    } else {
        ret.deviceName = "unknown";
    }

    if (!ua.device.type) {
        if (ua.os.name && ua.os.name.indexOf("Mac")!= -1) {
            ret.deviceType = "desktop";
        } else {
            ret.deviceType = "unknown";
        }
    } else {
        ret.deviceType = ua.device.type;
    }

    if (ua.browser.name && ua.browser.version) {
        ret.browserName = ua.browser.name + " " + ua.browser.version;
    } else if (ua.browser.name) {
        ret.browserName = ua.browser.name;
    } else {
        ret.browserName = "unknown";
    }

    return ret;
}

