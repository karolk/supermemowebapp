/*
   Events management system
   dependencies: none
*/
(function (host) {

    var events = {},

        event_exists = function (event_name) {
            return !!events[event_name];
        },

        for_all_subscribers = function (event_name, fn) {
            if (event_exists(event_name)) {
                var objs = events[event_name];
                for (var i = 0, l = objs.length; i < l; i++) {
                    fn(objs[i], objs, i);
                }
            }
        },

        create_if_none = function (event_name, cfg) {

            event_exists(event_name) || (events[event_name] = []);
            cfg && cfg.sticky && (events[event_name].sticky = true);
            cfg && cfg.data && (events[event_name].data = cfg.data);

        },

        dispatch_event = function (event_name, cfg) {

            cfg && cfg.sticky && create_if_none(event_name, cfg);
            for_all_subscribers(event_name,
                function (subscriber) {
                    trigger(event_name, subscriber, (cfg && cfg.data));
                });

        },

        bind = function (event_name, fn) {

            create_if_none(event_name)
            events[event_name].push(fn);
            //if event is sticky it will be dispatch every time object subscribes to this
            events[event_name].sticky && trigger(event_name, fn, events[event_name].data);

        },

        trigger = function (event_name, fn, args) {
            var apply_args = [{ type: event_name }].concat(args);
            fn.apply(host, apply_args);
        },

        unbind = function (obj, event_name) {
            for_all_subscribers(event_name,
                function (subscriber, all_subscribers, index) {
                    if (subscriber === obj) {
                        all_subscribers.splice(index, 1);
                    }
                });
        };

    host.E = {

        publish: dispatch_event,
        unbind: unbind,
        bind: bind,

        //peek into events
        __events: function () {
            return events;
        }

    };

})(self);
