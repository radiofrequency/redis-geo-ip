var assert = require("assert")

var rgeoip = require(__dirname + '/../rgeoip.js')({
    port: 6379,
    host: "localhost"
})

var _ = require("underscore")

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
var moretestips = require(__dirname + "/testips.json")
var moretestlocs = require(__dirname + "/testgeos.json")
var thecountrylist = null;
var citylist = require(__dirname + "/testlist.json")


describe('build the auto complete index', function() {
    it('should build the index', function(done) {
        rgeoip.build_index(10, "allcities", "allcities.autocomplete", function(err, data) {
            if (err) throw err
            done()
        })
    })
});

_.each(citylist, function(item) {
    describe('get autocomplete for city ' + item, function() {
        it('should return array of found cities', function(done) {
            rgeoip.autocomplete(item, 10, function(err, data) {
                /*if (typeof data !== "array") {
                    throw new Error("no array found")
                }*/
                console.log("found: ", data, "for", item)
                done()
            })

        })

    })
})
/*
describe('test list countries', function() {
    it('should return an array of countries', function(done) {
        rgeoip.list_countries(function(err, countrylist) {
            if (err) throw new Error(err)
            if (countrylist === undefined) {
                throw new Error("country list is undefined")
            }
            if (typeof(countrylist) !== "object") {
                throw new Error("country list is not an object")
            }

            if (countrylist.length < 1) {
                throw new Error("country list length < 1")
            }


            done()
            _.each(countrylist, function(country, index) {

                describe('test list states for country ' + country, function() {

                    it('should be a list', function(done2) {
                        rgeoip.list_states(country, function(err, statelist) {
                            if (err) throw err
                            done2()

                            _.each(statelist, function(state, index) {
                                describe('test city list for state ' + state, function() {
                                    it('should be a list', function(done3) {
                                        rgeoip.list_cities(country, state, function(err, citylist) {
                                            if (!citylist)
                                                throw new Error("no cities found for " + country + " " + state)
                                            if (citylist.length == 0)
                                                throw new Error("list cities zero cities for " + country + " " + state)
                                            if (err) throw err
                                            done3()

                                        })
                                    })
                                })
                            })

                        })
                    })
                })


            })

            _.each(countrylist, function(country, index) {
                describe('test region list for country ' + country, function() {
                    it('should be a list', function(done4) {
                        rgeoip.list_regions_for_country(country, function(err, citylist) {

                            if (err) throw err

                            if (citylist.length == 0)
                                throw new Error("list regions zero cities for " + country + " " + state)
                            done4()

                        })
                    })
                })
            })


        })
    })
})



describe('lookup ip 127.0.0.1', function() {
    it('should return developer geo', function(done) {
        rgeoip.lookup_ip('127.0.0.1', function(err, geo) {

            if (err) throw err
            assert.deepEqual(geo, developerGeo)
            done()
        })
    })
})


var c = 0;
_.each(moretestips, function(testip, range) {
    describe('lookup ip ' + testip, function() {
        it('should return', function(done) {
            rgeoip.lookup_ip(testip, function(err, geo) {
                if (err) throw err
                if (typeof geo !== "object")
                    throw new Error("not an object")

                if (typeof geo.state !== "string")
                    throw new Error("no state found")

                if (typeof geo.lat !== "number")
                    throw new Error("no lat found")

                if (typeof geo.lon !== "number")
                    throw new Error("no lon found")

                if (typeof geo.city !== "string")
                    throw new Error("no city found")

                if (typeof geo.country !== "string")
                    throw new Error("no country found")
                done()
            })

        })
    })

})


_.each(moretestlocs, function(loc, range) {
    describe('lookup lat/lon ' + loc[0] + "," + loc[1], function() {
        it('should return', function(done) {
            rgeoip.geodecode(loc[0], loc[1], function(err, geo) {
                if (err) throw err
                if (typeof geo !== "object")
                    throw new Error("not an object")

                if (typeof geo.state !== "string")
                    throw new Error("no state found")

                if (typeof geo.city !== "string")
                    throw new Error("no city found")

                if (typeof geo.country !== "string")
                    throw new Error("no country found")

                if (typeof geo.lat !== "number")
                    throw new Error("no lat found")

                if (typeof geo.lon !== "number")
                    throw new Error("no lon found")

                done()
            })

        })
    })

})*/