# LANDOVARNISH
vcl 4.0;
# For debugging, use the following and inspect the output of `varnishlog`:

include "includes/backend.vcl";

import std;
import geoip;

sub vcl_recv {
    if (req.method == "GET" && req.url == "/.lando") {
        return (synth(204, "OK"));
    }
}

sub vcl_backend_response {
    set beresp.http.X-Lando-Varnish = "capes";
}

sub vcl_recv {
    if (req.http.CF-IPCountry) {
        set req.http.X-Country-Code = req.http.CF-IPCountry;
    } elseif (req.http.X-Real-IP) {
        set req.http.X-Country-Code = geoip.country_code(req.http.X-Real-IP);
    } else {
        set req.http.X-Country-Code = geoip.country_code(client.ip);
    }

    if (req.http.X-Country-Code) {



        if (req.http.X-Country-Code ~ "US|AS|BQ|IO|EC|SV|GU|HT|MH|FM|MP|PA|PW|PR|TL|TC|UM|VG|VI") {
            set req.http.X-Currency = "USD";
        } else if (req.http.X-Country-Code ~ "AD|AT|BE|CY|EE|FI|FR|GF|TF|DE|GP|GR|VA|IE|IT|LV|LT|LU|MT|MQ|YT|MC|ME|NL|PT|RE|BL|MF|PM|SM|SK|SI|ES|CE|CH|AX") {
            set req.http.X-Currency = "EUR";
        }
    }
}

include "includes/purge.vcl";
include "includes/mobile.vcl";

# See https://book.varnish-software.com/4.0/chapters/VCL_Basics.html

include "defaults/vcl_recv.vcl";

include "preset.vcl";
include "includes/static.vcl";

include "defaults/vcl_hash.vcl";
include "defaults/vcl_pipe.vcl";
include "defaults/vcl_backend_response.vcl";
include "defaults/vcl_backend_error.vcl";
include "defaults/vcl_deliver.vcl";
include "defaults/vcl_hit.vcl";
include "defaults/vcl_miss.vcl";
