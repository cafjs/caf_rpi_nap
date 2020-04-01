// Modifications copyright 2020 Caf.js Labs and contributors
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
 * A proxy to shutdown, and restart after certain time, a RPi+WittyPi combo.
 *
 * @name caf_rpi_nap/proxy_iot_nap
 * @namespace
 * @augments caf_components/gen_proxy
 *
 */
var caf_iot = require('caf_iot');
var caf_comp = caf_iot.caf_components;
var genProxy = caf_comp.gen_proxy;

/**
 * Factory method to shutdown, and restart after certain time, a RPi+WittyPi
 * combo.
 *
 * @see caf_components/supervisor
 */
exports.newInstance = function($, spec, cb) {

    var that = genProxy.create($, spec);

    /**
     * Shutdowns the RPi and schedules a restart after some time.
     *
     * @param {number} afterSec Number of seconds the device should be shutdown.
     *
     * @throws Error If mock is disabled and there is no i2c device.
     *
     * @name caf_rpi_nap/proxy_iot_nap#haltAndRestart
     * @function
     */
    that.haltAndRestart = function(afterSec) {
        $._.__iot_haltAndRestart__(afterSec);
    };

    Object.freeze(that);

    cb(null, that);
};
