var geohasherjs = require('./build/Release/geohasherjs');

console.warn(geohasherjs);

//console.warn(geohashwerjs.fibonacci(9));
/*
geohasherjs.callback(false, function(err, result) {
    console.warn(result);
});*/
//not used
var obj = new geohasherjs.GeoPoint(42, 42);
console.warn(obj);
console.warn(obj.lat());
console.warn(obj.lon());

//console.
// warn(geohasherjs.fibonacci(9));

var geohashdec = geohasherjs.encode_dec(49,49, 23);
console.log('geohash:      ' + geohashdec);
//console.log(geohashdec);
//console.warn('encode_dec: ' + geohashdec);

geohasherjs.decode_dec(geohashdec, function(err, lat, lon) {
    console.log("lat: " + lat + "long: " + lon);
});

var geohashstring = geohasherjs.encode(49,49,23);

console.log("geohash str: " + geohashstring);

geohasherjs.decode(geohashstring, function(err, lat, lon) {
    console.log("decoded: " + lat + " " + lon);
});

/*
console.warn(geohasherjs.encode_dec(49,49, 23));

console.warn(geohasherjs.encode_dec(0., 0., 23));

console.warn(geohasherjs.encode_dec(-90, -180., 23));

console.warn(geohasherjs.encode_dec(42.6, -5.6, 23));*/


//((49., 49.), (0., 0.), (-90, -180.), (42.6, -5.6))