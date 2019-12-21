/*!
 Copyright 2013 Hewlett-Packard Development Company, L.P.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

/**
 * Helper functions to program the RTC in the WittyPi
 *
 * @name caf_rpi_nap/ds1337_util
 * @namespace
 */

var DS1337_TIME_ADDRESS = 0x00;
var DS1337_TIME_BYTES = 0x07;
var DS1337_ALARM_CONFIG_ADDRESS = 0x0E;
var DS1337_ALARM_CONFIG = 0x07; //both alarms active, only first one used.
var DS1337_ALARM_ADDRESS = 0x07; // first alarm


var BCDToDec = function(x, mask) {
    x = (mask ? (x & mask) : x);
    return (x >> 4)*10 + (x & 0x0F);
};

var decToBCD = function(x) {
    return Math.floor(x/10) << 4 | x%10;
};


exports.setDS1337Time = function(rtc, deviceAddress, t, cb0) {
    var bytes = [
        t.getUTCSeconds(),
        t.getUTCMinutes(),
        t.getUTCHours(),
        t.getUTCDay() + 1,
        t.getUTCDate(),
        t.getUTCMonth() + 1,
        t.getUTCFullYear() -2000
    ].map(decToBCD);

    var bytesBuffer = Buffer.from(bytes);
    rtc.writeI2cBlock(deviceAddress, DS1337_TIME_ADDRESS,
                      bytesBuffer.length, bytesBuffer, cb0);
};

exports.getDS1337Time = function(rtc, deviceAddress, cb0) {
    var bytesBuffer = Buffer.alloc(DS1337_TIME_BYTES);
    rtc.readI2cBlock(deviceAddress, DS1337_TIME_ADDRESS,
                     DS1337_TIME_BYTES, bytesBuffer,
                     function(err, bytesRead, res) {
                         if (err) {
                             cb0(err);
                         } else if (bytesRead !==
                                    DS1337_TIME_BYTES) {
                             var msg = 'Not all bytes read';
                             var er = new Error(msg);
                             er.bytesRead = bytesRead;
                             er.res = res;
                             cb0(er);
                             //only 24h mode supported
                         } else if (res[2] & 0x40) {
                             var errMsg = '12h mode not  supported';
                             er = new Error(errMsg);
                             er.res = res;
                             cb0(er);
                         } else {
                             var sec = BCDToDec(res[0]);
                             var min = BCDToDec(res[1]);
                             var hour = BCDToDec(res[2], 0x3F);
                             // res[3] is just the day of the week
                             var mday = BCDToDec(res[4]);
                             var month = BCDToDec(res[5], 0x1F) -1;
                             var year = BCDToDec(res[6]) + 2000;
                             var date = Date.UTC(year, month, mday,
                                                 hour, min, sec);
                             cb0(null, new Date(date));
                         }
                     });
};

exports.activateAlarm = function(rtc, deviceAddress, cb0) {
    var bytes = [];
    bytes[0] = DS1337_ALARM_CONFIG;
    var cb1 = function(err) {
        // wrap for async.waterfall
        cb0(err, null);
    };
    var bytesBuffer = Buffer.from(bytes);
    rtc.writeI2cBlock(deviceAddress, DS1337_ALARM_CONFIG_ADDRESS,
                      bytesBuffer.length, bytesBuffer, cb1);
};

exports.setStartupAlarm = function(rtc, deviceAddress, date, hour, min, sec,
                                   cb0) {
    var bytes = [];
    bytes[0] = decToBCD(sec);
    bytes[1] = decToBCD(min);
    bytes[2] = decToBCD(hour);
    bytes[3] = decToBCD(date);
    var bytesBuffer = Buffer.from(bytes);
    rtc.writeI2cBlock(deviceAddress, DS1337_ALARM_ADDRESS,
                      bytesBuffer.length, bytesBuffer, cb0);
};
