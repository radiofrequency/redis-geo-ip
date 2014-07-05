# rgeoip

rgeoip is a module that uses a redis database for geo ip lookups   
the redis database is loaded with data from geonames for geo decode and ip2location for ip lookup  
the redis db is generate via: https://github.com/doat/geodis

## Installation

	  $ npm install radiofrequency/redis-geo-ip --save

## Options
  
  - `client` An existing redis client object you normally get from `redis.createClient()`
  - `host` Redis server hostname
  - `port` Redis server portno
  - `ttl` Redis session TTL in seconds
  - `db` Database index to use
  - `pass` Password for Redis authentication
  - `url` String that contains connection information in a single url (redis://user:pass@host:port/db)
  - ...    Remaining options passed to the redis `createClient()` method.


##  Tests

    $ mocha  

## Usage

    var geoip = require('rgeoip')  
	 	geoip.lookup_ip('127.0.0.1', function(err, geodata) {
      console.log(geodata)
    })
    geoip.list_countries(function(err, countries) {
      console.log(countries)
    }

    geoip.list_states('United States', function(err, data){
      console.log(data)
    })

    geoip.geodecode(49,49,function(err,data) {
        console.log(data)
    })

    ...

