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
 *  Uses an i2c RTC module (i.e., ds1337 in the WittyPi) to schedule a board
 * restart after a complete shutdown.
 *
 * The purpose is to save energy. The RTC module can work for years with
 * a reasonable battery, and the annoying disappearance of the device can
 * be compensated by the permanent presence of its Cloud Assistant, that also
 * controls when the device should be up.
 *
 * @name caf_rpi_nap/plug_iot_nap
 * @namespace
 * @augments caf_components/gen_plug
 *
 */
var assert = require('assert');
var i2c = require('i2c-bus');
var caf_iot = require('caf_iot');
var caf_comp = caf_iot.caf_components;
var async = caf_comp.async;
var myUtils = caf_comp.myUtils;
var genPlugIoT = caf_iot.gen_plug_iot;

var exec = require('child_process').exec;
var fs = require('fs');
var domain = require('domain');
var ds1337 = require('./ds1337_util');
var path = require('path');


/**
 * Factory method for a plug that controls restart after a complete shutdown.
 *
 * @see caf_components/supervisor
 */
exports.newInstance = function($, spec, cb) {
    try {
        var cbOnce = myUtils.callJustOnce(function(err) {
            if (err) {
                $._.$.log &&
                    $._.$.log.debug('Ignoring >1 callback with error:' +
                                    myUtils.errToPrettyStr(err));
            }
        }, cb);

        var disableWithError = null;
        var that = genPlugIoT.constructor($, spec);

        $._.$.log && $._.$.log.debug('New Nap plug');

        assert.equal(typeof spec.env.deviceAddress, 'string',
                     "'spec.env.deviceAddress' not a string");
        var deviceAddress = parseInt(spec.env.deviceAddress);

        var rtc = null;

        assert.equal(typeof spec.env.deviceRTC, 'string',
                     "'spec.env.deviceRTC' not a string");
        var devNum = parseInt(spec.env.deviceRTC.split('-')[1]);
        assert(!isNaN(devNum), 'Invalid device ' + spec.env.deviceRTC);

        assert.equal(typeof spec.env.shutdownCommand, 'string',
                     "'spec.env.shutdownCommand' not a string");
        var shutdownCommand = path.resolve(__dirname, spec.env.shutdownCommand);

        assert.equal(typeof spec.env.allowMock, 'boolean',
                     "'spec.env.allowMock' not a boolean");

        /**
         * Halts the board, scheduling a late restart with the RTC timer.
         *
         * @param {number} afterSec Seconds before the board restarts.
         *
         * @throws Error if mock is disabled and there is no i2c device.
         */
        that.__iot_haltAndRestart__ = function(afterSec) {
            var doHalt = function(cb0) {
                exec(shutdownCommand, function (error, stdout, stderr) {
                    $._.$.log && $._.$.log.debug('stdout: ' + stdout);
                    $._.$.log && $._.$.log.debug('stderr: ' + stderr);
                    if (error !== null) {
                        cb0(error);
                    } else {
                        cb0(null);
                    }
                });
            };
            var cb0 = function(err) {
                if (err) {
                    $._.$.log &&
                        $._.$.log.warn('Cannot haltAndRestart: ' +
                                       myUtils.errToPrettyStr(err));
                } else {
                    $._.$.log && $._.$.log.debug('haltAndRestart OK');
                }
            };

            var hwNow;
            if (disableWithError) {
                if (spec.env.allowMock) {
                    $._.$.log && $._.$.log.debug('MOCK: haltAndRestart after ' +
                                                 afterSec + ' seconds');
                } else {
                    throw disableWithError;
                }
            } else {
                async.waterfall([
                    function(cb1) {
                        ds1337.getDS1337Time(rtc, deviceAddress, cb1);
                    },
                    function(now, cb1) {
                        hwNow = now;
                        ds1337.activateAlarm(rtc, deviceAddress, cb1);
                    },
                    function(_ignore, cb1) {
                        var newTime = hwNow.getTime() + 1000* afterSec;
                        var newQ = new Date(newTime);
                        var mday = newQ.getUTCDate();
                        var hour = newQ.getUTCHours();
                        var min = newQ.getUTCMinutes();
                        var sec = newQ.getUTCSeconds();
                        ds1337.setStartupAlarm(rtc, deviceAddress, mday,
                                               hour, min, sec, cb1);
                    }
                ], function(err) {
                    if (err) {
                        cb0(err);
                    } else {
                        $._.$.log && $._.$.log.debug('Halting!!!');
                        doHalt(cb0);
                    }
                });
            }
        };

        var errorCB = function(err) {
            if (err) {
                disableWithError = err;
                $._.$.log &&
                    $._.$.log.warn('Disabling plug_nap due to error: ' +
                                   myUtils.errToPrettyStr(err));
            }
            if (err && !spec.env.allowMock) {
                $._.$.log && $._.$.log.warn('Mock disable, fail');
                cbOnce(err);
            } else {
                if (err) {
                    $._.$.log && $._.$.log.warn('Mock enable, continue');
                }
                cbOnce(null, that); // continue but just mock
            }
        };

        var d = domain.create();

        d.on('error', errorCB);

        d.run(function() {
            var info = fs.statSync(spec.env.deviceRTC); // throws if no device
            $._.$.log && $._.$.log.debug(info);
            rtc = i2c.openSync(devNum);

            /* Assumed system time is OK by now, otherwise certificate
             * verification would have already failed.
             *
             * The RTC clock is mostly used for setting alarms with relative
             * timing, and we use NTP or other ntp-like protocols for time sync.
             */
            ds1337.setDS1337Time(rtc, deviceAddress, new Date(), errorCB);
        });

    } catch (err) {
        cbOnce(err);
    }
};
