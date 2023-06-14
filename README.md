# Enphase Solar

The official [Enphase App](https://enphase.com/homeowners/enphase-app) limits
the arguably coolest feature of the app, the **Live Status** feature, to 15min
since (for whatever reason) it goes through their cloud, which means it's
expensive for them to run this.

## Live status as an SSE stream

This project makes the same data available locally as an
[SSE stream](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
that you can subscribe to. This means, for example, you can keep an eye on it in
a Picture-in-Picture window.

![Enphase Solar running in Picture-in-Picture mode.](https://github.com/tomayac/enphase-solar/assets/145676/ca10dac5-9e7d-4f2c-8f60-56cff458f0ff)

## On an Android phone

If you install [Termux](https://termux.dev/en/) from
[F-Droid](https://github.com/termux/termux-app#f-droid) and then
[install Node.js on an Android phone](https://www.crisisshelter.org/how-to-install-node-js-and-npm-in-termux-on-android/),
you can reuse an old Android phone like a Pixel&nbsp;1 as a permanent home
monitor.

![Enphase Solar running on a Pixel 1 Android phone.](https://github.com/tomayac/enphase-solar/assets/145676/0be973e7-95cf-41ed-8ac0-5914f804741c)

## WebLight integration

If you own a [WebLight](https://github.com/sowbug/weblight), you can see at a
glance if you're currently producing more than you're consuming (WebLight flashes green 🟢) or if
you're producing less (WebLight flashes red 🔴). If you plug a
[charge-through hub](https://www.amazon.com/usb-c-hub-pass-through-charging/s?k=usb+c+hub+pass+through+charging)
into the USB-C port of the Android phone, in theory you should be able to
connect the WebLight to the phone and keep it charging at the same time, but it
somehow would still drain the battery of mine, despite showing the phone is
charging.

![WebLight plugged into a USB hub flashing green.](https://github.com/tomayac/enphase-solar/assets/145676/f9bd0dfd-3a98-4d7b-b31e-ca3848256405)

## Supported hardware

Envoy-S Metered Enphase (SKU: `ENV-S-WM-230`, firmware version
`D7.0.88 (5580b1)`).

![Envoy-S Metered Enphase gateway.](https://github.com/tomayac/enphase-solar/assets/145676/0710b1ad-eb9e-4de8-addc-373dcdabe5a5)
