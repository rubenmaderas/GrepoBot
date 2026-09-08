class AutoBuild extends ModernUtils {
    constructor() {
        super();
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
