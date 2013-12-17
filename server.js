"use strict";

var express = require( "express" ),
    socket = require( 'socket.io' ),
    fs = require( 'fs' ),
    app = express(),
    port = 8082,
    words = [],
    sessions = {}
    ;

// read words
fs.readFile( 'words.txt', 'utf8', function ( err, data ) {
    if ( err ) {
        return console.log( err );
    }

    words = data.split( "\n" );
} );

// APP

app.use( express.static( __dirname + '/public' ) );

// /APP

// SOCKETS

var io = socket.listen( app.listen( port ) );
console.log( "Listening on port '%s'", port );

io.sockets.on( "connection", function ( socket ) {
    socket.on( "init", function ( options ) {
        options = options || {};
        console.log( "Init", options );
        initSession( options, socket );
    } );
} );

// /SOCKETS

// FUNCTIONS

function initSession( options, socket ) {
    console.log( "InitSession", options );
    var id = options.id;
    if ( sessions[id] ) {
        console.log( "Session already created", options );
    }
    else {
        id = createSession( options );
    }

    socket.emit( 'join', sessions[id].options );
}

function createSession( options ) {
    console.log( "CreateSession", options );
    var id = options.id,
        url = options.url;

    if ( !id || id === '' ) {
        id = createRandomWord();
        console.log( "CreatedRandomWord", id );
    }
    console.log( "CreateSession: id", id );

    sessions[id] = { options: { id: id, url: url } };

    sessions[id].socket = io
        .of( '/' + id )
        .on( 'connection', function ( sessionSocket ) {
            console.log( "Connection session", sessions[id].options );
            sessionSocket.emit( 'change', sessions[id].options );

            sessionSocket.on( 'change', function ( options ) {
                sessions[id].options.url = options.url || sessions[id].options.url;
                sessionSocket.broadcast.emit( 'change', options );
                console.log( "Change session emit", sessions[id].options, options );
            } );

            sessionSocket.on( 'disconnect', function () {
                console.log( "Disconnect session", sessions[id].options );
            } );
        } );

    return id;
}

function createRandomWord() {
    var _createRandomWord = function () {
            return words[Math.floor( Math.random() * words.length )].toLocaleLowerCase();
        },
        word = _createRandomWord()
        ;

    for ( var id in sessions ) {
        if ( word !== id ) {
            return word;
        }
        word = _createRandomWord();
    }
    return _createRandomWord();
}

// /FUNCTIONS