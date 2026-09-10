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