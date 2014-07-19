var geohasherjs = require(__dirname + "/libs/geohasherjs/build/Release/geohasherjs");
var redis = require('redis')
var _ = require('underscore')
var rcgeo;

var developerGeo = {
    "country": "Canada",
    "lon": -123.11934,
    "zipcode": "V5T 1C8",
    state: "British Columbia",
    "city": "VANCOUVER",
    "rangeMin": 3625168896,
    "key": "3625168896:3625172991",
    "lat": 49.24966,
    "timezone": "-07:00",
    "rangeMax": 3625172991
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
                    //console.log("not found");
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
                                    //console.log("no city found");
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

    var bi = function(char_limit, src, pos, limit, length, fn) {
        rcgeo.sort(src, "ALPHA", "LIMIT", pos, limit, function(err, alltags) {
            console.log("sorted!")
            if (err) {
                console.log(err);
                return fn(err)
            }
            console.log("sortdone", pos, limit, length)
            //console.log(alltags)
            var number = alltags.length;
            var processed = 0;

            _.each(alltags, function(tag) {



                var cutoff = char_limit;
                var space = 0;
                var prefix_tag = '';

                if (tag.length <= char_limit) {
                    cutoff = tag.length;
                } else {
                    space = tag.indexOf(' ');
                    if ((space > 0) && (space < char_limit)) {
                        //      cutoff = space;
                    }
                }

                for (var i = 0; i < cutoff; i++) {
                    prefix_tag += tag[i];

                    if (i < cutoff - 1) {
                        rcgeo.zadd(dst, '0', prefix_tag, rcgeo.print);
                    } else {
                        if (tag.length > cutoff) {
                            rcgeo.zadd(dst, '0', prefix_tag, rcgeo.print);
                        }
                    }
                }

                rcgeo.zadd(dst, '0', tag + '*', rcgeo.print);

                processed++;
                console.log("processed " + processed + " of " + number)
                if (processed == number) {
                    console.log('DONE: index added = ' + processed)
                    if (pos + limit < length) {
                        this.bi(char_limit, src, pos + limit, limit, length, fn)
                    } else
                        fn()
                }
            });
        });
    }

    this.build_index = function(char_limit, src, dst, fn) {

        rcgeo.exists(dst, function(err, exists) {
            if (exists) {
                return fn(null, 'index already built')

                console.error("index already exists")
            }
            rcgeo.scard(src, function(err, length) {
                bi(char_limit, src, 0, 1000, length, function() {
                    console.log("done indexing")
                })
            })


        })

        //const char_limit = 8;


    }

    this.autocomplete = function(prefix, count, fn) {
        var searchstate = 4;
        var searchcount = count;
        if (searchcount > searchstate)
            searchcount = searchstate;
        //if looking for more than 4  get first 3 from state and rest from world

        //var half = count / 2;

        this.lookup_ip("192.168.51.52", function(err, ipdata) {
            //console.log("found ip data", ipdata)
            //console.log("allcities:", "allcities.ac." + ipdata.country + ".'" + ipdata.state + "'")
            autocomplete_set("allcities:", "allcities.ac." + ipdata.country + ".'" + ipdata.state + "'", prefix, searchcount, function(err, results) {
                if (err) throw err
                    //console.log("set1", results)
                var rest = count - results.length
                    //console.log("rest", rest)

                if (rest > 0) {
                    //console.log("complete next set")
                    autocomplete_set("allcities:", "allcities.ac", prefix, rest, function(err, results2) {
                        //console.log("set2", results2)
                        console.log(results2)
                        var ret = []
                        if (results !== null)
                            ret = results.push.apply(results2);
                        else
                            ret = results2;

                        //results.push.apply(results2);
                        console.log(ret)
                        fn(null, ret)
                    });
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
        //console.log("titlecased", prefix)
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
            /*var get_more_results = function(fn) {

            if (results.length == count) {
                console.log("matches length return")
                return fn();
            }

            rcgeo.zrangebylex(set, start, start + rangelen - 1, function(err, range) {

                var ops = 0;
                var len = range.length;
                console.log(range.length)
                console.log('range: range.length: ' + range.length);
                start += rangelen;
                if (range.length > 0) {
                    var minlen = 0;

                    for (var i = 0; i < range.length; i++) {
                        minlen = ((range[i]).length >= prefix.length) ? prefix.length : (range[i]).length;
                        if ((range[i]).substr(0, minlen) != prefix.substr(0, minlen)) {
                            console.log('no more matches');
                            count = results.length;
                            //return get_more_results(fn)
                            break;
                        }
                        if (((range[i]).indexOf('*', (range[i]).length - 1) != -1) && (results.length != count)) {
                            var t = range[i];
                            var t2 = t.substring(0, t.length - 1);
                            results.push(hash + t2);
                            //console.log('match: ' + t2);


                        }
                    }
                    get_more_results(fn);
                }

            });
        }*/

        rcgeo.zrangebylex(set, "[" + prefix, "[" + prefix + "z", "LIMIT", "0", count,
            function(err, results) {
                //console.log(results)

                if (results == null) {
                    //  console.log('No matches for: ' + prefix);
                    next(null, [])
                    return;
                }

                //get_more_results(function() {
                //console.log('RESULTS: ', results);

                loadhash(results, function(err, data) {
                    return next(null, data)

                })

                //});
            });

    }

    this.list_regions_for_country = function(country, fn) {
        rcgeo.sort("country:" + country + ".regions", "ALPHA", function(err, citydata) {
            if (err) fn(err)
            return fn(null, citydata)
        });
    }

    /*        this.list_regions_for_state = function(country, state, fn) {
            rcgeo.smembers("country:" + country + "." + state + ".regions", function(err, citydata) {
                if (err) fn(err)
                return fn(null, citydata)
            });
        }*/

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