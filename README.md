# rgeoip

<<<<<<< HEAD
rgeoip is a module that uses a redis database for geo ip lookups  
the redis database is loaded with data from geonames for geo decode and ip2location for ip lookup

## Installation

	  $ npm install https://github.com/muzooka/rgeoip
=======
rgeoip is a module that uses a redis database for geo ip lookups   
the redis database is loaded with data from geonames for geo decode and ip2location for ip lookup  
the redis db is generate via: https://github.com/doat/geodis

## Installation

	  $ npm install radiofrequency/redis-geo-ip --save
>>>>>>> 43f03026853aaf843cfb4ec5065faf4dbec02380

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

<<<<<<< HEAD
    var geoip = require('rgeoip')({host:'localhost', port:6379})
  
	 	geoip.lookup_ip('127.0.0.1', function(err, geodata) {
      console.log(geodata)
    })
    
    geoip.autocomplete('127.0.0.1', 'Calgar', function(err, data) {  
       console.log(data);
    }

=======
    var geoip = require('rgeoip')  
	 	geoip.lookup_ip('127.0.0.1', function(err, geodata) {
      console.log(geodata)
    })
>>>>>>> 43f03026853aaf843cfb4ec5065faf4dbec02380
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

