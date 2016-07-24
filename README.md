# CAF (Cloud Assistant Framework)

Co-design permanent, active, stateful, reliable cloud proxies with your web app or gadget.

See http://www.cafjs.com

## CAF RPI NAP

This library shutdowns and restarts after certain time a RPi+WittyPi combo.

It runs in the device not in the cloud.

## API

    lib/proxy_iot_nap.js

## Configuration Example

### iot.json

    {
            "module": "caf_rpi_nap#plug_iot",
            "name": "nap",
            "description": "Access to shutdown/delayed restart for this device.",
            "env" : {
                "maxRetries" : "$._.env.maxRetries",
                "retryDelay" : "$._.env.retryDelay",
                "deviceRTC" : "process.env.DEVICE_RTC||/dev/i2c-1",
                "deviceAddress" : "process.env.DEVICE_ADDRESS||0x68",
                "allowMock" : "process.env.ALLOW_MOCK||true",
                "shutdownCommand" : "process.env.SHUTDOWN_COMMAND||shutdown.sh'
            },
            "components" : [
                {
                    "module": "caf_rpi_nap#proxy_iot",
                    "name": "proxy",
                    "description": "Proxy to shutdown/delayed restart service",
                    "env" : {
                    }
                }
            ]
    }

where `deviceRTC` and `deviceAddress` are associated with the i2c interface that the WittyPi exposes. `allowMock` simulates shutdown and restart with error messages. Mocking only changes behavior when there is no i2c device, avoiding component error in that case.
