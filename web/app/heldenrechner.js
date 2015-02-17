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
    var _item = null;
    
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
        var rename_button = $('<button>umbenennen</button>').button().on('click', function() {
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
    
    heldenrechner.add_item = function(uuid) {
        if (!(_mandant.inventory)) {
            _mandant.inventory = [];
            __.commit();
        }
        var item = { uuid: __.uuid() };
        item.name = $('#item_name');
        item.quality = $('#item_quality');
        item.type = $('#item_type');
        item.level = $('#item_level');
 
        item.attributes = [];
        
        var checked = 0;
        if ($(".item_attribute_1").prop('checked',true)) {
            var attribute=[];
            attribute.att_type = $( "#item_attribute_1_type" ).selectmenu();
            attribute.att_value = $( "#item_attribute_1_value" ).val();
            checked++;
            item.attributes.push(attribute);
        }
        if ($(".item_attribute_2").prop('checked',true)) {
            var attribute=[];
            attribute.att_type = $( "#item_attribute_2_type" ).selectmenu();
            attribute.att_value = $( "#item_attribute_2_value" ).val();
            item.attributes.push(attribute);
        }
        if ($(".item_attribute_3").prop('checked',true)) {
            var attribute=[];
            attribute.att_type = $( "#item_attribute_3_type" ).selectmenu();
            attribute.att_value = $( "#item_attribute_3_value" ).val();
            item.attributes.push(attribute);
        }
        
        _mandant.inventory.push(item);
        __.commit();

    };
    
    __.showInventory = function() {
        
    };
    
    __.submit_inventory_form = function() {
        window.console.info('Inventory Form submitted!');
    };
    
    __.new_item_dialog = function() {
        _item = {
            is_new: true,
            uuid: __.uuid()
        };
        $('#inventory-dialog').dialog({
            autoOpen: true,
            modal: true,
            title: 'Neuen Gegenstand anlegen',
            width: 'auto',
            buttons: {
    		OK: function() {
                    __.submit_inventory_form();
                    $(this).dialog('close');
    		},
    		Abbrechen: function() {
                    $(this).dialog('close');
    		}
            },
            open: function() {
                $('#inventory-dialog select').selectmenu();
                $('#inventory-dialog #item_level').spinner({
                    min: 0,
                    max: 20,
                    step: 1,
                    numberFormat: 'n'
                });
                $('#inventory-dialog div[data-class="buttonset"]').buttonset();
                $('#inventory-dialog input[name="item_name"]').css('width', '90%');
                $('#inventory-dialog input[data-type="percent"]').css({
                    width: '6em',
                    marginLeft: '1.5em',
                    marginRight: '0.75em',
                    textAlign: 'right'
                });
                $('#inventory-dialog input[data-inputmask]').inputmask();
            }
        });
    };
    
    __.prepare_forms = function() {
        $('input[type="text"]').addClass('ui-widget ui-widget-content ui-corner-all').css('padding', '0.333em');
        $('form#new_player_form').on('submit', function(event) {
            event.preventDefault();
            heldenrechner.add_mandant($('#new_player_name', this).val());
            return false;
        });
        $('form#new_player_form input[type="submit"]').button({icons: { primary: 'ui-icon-plusthick' }});
        $('#player-rename-dialog form').on('submit', function(event) {
            event.preventDefault();
            $(this).parent().parent().find('button')[1].click();
            return false;
        });
        $('#inventory-dialog form').on('submit', function(event) {
            event.preventDefault();
            $(this).parent().parent().find('button')[1].click();
            return false;
        });
        $('#inventory-add-item').button({icons: { primary: 'ui-icon-plusthick' }}).on('click', function() {
            __.new_item_dialog();
        });
        $('#inventory-dialog fieldset').css('vertical-align', 'top');
        $('#inventory-dialog select').css('width', '15em');
    };
    
    heldenrechner.backup = function() {
        var wdata = eval(JSON.stringify(window.localStorage['heldenrechner']));
        $('#backup-dialog form textarea').val(wdata).prop('readonly', true).select();
        $('#backup-dialog').dialog({
            modal: true,
            buttons: {},
            closeOnEscape: true,
            autoOpen: true,
            title: 'Datensicherung',
            resizable: false,
            width: 'auto'
        });
    };
    
    __.restore = function(data) {
        if ((null === data) || (data.length <= 0)) {
            return;
        }
        try {
            var data_object = JSON.parse(data);
            _mandant = null;
            _data = data_object;
            __.commit();
            __.load_mandanten();
            $('#restore-dialog').dialog('close');
            $('#main_tabs ul li a')[0].click();
            $('#main_tabs').tabs('option', 'disabled', [1, 2]);
        }
        catch (e) {
            $('#restore-dialog form textarea').val('Daten ungültig: ' + e).select();
        }
    };
    
    heldenrechner.restore = function() {
        $('#restore-dialog form textarea').val('');
        $('#restore-dialog').dialog({
            modal: true,
            buttons: {
                Wiederherstellen: function() {
                    __.restore($('#restore-dialog form textarea').val());
                },
                Abbrechen: function() {
                    $(this).dialog('close');                    
                }
            },
            closeOnEscape: true,
            autoOpen: true,
            title: 'Datenwiederherstellung',
            resizable: false,
            width: 'auto'
        });        
    };
    
    __.backup_restore = function() {
        $('#backup-button').button().on('click', function() {
            heldenrechner.backup();
        });
        $('#backup-dialog form').on('submit', function(event) {
            event.preventDefault();
            return false;
        });
        $('#restore-button').button().on('click', function() {
            heldenrechner.restore();
        });
        $('#restore-dialog form').on('submit', function(event) {
            event.preventDefault();
            $(this).parent().parent().find('button')[1].click();
            return false;
        });
    };
    
    __.reset_function = function() {
        $('#reset-button').button().on('click', function() {
            $('#reset-dialog').dialog({
                modal: true,
                buttons: {
                    Ja: function() {
                        __.restore('{}');
                        $(this).dialog('close');                    
                    },
                    Nein: function() {
                        $(this).dialog('close');                    
                    },
                    Abbrechen: function() {
                        $(this).dialog('close');                    
                    }
                },
                closeOnEscape: true,
                autoOpen: true,
                title: 'Datenwiederherstellung',
                resizable: false,
                width: 'auto'
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
            __.backup_restore();
            __.reset_function();
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