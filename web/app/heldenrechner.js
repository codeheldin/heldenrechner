'use strict';
/*
 * Der Heldenrechner.
 * 
 * Ein Tool von den Codehelden.
 */

(function(heldenrechner, $) {
    
    var __ = {};
    
    var _data = {};
    var _mandant = null;
    
    __.uuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    
    __.commit = function() {
        window.localStorage['heldenrechner'] = JSON.stringify(_data);
    };
    
    __.activate_mandant = function() {
        $('.selected_mandant').html(_mandant.name);
        $('#main_tabs').tabs('option', 'disabled', []);
        $('#main_tabs ul li a')[1].click();
    };
    
    heldenrechner.select_mandant = function(uuid) {
        var mandanten = _data.mandanten.length;
        for (var i = 0; i < mandanten; i++) {
            var m = _data.mandanten[i];
            if (m.uuid === uuid) {
                _mandant = m;
                __.activate_mandant();
                return;
            }
        }
        $('#main_tabs ul li a')[0].click();
        $('#main_tabs').tabs('option', 'disabled', [1, 2]);
    };
    
    heldenrechner.add_mandant = function(name) {
        if ((null === name) || (name.length <= 0)) {
            $('form#new_player_form input[type="text"]').attr('placeholder', 'Bitte Spielernamen eingeben!');
            return;
        }
        var p_name = name.trim();
        if (p_name.length <= 0) {
            $('form#new_player_form input[type="text"]').attr('placeholder', 'Bitte Spielernamen eingeben!').val('');
            return;            
        }
        // Gibt es den Mandanten schon?
        var mandant_exists = false;
        var mandanten = _data.mandanten.length;
        if (mandanten > 0) {
            for (var i = 0; i < mandanten; i++) {
                var m = _data.mandanten[i];
                if (m.name === p_name) {
                    mandant_exists = true;
                    break;
                }
            }
        }
        if (mandant_exists) {
            $('form#new_player_form input[type="text"]').attr('placeholder', 'Spieler exisitiert bereits!').val('');
            return;            
        }
        var uuid = __.uuid();
        _data.mandanten.push({ uuid: uuid, name: p_name });
        __.commit();
        __.load_mandanten();
        $('form#new_player_form input[type="text"]').attr('placeholder', 'Spieler hinzugefügt.').val('');
    };
    
    __.delete_mandant = function(uuid) {
        if ((_mandant !== null) && (_mandant.uuid === uuid)) {
            _mandant = null;
            $('#main_tabs ul li a')[0].click();
            $('#main_tabs').tabs('option', 'disabled', [1, 2]);    
        }
        var mandanten = _data.mandanten.length;
        var mandanten_list = [];
        for (var i = 0; i < mandanten; i++) {
            var m = _data.mandanten[i];
            if (m.uuid !== uuid) {
                mandanten_list.push(m);
            }
        }
        _data.mandanten = mandanten_list;
        __.commit();
        __.load_mandanten();
    };
    
    heldenrechner.delete_mandant = function(uuid) {
        var player = null;
        var mandanten = _data.mandanten.length;
        for (var i = 0; i < mandanten; i++) {
            var m = _data.mandanten[i];
            if (m.uuid === uuid) {
                player = m.name;
                break;
            }
        }
        if (null === player) {
            return;
        }
        $("#confirm-dialog").dialog({
            autoOpen: true,
            modal: true,
            title: 'Spieler wirklich löschen?',
            buttons: {
    		OK: function() {
                    __.delete_mandant(uuid);
                    $(this).dialog('close');
    		},
    		Abbrechen: function() {
                    $(this).dialog('close');
    		}
            }
        }).html('Soll der Spieler <b>' + player + '</b> wirklich gelöscht werden?<br /><br />Alle seine Einstellungen und Inventories gehen verloren!');
    };
    
    __.rename_mandant = function(player, new_name) {
        if ((new_name === null) || (new_name.length <= 0)) {
            return;
        }
        var f_name = new_name.trim();
        if (f_name.length <= 0) {
            return;
        }
        player.name = f_name;
        __.commit();
        __.load_mandanten();
        if ((_mandant !== null) && (player.uuid === _mandant.uuid)) {
            $('.selected_mandant').html(_mandant.name);            
        }
    };
    
    heldenrechner.rename_mandant = function(uuid) {
        var player = null;
        var mandanten = _data.mandanten.length;
        for (var i = 0; i < mandanten; i++) {
            var m = _data.mandanten[i];
            if (m.uuid === uuid) {
                player = m;
                break;
            }
        }
        if (null === player) {
            return;
        }
        var old_name = player.name;
        $('#player-rename-dialog input[type="text"]').val(old_name);
        $('#player-rename-dialog input[type="text"]').select();
        $("#player-rename-dialog").dialog({
            autoOpen: true,
            modal: true,
            title: 'Spieler umbenennen',
            buttons: {
    		OK: function() {
                    __.rename_mandant(player, $('#player-rename-dialog input[type="text"]').val());
                    $(this).dialog('close');
    		},
    		Abbrechen: function() {
                    $(this).dialog('close');
    		}
            }
        });
    };
    
    __.generate_mandant_actions = function(uuid) {
        var action_td = $('<td></td>');
        var select_button = $('<button>auswählen</button>').button().on('click', function() {
            heldenrechner.select_mandant(uuid);
        });
        var rename_button = $('<button>umbennenen</button>').button().on('click', function() {
            heldenrechner.rename_mandant(uuid);
        });
        var delete_button = $('<button>löschen</button>').button().on('click', function() {
            heldenrechner.delete_mandant(uuid);
        });
        $(action_td).append(select_button);
        $(action_td).append(rename_button);
        $(action_td).append(delete_button);
        return action_td;
    };
    
    __.load_mandanten = function() {
        if (!(_data.mandanten)) {
            _data.mandanten = [];
            __.commit();
        }
        var tbody = $('div#tab_mandanten table tbody');
        $(tbody).html('');
        var mandanten = _data.mandanten.length;
        if (mandanten > 0) {
            for (var i = 0; i < mandanten; i++) {
                var m = _data.mandanten[i];
                var tr = $('<tr></tr>');
                var uuid = m.uuid;
                var name_td = $('<td></td>');
                $(name_td).html(m.name);
                $(tr).append(name_td);
                $(tr).append(__.generate_mandant_actions(uuid));
                $(tbody).append(tr);
            }
        }
    };
    
    __.prepare_forms = function() {
        $('form#new_player_form').on('submit', function(event) {
            event.preventDefault();
            heldenrechner.add_mandant($('#new_player_name', this).val());
            return false;
        });
        $('form#new_player_form input[type="submit"]').button();
        $('#player-rename-dialog form').on('submit', function(event) {
            event.preventDefault();
            $(this).parent().parent().find('button')[1].click();
            return false;
        });
    };
    
    __.show_local_storage = function() {
        $('a[href="#show-local-storage"]').on('click', function() {
            var pre = $('<pre></pre>');
            var str = JSON.stringify(window.localStorage['heldenrechner'], null, '\t');
            $(pre).html(str);
            $('#show-local-storage').html('');
            $('#show-local-storage').append(pre);
            $('#show-local-storage').dialog({
                modal: true,
                buttons: {},
                closeOnEscape: true,
                autoOpen: true,
                title: 'Inhalt des lokalen Speichers'
            });
        });
    };
    
    __.loader = function() {
        $('#script_loader').dialog({
            modal: true,
            buttons: {},
            closeOnEscape: false,
            autoOpen: true,
            title: 'Anwendung wird geladen'
        }).html('Bitte warten, die Anwendung wird geladen...');
        $('#script_loader').parent().find('button').css('display', 'none');
        $('#main_tabs').css('display', 'block');
        $('#main_tabs').tabs({
            active: 0,
            disabled: [1, 2]
        });
        if (typeof(Storage) !== 'undefined') {
            if (window.localStorage['heldenrechner']) {
                _data = $.extend({}, JSON.parse(window.localStorage['heldenrechner']));
            }
            else {
                __.commit();
            }
            __.show_local_storage();
            __.prepare_forms();
            __.load_mandanten();
            $('#script_loader').dialog('close');
        }
        else {
            $('#script_loader').html('Ihr Browser stinkt. Sorry.');
        }
    };
    
    __.__init__ = function() {
        $('#script_loader').css('display', 'none');
        __.loader();
    };
    
    $(document).ready(function() {
        __.__init__();
    });
    
})(window.heldenrechner = window.heldenrechner || {}, jQuery);