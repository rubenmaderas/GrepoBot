// ==UserScript==
// @name         ModernBot
// @version      1.0.10
// @description  A modern grepolis bot
// @match        http://*.grepolis.com/game/*
// @match        https://*.grepolis.com/game/*
// @updateURL    https://github.com/Sau1707/ModernBot/blob/main/dist/merged.user.js
// @downloadURL  https://github.com/Sau1707/ModernBot/blob/main/dist/merged.user.js
// @icon         https://raw.githubusercontent.com/Sau1707/ModernBot/main/img/gear.png
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// ==/UserScript==

(function () {
    'use strict';
    var uw;
    if (typeof unsafeWindow == 'undefined') {
        uw = window;
    } else {
        uw = unsafeWindow;
    }

    // Dynamically add CSS
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = `.modern_bot_settings {
    z-index: 10;
    position: absolute;
    top: 52px !important;
    right: 116px !important;
}

.modern_active {
    position: relative;
    background-blend-mode: multiply;
    /* Or another blend mode that achieves your effect */
    background-color: rgba(0, 0, 0, 0.5);
    /* Adjust color for blending */
}


.modern_title_description {
    position: absolute;
    right: 10px;
    top: 4px;
    font-size: 10px
}

.game_border .game_header.active {
    filter: brightness(100%) saturate(186%) hue-rotate(241deg);
}

@keyframes rotateForever {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.rotate-forever {
    animation: rotateForever 5s linear infinite;
    transform-origin: 16px 15px;
    filter: hue-rotate(72deg) saturate(2.5);
}`;
    document.head.appendChild(style);


// File: utils.js
class ModernUtils {

    saveSettings(id, settings) {
        localStorage.setItem(`modern_settings_${id}`, JSON.stringify(settings));
    }

    loadSettings(id, defaultSettings) {
        const settings = localStorage.getItem(`modern_settings_${id}`);
        if (!settings) return defaultSettings;
        return JSON.parse(settings);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getTitleElement(text, desc = '(click to toggle)') {
        const $container = $('<div>').addClass('game_border').css({ cursor: 'pointer' })

        // Append each border element
        $container.append($('<div>').addClass('game_border_top'));
        $container.append($('<div>').addClass('game_border_bottom'));
        $container.append($('<div>').addClass('game_border_left'));
        $container.append($('<div>').addClass('game_border_right'));
        $container.append($('<div>').addClass('game_border_corner corner1'));
        $container.append($('<div>').addClass('game_border_corner corner2'));
        $container.append($('<div>').addClass('game_border_corner corner3'));
        $container.append($('<div>').addClass('game_border_corner corner4'));

        const $text = $('<div>').addClass('game_header bold').text(text);
        $container.append($text);

        const $desc = $('<div>').addClass("modern_title_description").text(desc);
        $text.append($desc);

        // Return the container jQuery element
        return { $container: $container, $title: $text };
    }

    getButtonElement(text) {
        const $button = $('<div>', {
            'class': 'button_new',
        });

        // Add the left and right divs to the button
        $button.append($('<div>', { 'class': 'left' }));
        $button.append($('<div>', { 'class': 'right' }));
        $button.append($('<div>', {
            'class': 'caption js-caption',
            'html': `${text} <div class="effect js-effect"></div>`
        }));

        return $button;
    }

}



// File: window.js
class createGrepoWindow {
    constructor({ id, title, size, tabs, start_tab, minimizable = true }) {
        this.minimizable = minimizable;
        this.width = size[0];
        this.height = size[1];
        this.title = title;
        this.id = id;
        this.tabs = tabs;
        this.start_tab = start_tab;

        /* Private methods */
        const createWindowType = (name, title, width, height, minimizable) => {
            function WndHandler(wndhandle) {
                this.wnd = wndhandle;
            }
            Function.prototype.inherits.call(WndHandler, uw.WndHandlerDefault);
            WndHandler.prototype.getDefaultWindowOptions = function () {
                return {
                    position: ['center', 'center', 100, 100],
                    width: width,
                    height: height,
                    minimizable: minimizable,
                    title: title,
                };
            };
            uw.GPWindowMgr.addWndType(name, `${name}_75624`, WndHandler, 1);
        };

        const getTabById = (id) => {
            return this.tabs.filter((tab) => tab.id === id)[0];
        };

        this.activate = function () {
            createWindowType(this.id, this.title, this.width, this.height, this.minimizable); //
            uw.$(
                `<style id="${this.id}_custom_window_style">
                 #${this.id} .tab_icon { left: 23px;}
                 #${this.id} {top: -36px; right: 95px;}
                 #${this.id} .submenu_link {color: #000;}
                 #${this.id} .submenu_link:hover {text-decoration: none;}
                 #${this.id} li { float:left; min-width: 60px; }
                 </style>
                `,
            ).appendTo('head');
        };

        this.deactivate = function () {
            if (uw.Layout.wnd.getOpenFirst(uw.GPWindowMgr[`TYPE_${this.id}`])) {
                uw.Layout.wnd.getOpenFirst(uw.GPWindowMgr[`TYPE_${this.id}`]).close();
            }
            uw.$(`#${this.id}_custom_window_style`).remove();
        };

        /* open the window */
        this.openWindow = function () {
            let wn = uw.Layout.wnd.getOpenFirst(uw.GPWindowMgr[`TYPE_${this.id}`]);

            /* if open is called but window it's alreay open minimized, maximize that */
            if (wn) {
                if (wn.isMinimized()) {
                    wn.maximizeWindow();
                }
                return;
            }

            let content = `<ul id="${this.id}" class="menu_inner"></ul><div id="${this.id}_content"> </div>`;
            uw.Layout.wnd.Create(uw.GPWindowMgr[`TYPE_${this.id}`]).setContent(content);
            /* Add and reder tabs */
            console.log(this.tabs);
            this.tabs.forEach((e) => {
                let html = `
                    <li><a id="${e.id}" class="submenu_link" href="#"><span class="left"><span class="right"><span class="middle">
                    <span class="tab_label"> ${e.title} </span>
                    </span></span></span></a></li>
                `;
                uw.$(html).appendTo(`#${this.id}`);
            });

            /* Add events to tabs */
            let tabs = '';
            this.tabs.forEach((e) => {
                tabs += `#${this.id} #${e.id}, `;
            });
            tabs = tabs.slice(0, -2);
            let self = this;
            uw.$(tabs).click(function () {
                self.renderTab(this.id);
            });
            /* render default tab*/
            this.renderTab(this.tabs[this.start_tab].id);
        };

        this.closeWindow = function () {
            uw.Layout.wnd.getOpenFirst(uw.GPWindowMgr[`TYPE_${this.id}`]).close();
        };

        /* Handle active tab */
        this.renderTab = function (id) {
            let tab = getTabById(id);
            uw.$(`#${this.id}_content`).html(getTabById(id).render());
            uw.$(`#${this.id} .active`).removeClass('active');
            uw.$(`#${id}`).addClass('active');
            getTabById(id).afterRender ? getTabById(id).afterRender() : '';
        };
    }
}


// Module: autoBootcamp.js
class AutoBootcamp extends ModernUtils {

}

// Module: autoBuild.js
class AutoBuild extends ModernUtils {
    constructor() {
        super();
        
        // CHIVATO DE CONSOLA PARA COMPROBAR CACHÉ
        console.log("%c🛠️ ModernBot: Cargando AutoBuild (VERSIÓN CON BOTÓN RESET)", "color: #ffcc00; font-size: 14px; font-weight: bold; background: #23160a; padding: 5px; border: 1px solid #ffcc00; border-radius: 4px;");

        this.towns_buildings = this.loadSettings('buildings', {});
        this.shiftHeld = false;
        this.lastBuildAttempt = {}; 

        if (uw.window) {
            if (!uw.window.modernBot) uw.window.modernBot = {};
            uw.window.modernBot.autoBuild = this;
        }

        try {
            uw.$.Observer(uw.GameEvents.window.open).subscribe("modernSenate", this.updateSenate);
        } catch (e) {
            console.error("Error subscribing to window open event:", e);
        }

        // Loop visual que actualiza la interfaz cada segundo sin recargar
        setInterval(this.refreshUI, 1000);
    }

    // Función silenciosa para mantener la interfaz actualizada en tiempo real
    refreshUI = () => {
        try {
            let town = uw.ITowns.getCurrentTown();
            if (!town) return;
            let town_id = town.id.toString();

            if (uw.$(`#build_settings_${town_id}`).length === 0) return;

            let town_buildings = this.towns_buildings[town_id];
            let buildings = { ...town.buildings().attributes };

            if (town.buildingOrders && town.buildingOrders().models) {
                for (let order of town.buildingOrders().models) {
                    if (!order.attributes.tear_down) {
                        buildings[order.attributes.building_type] += 1;
                    }
                }
            }

            const buildingKeys = ['main', 'storage', 'farm', 'academy', 'temple', 'barracks', 'docks', 'market', 'hide', 'lumber', 'stoner', 'ironer', 'wall'];

            for (let key of buildingKeys) {
                let targetLvl = (town_buildings && town_buildings[key] !== undefined) ? town_buildings[key] : buildings[key];
                let actual_lvl = buildings[key];

                let color = 'lime';
                if (actual_lvl > targetLvl) color = 'red';
                else if (actual_lvl < targetLvl) color = 'orange';

                uw.$(`#build_settings_${town_id} #build_lvl_${key}`).css('color', color).text(targetLvl);
            }

            let isAutoBuildOn = !!this.towns_buildings[town_id];
            let $title = uw.$('#auto_build_title');
            if (isAutoBuildOn && $title.css('filter') === 'none') {
                $title.css('filter', 'brightness(100%) saturate(186%) hue-rotate(241deg)');
            } else if (!isAutoBuildOn && $title.css('filter') !== 'none') {
                $title.css('filter', '');
            }
        } catch (e) {
            // Ignoramos errores menores para que no rompa el loop
        }
    };

    // NUEVO: Función para resetear todos los objetivos al nivel actual + cola
    resetLevels = (town_id) => {
        if (!town_id) return;
        const town = uw.ITowns.getTown(town_id);
        if (!town) return;

        if (!this.towns_buildings[town_id]) {
            this.towns_buildings[town_id] = {};
        }

        let buildings = { ...town.buildings().attributes };

        if (town.buildingOrders && town.buildingOrders().models) {
            for (let order of town.buildingOrders().models) {
                if (!order.attributes.tear_down) {
                    buildings[order.attributes.building_type] += 1;
                }
            }
        }

        const buildingKeys = ['main', 'storage', 'farm', 'academy', 'temple', 'barracks', 'docks', 'market', 'hide', 'lumber', 'stoner', 'ironer', 'wall'];
        
        buildingKeys.forEach(key => {
            this.towns_buildings[town_id][key] = buildings[key];
        });

        this.saveSettings('buildings', this.towns_buildings);
        
        // Forzamos un refresco inmediato de la interfaz
        this.refreshUI();
        console.log(`[AutoBuild] ${town.getName()}: Niveles reseteados al estado actual.`);
    };

    render() {
        const $container = uw.$('<div></div>');
        
        uw.$(document).on('mousedown.autobuild', e => {
            this.shiftHeld = e.shiftKey;
        });

        $container.html(this.settings());
        return $container;
    }

    settings = () => {
        let town_id = 0;
        let town = null;
        try {
            town = uw.ITowns.getCurrentTown();
            if (town) town_id = town.id;
        } catch (e) {}

        let htmlContent = `
        <div class="game_border" style="margin-bottom: 20px">
            <div class="game_border_top"></div>
            <div class="game_border_bottom"></div>
            <div class="game_border_left"></div>
            <div class="game_border_right"></div>
            <div class="game_border_corner corner1"></div>
            <div class="game_border_corner corner2"></div>
            <div class="game_border_corner corner3"></div>
            <div class="game_border_corner corner4"></div>
            
            <div id="auto_build_title" style="cursor: pointer; filter: ${town_id && this.towns_buildings[town_id] ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : 'none'}" class="game_header bold" onclick="window.modernBot.autoBuild.toggle()"> Auto Build 
                <div style="position: absolute; right: 10px; top: 2px; font-size: 10px; display: flex; align-items: center; gap: 10px;"> 
                    <div onclick="event.stopPropagation(); window.modernBot.autoBuild.resetLevels(${town_id});" style="background: #5b391e; border: 1px solid #1a1107; padding: 2px 6px; border-radius: 3px; color: #ffcc00; box-shadow: 0 0 2px #000;" title="Igualar objetivos a la ciudad actual + cola">🔄 Resetear</div>
                    <div>(clic para activar/desactivar)</div>
                </div>
            </div>

            <div id="buildings_lvl_buttons" style="padding: 10px; background: #23160a; min-height: 50px;">`;

        if (town) {
            let town_buildings = this.towns_buildings?.[town_id] ?? { ...town.buildings()?.attributes } ?? {};
            let buildings = { ...town.buildings().attributes };

            if (town.buildingOrders && town.buildingOrders().models) {
                for (let order of town.buildingOrders().models) {
                    if (!order.attributes.tear_down) {
                        buildings[order.attributes.building_type] += 1;
                    }
                }
            }

            const buildingImages = {
                main: 'Senado_50x50.png',
                storage: 'Almacén_50x50.png',
                farm: 'Granja_50x50.png',
                academy: 'Academia_50x50.png',
                temple: 'Templo_50x50.png',
                barracks: 'Cuartel_50x50.png',
                docks: 'Puerto_50x50.png',
                market: 'Mercado_50x50.png',
                hide: 'Cueva_50x50.png',
                lumber: 'Aserradero_50x50.png',
                stoner: 'Cantera_50x50.png',
                ironer: 'Mina_plata_50x50.png',
                wall: 'Muralla_50x50.png'
            };

            const buildingFullNames = {
                main: 'Senado',
                storage: 'Almacén',
                farm: 'Granja',
                academy: 'Academia',
                temple: 'Templo',
                barracks: 'Cuartel',
                docks: 'Puerto',
                market: 'Mercado',
                hide: 'Cueva',
                lumber: 'Aserradero',
                stoner: 'Cantera',
                ironer: 'Mina de plata',
                wall: 'Muralla'
            };

            const getBuildingHtml = (buildingKey, fullName) => {
                let color = 'lime';
                let targetLvl = town_buildings[buildingKey] !== undefined ? town_buildings[buildingKey] : buildings[buildingKey];
                
                if (buildings[buildingKey] > targetLvl) color = 'red';
                else if (buildings[buildingKey] < targetLvl) color = 'orange';

                const githubRawUrl = 'https://raw.githubusercontent.com/rubenmaderas/GrepoBot/main/img/';
                let imgFileName = buildingImages[buildingKey] || 'Senado_50x50.png';
                let imgSrc = githubRawUrl + encodeURIComponent(imgFileName);

                return `
                <div class="auto_build_box" onclick="window.modernBot?.autoBuild?.editBuildingLevel(${town_id}, '${buildingKey}', 0)" title="${fullName}" style="cursor: pointer; display: inline-block; margin: 3px; text-align: center; vertical-align: top;">
                    <div style="width: 36px; height: 34px; position: relative; margin: 0 auto; background: #1a1107; border: 1px solid #7c6142; border-radius: 2px; display: flex; align-items: center; justify-content: center;">
                        <img src="${imgSrc}" style="width: 28px; height: 28px; object-fit: contain;" alt="${fullName}" />
                        <div onclick="event.stopPropagation(); window.modernBot?.autoBuild?.editBuildingLevel(${town_id}, '${buildingKey}', 1)" style="position:absolute; top:-6px; right:-10px; cursor:pointer; color:lime; font-size:11px; font-weight:bold; z-index:2;" title="Subir nivel">▲</div>
                        <div onclick="event.stopPropagation(); window.modernBot?.autoBuild?.editBuildingLevel(${town_id}, '${buildingKey}', -1)" style="position:absolute; bottom:-6px; right:-10px; cursor:pointer; color:red; font-size:11px; font-weight:bold; z-index:2;" title="Bajar nivel">▼</div>
                    </div>
                    <p style="color: ${color}; font-size: 11px; margin: 4px 0 0 0; font-weight: bold;" id="build_lvl_${buildingKey}">${targetLvl}</p>
                </div>`;
            };

            const groups = `(${Object.values(uw.ITowns.getTownGroups())
                .filter(group => group.id > 0 && group.id !== -1 && group.towns && group.towns[town_id])
                .map(group => group.name)
                .join(', ')})` || '';

            htmlContent += `
            <div id="build_settings_${town_id}">
                <div style="width: 600px; margin-bottom: 5px; display: inline-flex; color: #fff;">
                    <a class="gp_town_link" href="${town.getLinkFragment()}">${town.getName()}</a> 
                    <p style="font-weight: bold; margin: 0px 5px"> [${town.getPoints()} pts] </p>
                    <p style="font-weight: bold; margin: 0px 5px"> ${groups} </p>
                </div>
                <div style="width: 100%; display: inline-flex; gap: 6px; flex-wrap: wrap;">`;

            for (let key of Object.keys(buildingFullNames)) {
                htmlContent += getBuildingHtml(key, buildingFullNames[key]);
            }

            htmlContent += `</div></div>`;
        } else {
            htmlContent += `<p style="color: #fff;">Selecciona una ciudad</p>`;
        }

        htmlContent += `</div></div>`;
        return htmlContent;
    };

    updateSenate = (event, handler) => {
        if (!handler || handler.context !== "building_senate") return;
        handler.wnd.setWidth(850);
        const id = `gpwnd_${handler.wnd.getID()}`;

        const updateView = () => {
            const interval = setInterval(() => {
                const $window = uw.$('#' + id);
                const $mainTasks = $window.find('#main_tasks');
                if (!$mainTasks.length) return;

                $mainTasks.hide();
                let $newElement = uw.$('<div></div>').html(this.settings());

                $newElement.css({
                    position: $mainTasks.css('position'),
                    left: parseInt($mainTasks.css('left') || 0) - 20,
                    top: $mainTasks.css('top'),
                });
                $mainTasks.after($newElement);

                const $techTree = $window.find('#techtree');
                $techTree.css({ position: 'relative', left: "40px" });
                $window.css({ overflowY: 'visible' });

                clearInterval(interval);
            }, 10);

            setTimeout(() => { clearInterval(interval); }, 100);
        };

        const oldSetContent = handler.wnd.setContent2;
        handler.wnd.setContent2 = (...params) => {
            updateView();
            if (oldSetContent) oldSetContent.bind(handler.wnd)(...params);
        };
    };

    editBuildingLevel = (town_id, name, d) => {
        const town = uw.ITowns.getTown(town_id);
        const { max_level, min_level } = uw.GameData.buildings[name];

        if (!this.towns_buildings[town_id]) {
            this.towns_buildings[town_id] = { ...town.buildings().attributes };
        }

        let town_buildings = this.towns_buildings[town_id];
        const current_target_lvl = parseInt(uw.$(`#build_settings_${town_id} #build_lvl_${name}`).text()) || 0;

        let actual_lvl = town.buildings().attributes[name];
        if (town.buildingOrders && town.buildingOrders().models) {
            for (let order of town.buildingOrders().models) {
                if (!order.attributes.tear_down && order.attributes.building_type === name) {
                    actual_lvl += 1;
                }
            }
        }
        
        if (d !== 0) {
            let delta = this.shiftHeld ? d * 10 : d;
            town_buildings[name] = Math.min(Math.max(current_target_lvl + delta, min_level), max_level);
        } else {
            town_buildings[name] = actual_lvl; 
        }

        let color = 'lime';
        if (actual_lvl > town_buildings[name]) color = 'red';
        else if (actual_lvl < town_buildings[name]) color = 'orange';

        uw.$(`#build_settings_${town_id} #build_lvl_${name}`).css('color', color).text(town_buildings[name]);

        this.saveSettings('buildings', this.towns_buildings);
    };

    toggle = () => {
        let town = uw.ITowns.getCurrentTown();
        if (!town) return;

        let town_id = town.id.toString();

        if (!(town_id in this.towns_buildings)) {
            this.towns_buildings[town_id] = {};
            
            let buildingsList = ['main', 'storage', 'farm', 'academy', 'temple', 'barracks', 'docks', 'market', 'hide', 'lumber', 'stoner', 'ironer', 'wall'];
            buildingsList.forEach(e => {
                let lvl = parseInt(uw.$(`#build_settings_${town_id} #build_lvl_${e}`).text()) || town.buildings().attributes[e];
                this.towns_buildings[town_id][e] = lvl;
            });
            this.saveSettings('buildings', this.towns_buildings);
            
            uw.$('#auto_build_title').css('filter', 'brightness(100%) saturate(186%) hue-rotate(241deg)');
        } else {
            delete this.towns_buildings[town_id];
            this.saveSettings('buildings', this.towns_buildings);
            
            uw.$('#auto_build_title').css('filter', 'none');
        }
    };

    async execute() {
        if (Object.keys(this.towns_buildings).length === 0) return false;

        for (let town_id of Object.keys(this.towns_buildings)) {
            if (!uw.ITowns.towns[town_id]) {
                delete this.towns_buildings[town_id];
                this.saveSettings('buildings', this.towns_buildings);
                continue;
            }

            if (this.isFullQueue(town_id)) continue;

            if (this.isDone(town_id)) {
                delete this.towns_buildings[town_id];
                this.saveSettings('buildings', this.towns_buildings);
                
                if (uw.ITowns.getCurrentTown().id == town_id) {
                    uw.$('#auto_build_title').css('filter', 'none');
                }
                continue;
            }
            
            let worked = await this.getNextBuild(town_id);
            if (worked) return true;
        }
        return false;
    }

    isFullQueue = town_id => {
        const town = uw.ITowns.getTown(town_id);
        if (!town) return true;
        const ordersLength = town.buildingOrders ? town.buildingOrders().length : 0;
        if (uw.GameDataPremium.isAdvisorActivated('curator') && ordersLength >= 7) return true;
        if (!uw.GameDataPremium.isAdvisorActivated('curator') && ordersLength >= 2) return true;
        return false;
    };

    isDone = town_id => {
        const town = uw.ITowns.getTown(town_id);
        if (!town) return true;
        
        let buildings = { ...town.getBuildings().attributes };
        
        if (town.buildingOrders && town.buildingOrders().models) {
            for (let order of town.buildingOrders().models) {
                if (!order.attributes.tear_down) {
                    buildings[order.attributes.building_type] += 1;
                }
            }
        }

        for (let build of Object.keys(this.towns_buildings[town_id])) {
            if (this.towns_buildings[town_id][build] > buildings[build]) {
                return false;
            }
        }
        return true;
    };

    getNextBuild = async town_id => {
        let town = uw.ITowns.towns[town_id];
        if (!town) return false;

        let buildings = { ...town.getBuildings().attributes };

        if (town.buildingOrders && town.buildingOrders().models) {
            for (let order of town.buildingOrders().models) {
                if (!order.attributes.tear_down) {
                    buildings[order.attributes.building_type] += 1;
                }
            }
        }
        
        let target = this.towns_buildings[town_id];
        const priorityList = ['main', 'storage', 'farm', 'academy', 'lumber', 'stoner', 'ironer', 'temple', 'barracks', 'docks', 'market', 'hide', 'wall'];

        for (let build of priorityList) {
            if (target[build] !== undefined && buildings[build] < target[build]) {
                let success = await this.postBuild(build, town_id);
                if (success) return true;
            }
        }
        
        return false;
    };

    postBuild = async (type, town_id) => {
        const town = uw.ITowns.getTown(town_id);
        if (!town) return false;

        const now = Date.now();
        if (this.lastBuildAttempt[town_id] && now - this.lastBuildAttempt[town_id] < 3000) {
            return false;
        }

        this.lastBuildAttempt[town_id] = now;

        let data = {
            model_url: 'BuildingOrder',
            action_name: 'buildUp',
            arguments: { 
                building_id: type,
                time_option: 0 
            },
            town_id: town_id,
        };

        try {
            uw.gpAjax.ajaxPost('frontend_bridge', 'execute', data);
            await this.sleep(1500);
            return true;
        } catch (e) {
            console.error(`[AutoBuild] Fallo al mandar orden:`, e);
            return false;
        }
    };
}


// Module: autoFarm.js
class AutoFarm extends ModernUtils {
    constructor() {
        super();

        // LOG MAESTRO DE VERSIÓN DEL PROYECTO
        const VERSION = "v2.5.0"; // Cambia este número con cada actualización importante
        console.log(`%c🚀 ModernBot ${VERSION} cargado y listo para conquistar Grepolis!`, "color: #ffffff; font-size: 16px; font-weight: bold; background: linear-gradient(90deg, #4a90e2, #003366); padding: 10px 20px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid #7eb8f5;");

        this.active = this.loadSettings('farm_active', false);
        this.duration = this.loadSettings('farm_duration', 1);
        this.last_farm_time = 0; 
        this.is_farming = false; // Candado de seguridad
    }

    render() {
        const { $container, $title } = this.getTitleElement('Auto Farm');
        this.$container = $container;
        this.$title = $title;

        this.$title.click(() => this.toggle());
        if (this.active) this.$title.addClass('active');

        this.$buttonBox = uw.$('<div>').css({ "padding": "5px", "display": "flex", "gap": "5px" });
        this.$container.append(this.$buttonBox);

        this.$button1 = this.getButtonElement("5 / 10 min")
        this.$button1.click(() => this.setDuration(1));
        this.$button2 = this.getButtonElement("20 / 40 min")
        this.$button2.click(() => this.setDuration(2));

        // NUEVO: Botón Farmear Ya
        this.$forceBtn = this.getButtonElement("🚜 Farmear Ya");
        this.$forceBtn.click(() => this.forceFarm());

        this.setDuration(this.duration);
        this.$buttonBox.append(this.$button1, this.$button2, this.$forceBtn);

        return this.$container;
    }

    toggle() {
        this.active = !this.active;
        this.saveSettings('farm_active', this.active);
        this.$title.toggleClass('active');
    }

    setDuration(duration) {
        this.duration = duration;
        this.saveSettings('farm_duration', duration);

        this.$button1.removeClass('disabled');
        this.$button2.removeClass('disabled');

        if (duration === 1) this.$button1.addClass('disabled');
        if (duration === 2) this.$button2.addClass('disabled');
    }

    // NUEVO: Función para forzar el farmeo
    async forceFarm() {
        if (this.is_farming) return;
        this.is_farming = true;
        this.$forceBtn.text("Farmeando...");
        
        this.polis_list = this.generateList();
        await this.claim();
        
        this.last_farm_time = Date.now();
        this.is_farming = false;
        this.$forceBtn.text("🚜 Farmear Ya");
    }

    async execute() {
        if (!this.active) return false;
        if (this.is_farming) return false; // Evitar conflictos si se está forzando

        if (Date.now() - this.last_farm_time < 10000) return false; 

        const next_collection = this.getNextCollection();
        if (next_collection > 0) return false;

        this.is_farming = true;
        this.polis_list = this.generateList();
        await this.claim();
        this.last_farm_time = Date.now();
        this.is_farming = false;
        return true;
    }

    generateList = () => {
        const islands_list = new Set();
        const polis_list = [];
        let minResource = 0;
        let min_percent = 0;

        const { models: towns } = uw.MM.getOnlyCollectionByName('Town');

        for (const town of towns) {
            const { on_small_island, island_id, id } = town.attributes;
            if (on_small_island || islands_list.has(island_id)) continue;

            const { wood, stone, iron, storage } = uw.ITowns.getTown(id).resources();
            minResource = Math.min(wood, stone, iron);
            min_percent = minResource / storage;

            islands_list.add(island_id);
            polis_list.push(town.id);
        }

        return polis_list;
    };

    getNextCollection = () => {
        const { models } = uw.MM.getCollections().FarmTownPlayerRelation[0];

        const lootCounts = {};
        for (const model of models) {
            const { lootable_at } = model.attributes;
            if (!lootable_at) continue;
            lootCounts[lootable_at] = (lootCounts[lootable_at] || 0) + 1;
        }

        let maxLootableTime = 0;
        let maxValue = 0;
        for (const lootableTime in lootCounts) {
            const value = lootCounts[lootableTime];
            if (value < maxValue) continue;
            maxLootableTime = lootableTime;
            maxValue = value;
        }

        const seconds = maxLootableTime - Math.floor(Date.now() / 1000);
        return seconds > 0 ? seconds * 1000 : 0;
    };

    async claim() {
        const isCaptainActive = uw.GameDataPremium.isAdvisorActivated('captain');

        if (isCaptainActive) {
            console.log('Claiming resources all at once');
            await this.fakeOpening();
            await this.sleep(Math.random() * 2000 + 1000);
            await this.fakeSelectAll();
            await this.sleep(Math.random() * 2000 + 1000);

            if (this.duration == 1) await this.claimMultiple(300, 600);
            if (this.duration == 2) await this.claimMultiple(1200, 2400);
            await this.fakeUpdate();

            setTimeout(() => uw.WMap.removeFarmTownLootCooldownIconAndRefreshLootTimers(), 2000);
            return;
        }

        console.log('Claiming resources one by one');

        let max = 60;
        const { models: player_relation_models } = uw.MM.getOnlyCollectionByName('FarmTownPlayerRelation');
        const { models: farm_town_models } = uw.MM.getOnlyCollectionByName('FarmTown');
        const now = Math.floor(Date.now() / 1000);
        
        for (let town_id of this.polis_list) {
            let town = uw.ITowns.getTown(town_id); 
            let x = town.getIslandCoordinateX();
            let y = town.getIslandCoordinateY();
            
            for (let farm_town of farm_town_models) {
                if (farm_town.attributes.island_x != x) continue;
                if (farm_town.attributes.island_y != y) continue;
                
                for (let relation of player_relation_models) {
                    if (farm_town.attributes.id != relation.attributes.farm_town_id) continue;
                    if (relation.attributes.relation_status !== 1) continue;
                    if (relation.attributes.lootable_at !== null && now < relation.attributes.lootable_at) continue;
                    
                    let option = 1;
                    if (this.duration === 1) option = 1; 
                    else if (this.duration === 2) option = 3; 
                    
                    this.claimSingle(town_id, relation.attributes.farm_town_id, relation.id, option);
                    await this.sleep(500); 
                    if (!max) return;
                    else max -= 1;
                }
            }
        }
        
        setTimeout(() => uw.WMap.removeFarmTownLootCooldownIconAndRefreshLootTimers(), 2000);
    }

    claimSingle = (town_id, farm_town_id, relation_id, option = 1) => {
        const data = {
            model_url: `FarmTownPlayerRelation/${relation_id}`,
            action_name: 'claim',
            arguments: {
                farm_town_id: farm_town_id,
                type: 'resources',
                option: option,
                time_option: option, 
            },
            town_id: town_id,
        };
        uw.gpAjax.ajaxPost('frontend_bridge', 'execute', data);
    };

    claimMultiple = (base = 300, boost = 600) =>
        new Promise((myResolve) => {
            const polis_list = this.generateList();
            let data = {
                towns: polis_list,
                time_option_base: base,
                time_option_booty: boost,
                claim_factor: 'normal',
            };
            uw.gpAjax.ajaxPost('farm_town_overviews', 'claim_loads_multiple', data, false, () => myResolve());
        });

    fakeOpening = () =>
        new Promise((myResolve) => {
            uw.gpAjax.ajaxGet('farm_town_overviews', 'index', {}, false, async () => {
                await this.sleep(10);
                await this.fakeUpdate();
                myResolve();
            });
        });

    fakeSelectAll = () =>
        new Promise((myResolve) => {
            const data = { town_ids: this.polis_list };
            uw.gpAjax.ajaxGet('farm_town_overviews', 'get_farm_towns_from_multiple_towns', data, false, () => myResolve());
        });

    fakeUpdate = () =>
        new Promise((myResolve) => {
            const town = uw.ITowns.getCurrentTown();
            const { attributes: booty } = town.getResearches();
            const { attributes: trade_office } = town.getBuildings();
            const data = {
                island_x: town.getIslandCoordinateX(),
                island_y: town.getIslandCoordinateY(),
                current_town_id: town.id,
                booty_researched: booty ? 1 : 0,
                diplomacy_researched: '',
                trade_office: trade_office ? 1 : 0,
            };
            uw.gpAjax.ajaxGet('farm_town_overviews', 'get_farm_towns_for_town', data, false, () => myResolve());
        });
}

// Module: autoTrade.js
class AutoTrade {

}

// File: menu.js
// Handle the creation of the menu

// Title + toggle
// Button plus text
// Image plus action

class ModernMenu {
    constructor(tabs) {
        this.settingsFactory = new createGrepoWindow({
            id: 'MODERN_BOT',
            title: 'ModernBot',
            size: [845, 300],
            tabs: tabs,
            start_tab: 0,
        });
        this.settingsFactory.activate();

        this.addIcon();
    }

    addIcon() {
        // this.settingsFactory.activate();
        const $gods_area_buttons = $('.gods_area_buttons')

        const $circle_button = $('<div class="circle_button modern_bot_settings"></div>');
        $circle_button.click(() => { this.settingsFactory.openWindow() });
        const $icon = $('<div style="width: 27px; height: 27px; background: url(https://raw.githubusercontent.com/Sau1707/ModernBot/main/img/gear.png) no-repeat 6px 5px" class="icon js-caption"></div>');
        $icon.attr("id", "modern_settings");

        $circle_button.append($icon);
        $gods_area_buttons.append($circle_button);
    }
}

// File: index.js
/*



*/

class ModernBot {
    STOP_TIME = 1000 * 5;
    ACTION_DELAY = 1000 * 0;

    constructor() {
        this.lastInteraction = Date.now();
        this.lastAction = Date.now();
        this.loopActive = false;

        // Instanciamos los módulos usando la nueva arquitectura limpia
        this.autoFarm = new AutoFarm();
        this.autoBuild = new AutoBuild();

        new ModernMenu([
            {
                title: 'Farm',
                id: 'farm',
                render: () => this.autoFarm.render(),
            },
            { 
                title: 'Build',
                id: 'build',
                render: () => this.autoBuild.render(),
            }
        ]);
    }

    enableListeners() {
        $(document).on('mousemove', () => {
            this.lastInteraction = Date.now();
            $("#modern_settings").removeClass("rotate-forever");
        });

        $(document).on('keydown', (e) => {
            this.lastInteraction = Date.now();
            $("#modern_settings").removeClass("rotate-forever");
        });
    }

    async loop() {
        // Check if the captcha is active or the user has interacted with the page
        if (Date.now() - this.lastInteraction < this.STOP_TIME) return;
        if ($('.botcheck').length || $('#recaptcha_window').length) return;
        if (Date.now() - this.lastAction < this.ACTION_DELAY) return;

        if (this.loopActive) return;
        this.loopActive = true;

        // The bot is active, ensure the settings icon is rotating
        $("#modern_settings").addClass("rotate-forever");

        // Check if the farm is available
        const hasFarm = await this.autoFarm.execute();
        if (hasFarm) {
            console.log("Farm was executed");
            this.lastAction = Date.now();
            this.loopActive = false;
            return;
        };

        // Check if the build is available
        const hasBuild = await this.autoBuild.execute();
        if (hasBuild) {
            console.log("Build was executed");
            this.lastAction = Date.now();
            this.loopActive = false;
            return;
        };

        this.loopActive = false;
    }
}

const loader = setInterval(() => {
    // 1. Esperamos pacientemente a que la ventana de Grepolis (uw) y su jQuery (uw.$) existan
    if (typeof uw === 'undefined' || typeof uw.$ !== 'function') return;
    
    // 2. Una vez que el motor existe, esperamos a que desaparezca la pantalla de carga del juego
    if (uw.$("#loader").length > 0) return;
    
    // 3. ¡Vía libre! Detenemos el temporizador y arrancamos el bot
    clearInterval(loader);

    const modernBot = new ModernBot();
    modernBot.enableListeners();

    setInterval(() => {
        modernBot.loop();
    }, 250);

}, 100);
})();