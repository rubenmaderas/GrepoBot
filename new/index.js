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
    if ($("#loader").length > 0) return;
    clearInterval(loader);

    const modernBot = new ModernBot();
    modernBot.enableListeners();

    setInterval(() => {
        modernBot.loop();
    }, 250);

}, 100);