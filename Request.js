(function(){
    
    Request = function() {

        /* Provide a Singelton Class */
        if ( !(this instanceof Request) )  return new Request();

        this.ajaxObjects = [];
        this.garbadeCollector = false;
        this.getInstanceOperation = false;


    };

    Request.prototype = {
        startGarbadeCollector: function() {
            this.garbadeCollector = window.setInterval( function( context ){
                return function(){
                    var i = 0,
                        length = context.ajaxObjects.length,
                        date = parseInt( ( (new Date())*1 ) - 1000, 10 );
                    
                    console.log('Request > garbadeCollector');
                    
                    /* run through the Array and delete all Entrys with a used Date older than currentTime - interval Time */
                    for( ; i<length; i++ ) {
                        if( context.ajaxObjects[i].used < date && context.ajaxObjects[i].state === 0 ) {
                            context.ajaxObjects[i].state = 3;
                            console.log('Request > Marked as removable', context.ajaxObjects[i]);
                        }

                        /*
                        if(context.ajaxObjects[i].used < parseInt(date-5000, 10)) {
                            console.log('Request > toSplice (old Entrys)', toSplice);
                            toSplice.push( i );
                        }
                        */
                    }
                    context.removeInstance();

                    /* stop the Garbade Collector */
                    if( context.ajaxObjects.length === 0 ) {
                        context.stopGarbadeCollector();
                    }
                };
            }( this ), 1000);
        },

        stopGarbadeCollector: function(){
            console.log('Request > Garbade Collector Stop');
            clearInterval( this.garbadeCollector );
            this.garbadeCollector = false;

            return true;

        },

        createInstance: function() {
            var newObject = {
                    'state' : 1,
                    'used'  : (new Date())*1,
                    'object': window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest()
                },
                entry = this.ajaxObjects.push( newObject );

            /* start the Garbade Collector if not allready running */
            if( !this.garbadeCollector ) {
                this.startGarbadeCollector();
            }

            return this.ajaxObjects[ parseInt(entry-1, 10)];
        },

        getInstance: function() {
            console.log( 'Request > getInstance' );
            console.log( this.getInstanceOperation );
            
            while( this.getInstanceOperation ) {
                console.log( 'Request > getInstance - busy...' );
            }

            this.getInstanceOperation = true;
            console.log( 'Request > getInstance - go' );

            var i       = 0,
                length  = this.ajaxObjects.length,
                obj     = false,
                _return;


            for ( ; i<length; i++ ) {
                if( this.ajaxObjects[i].state === 0 ) {
                    obj = this.ajaxObjects[i];
                    this.ajaxObjects[i].state = 1;
                    this.ajaxObjects[i].used = (new Date())*1;
                }
            }
            
            /* release the getInstance Method */
            this.getInstanceOperation = false;
            
            _return = ( obj ) ? obj : this.createInstance();
            
            return _return;
            
        },
        
        removeInstance: function() {
            console.log('Request > removeInstance');

            var i = 0,
                length = this.ajaxObjects.length;
            
            for( ; i<length; i++) {

                if( this.ajaxObjects[i] && this.ajaxObjects[i].state === 3 ) {
                    /* clean up the Memory */
                    //delete this.ajaxObjects[i];

                    /* remove the Index from the Array */
                    //this.ajaxObjects.splice(i);
                }
            }

        },

        ajax: function( method, options ) {
            var obj = this.getInstance(),
                ajax = obj.object,
                config = {
                    'async'       : true,
                    'url'         : false,
                    'data'        : {},
                    'cache'       : true,
                    'timeout'     : 10000,

                    /* Callbacks */
                    'error'       : false,
                    'success'     : false,
                    'stateChange' : false,
                };

            /* Override the default Config with personal Options */
            if(options !== undefined) {
                for (var i in options) {
                    if( !config.hasOwnProperty(i) ) { continue; }
                    if( i === 'error' && typeof options[i] !== 'function' ) { continue; }
                    if( i === 'success' && typeof options[i] !== 'function' ) { continue; }
                    if( i === 'stateChange' && typeof options[i] !== 'function' ) { continue; }

                    config[i] = options[i];
                }
            }

            if( !config.cache ) {
                config.url += ( ( config.url.match(/\?/g) ) ? '&' : '?' ) + '_t='+(new Date())*1;
            }

            /* Open the AJAX */
            ajax.open(method.toUpperCase(), config.url, config.async);

            /* Set the Timeout Option */
            if( config.async ) {
                ajax.timeout = config.timeout;
            }

            /* Bind some Actions on readyStateChanged */
            ajax.onreadystatechange = function( context ) {
                return function() {

                    if( config.stateChange ) {
                        config.stateChange.call( this, ajax.responseText );
                    }
                    
                    /* AJAX Call finished */
                    if( ajax.readyState === 4 ) {

                        /* Everything is ok */
                        if ( ajax.status === 200 && config.success ) {
                            config.success.call(this, ajax.responseText);
                        }
                        /* Error handling */
                        else {
                            if( config.error ) {
                                config.error.call( this, ajax );
                            }
                        }

                        /* reset the State for this Object to reuse it again */
                        obj.state = 0;
                    }
                };
            }( this );

            ajax.send(null);
        },

        /**
         * Alias for ajax with GET as Method
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        get: function( options ) {
            return this.ajax( 'GET', options );
        },

        /**
         * Alias for ajax with POST as Method
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        post: function( options ) {
            return this.ajax( 'POST', options );
        }

    };

})();
