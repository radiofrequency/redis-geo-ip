var geohasherjs = require(__dirname + "/libs/geohasherjs/build/Release/geohasherjs");
var redis = require('redis')
var _ = require('underscore')
var rcgeo;

var developerGeo = {
    "country": "CA",
    "lon": -123.11934,
    "zipcode": "V5T 1C8",
    state: "Alberta",
    countryName: "Canada",
    "city": "Calgary",
    "key": "3625168896:3625172991",
    "lat": 49.24966,
    "timezone": "-07:00",
}
var developerIps = ["localhost", "127.0.0.1"]


function app(options) {
    var self = this;
    if (typeof(options) === "undefined") options = {}
    rcgeo = options.client || new require('redis').createClient(options.port || options.socket, options.host, options);
    if (typeof(rcgeo) === "undefined") throw "no redis connection"

    if (options.pass) {
        rcgeo.auth(options.pass, function(err) {
            if (err) throw err;
        });
    }

    rcgeo.select(8, rcgeo.print)

    var deg2rad = function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }
    var dot2num = function dot2num(dot) {
        if (dot) {
            var d = dot.split('.');
            return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
        } else {
            return "";
        }
    }

    var getDistanceFromLatLonInKm = function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1); // deg2rad below
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    var getDistance = function getDistance(geohash1, geohash2, fn) {
        geohasherjs.decode_dec(geohash1, function(err, lat, lon) {
            var coords1 = {};
            coords1.lat = lat;
            coords1.lon = lon;
            geohasherjs.decode_dec(geohash2, function(err, lat, lon) {
                var coords2 = {}
                coords2.lat = lat;
                coords2.lon = lon;
                try {
                    var result = getDistanceFromLatLonInKm(coords1.lat, coords1.lon, coords2.lat, coords2.lon);
                } catch (ex) {
                    result = false;
                }
                return fn(null, result)
            });
        });
    }
    var getClosestGeoHash = function getClosestGeoHash(geokey, geohash, fn) {
        rcgeo.zrangebyscore(geokey, geohash, 'inf', "LIMIT", 0, 8, function(err, rangeresult) {
            rcgeo.zrevrangebyscore(geokey, geohash, '-inf', "LIMIT", 0, 8, function(err, revrangeresult) {
                var closestDist = 0;
                var closestItem = null;
                var candidates = rangeresult.concat(revrangeresult);

                if (candidates.length < 1) {
                    return fn(null, "none found");

                } else {

                    var ops = 0;
                    _.each(candidates, function(candidate) {
                        var stuff = candidate.split(":");
                        try {
                            var candidategeo = geohasherjs.encode_dec(stuff[1], stuff[2]);

                        } catch (ex) {
                            return fn(new Error("unable to geohash lat / long"), "getObjectGeoHash error");
                        }
                        getDistance(geohash, candidategeo, function(err, thisdist) {

                            if (closestDist == 0) {
                                closestDist = thisdist;
                                closestItem = candidate;
                            } else if (thisdist < closestDist) {
                                closestDist = thisdist;
                                closestItem = candidate;
                            }

                            ops++;
                            if (ops == candidates.length) {
                                if (closestItem == null) {
                                    return fn(null, {
                                        city: null,
                                        lat: null,
                                        lon: null,
                                        state: null,
                                        country: null
                                    })
                                } else {
                                    var newstuff = closestItem.split(":");
                                    return fn(null, {
                                        city: newstuff[3],
                                        lat: parseFloat(newstuff[1]),
                                        lon: parseFloat(newstuff[2]),
                                        state: newstuff[5],
                                        country: newstuff[4]
                                    });
                                }
                            }
                        });
                    });
                }
            });
        });
    }

    this.lookup_ip = function(ip, fn) {
        if (ip === "localhost" || ip === "localhost:3000" || ip === "127.0.0.1" || ip === '199.167.20.226') {
            return fn(null, developerGeo);
        }

        rcgeo.zrangebyscore("iprange:ip2location", dot2num(ip), '+inf', "LIMIT", 0, 1, function(err, data) {
            if (data) {
                if (data.length > 0) {
                    try {
                        var jdata = JSON.parse(data);
                    } catch (ex) {
                        return fn(new Error("cant parse geo data"), "lookupIP");
                    }
                    return fn(null, jdata);
                }
            } else {
                return fn(new Error("lookup_ip: can't find: " + ip), null)
            }
        })
    }

    this.list_cities = function(country, state, fn) {
        rcgeo.sort("country:" + country + "." + state + ".cities", "ALPHA", function(err, citydata) {
            if (err) fn(err)
            return fn(null, citydata)
        });
    }

    this.list_countries = function(fn) {
        rcgeo.sort("allcountries", "ALPHA", function(err, countries) {
            if (err) throw err
            return fn(null, countries)
        })
    }

    this.autocomplete = function(ip, prefix, count, fn) {
        var searchstate = 4;
        var searchcount = count;
        if (searchcount > searchstate)
            searchcount = searchstate;

        this.lookup_ip(ip, function(err, ipdata) {
            console.log("found ip data", ipdata)
            autocomplete_set("allcities:", "allcities.ac." + ipdata.country + ".'" + ipdata.state + "'", prefix, searchcount, function(err, results) {
                if (err) throw err
                console.log("set1", results)
                var rest = count - results.length

                _.each(results, function(item) {
                    item.set = "1"
                })

                if (rest > 0) {
                    autocomplete_set("allcities:", "allcities.ac", prefix, rest, function(err, results2) {

                        _.each(results2, function(item) {
                            item.set = "2"
                        })
                        if (results !== null)
                            results.push.apply(results, results2)
                        return fn(null, results)

                        fn(null, results2)
                    });
                } else {
                    fn(null, results)
                }
            });
        })
    }

    var toTitleCase = function toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    var autocomplete_set = function(hash, set, prefix, count, next) {

        var results = [];
        var rangelen = 50;
        var start = 0;
        prefix = toTitleCase(prefix);
        var loadhash = function(keySet, fn) {

            var items = [];
            var ops = 0;
            if (keySet.length > 0) {
                _.each(keySet, function(key) {
                    //console.log(key)
                    rcgeo.hgetall(hash + key, function(err, hash) {
                        ops++;
                        if (err) {
                            return fn(new Error('loadhash failed for keyset: ' + keySet));
                        }
                        hash.display = hash.name + ", " + hash.state + ", " + hash.country;

                        items.push(hash);
                        if (ops == keySet.length) {
                            return fn(null, items);
                        }
                    });
                });
            } else {
                return fn(null, items);
            }

        }


        rcgeo.zrangebylex(set, "[" + prefix, "[" + prefix + "z", "LIMIT", "0", count,
            function(err, results) {
                if (results == null) {
                    next(null, [])
                    return;
                }
                loadhash(results, function(err, data) {
                    return next(null, data)
                })
            });

    }

    this.list_regions_for_country = function(country, fn) {
        rcgeo.sort("country:" + country + ".regions", "ALPHA", function(err, citydata) {
            if (err) fn(err)
            return fn(null, citydata)
        });
    }

    this.list_states = function(country, fn) {
        rcgeo.sort("country:" + country + ".states", "ALPHA", function(err, citydata) {
            if (err) fn(err)
            return fn(null, citydata)
        });
    }

    this.geodecode = function(lat, lon, fn) {
        getClosestGeoHash("City:geohash", geohasherjs.encode_dec(lat, lon), function(err, result) {
            if (err) return fn(err)
            return fn(null, result)
        })
    }
}

module.exports = function(options) {
    return new app(options);
}