
game = {types: ["phone","mail","facebook","twit"], values: {}};
var imageWidth = 64;
var bufferOffset = 15;


function Customer(level)
{
	this.randT = Math.floor(Math.random() * 4); //Any type from 0-3

    randif = Math.floor(Math.random() * 20);
    if (randif < 14) {
        this.randM = 0;
    } else if (randif < 17) {
        this.randM = 1;
    } else {
        this.randM = 2;
    };  //Any mood from 0-2

	this.randVal = 100 * level; //Any cash value from 5-level
    if(this.randM === 1){
        this.randVal *= 5;
    }
}

function addCustomers()
{
    var averageEmployee = (game.employees[0].count + game.employees[1].count + game.employees[2].count + game.employees[3].count)/4 + 1; //Crappy average calculation
    var customer = new Customer(game.player.level,game.employees.length);
    customer.sprite  = game.scene.Sprite(customerImage(customer.randT, customer.randM), game.layer);
    customer.sprite.move(game.positions[customer.randT], -imageWidth);
    customer.sprite.size(imageWidth, imageWidth);
    var speedBonus = [1,1.4,1.7]
    customer.sprite.yv = 3 * game.player.level * speedBonus[customer.randM];
    customer.sprite.update();

    var reputation = customer.randM == 2 ? 3 : 1;
    game.values[customer.sprite.id] = {cash: customer.randVal, rep: reputation};

    game.customerSprites.add(customer.sprite);
    //game.customers.push(customer);
}

function customerImage(cType, cMood)
{
    var customerMood = ["n","m","a"];
    return "img/"+game.types[cType]+"-"+customerMood[cMood]+".png";
}

function initBuckets(){
    game.buckets = [];    

    for(var i = 0; i < 4; i++){
        var bucket = new Bucket(game.employees[i]);    
        bucket.sprite  = game.scene.Sprite("img/bucket.png",game.layer);
        var type = game.employees[i].type;
        bucket.sprite.move(game.positions[type], 50 + (127*i));
        bucket.sprite.size(imageWidth, imageWidth);
        bucket.disappear();
        bucket.sprite.update();
        game.buckets.push(bucket);
    }
}

$(document).ready(function () 
{
    $container = $("#canvas-container")
    game.customers = [];
    game.size = {width: $container.innerWidth(), height: $container.innerWidth()};
    game.scene = sjs.Scene({w: game.size.width, h: game.size.height, parent: $container[0]});
    game.layer = game.scene.Layer("front");
    
    var gap = game.size.width/8;
    game.positions = [gap-(imageWidth/2) - bufferOffset, gap*3-(imageWidth/2) - bufferOffset, gap*5-(imageWidth/2) - bufferOffset, gap*7-(imageWidth/2) - bufferOffset];

    game.input = game.scene.Input();
    game.customerSprites = sjs.List();
    game.tickCounter = 0;
    game.ticker = game.scene.Ticker(draw);
    game.satisfaction = 100;
    game.buttons = sjs.List();
    propagateSatisfaction();

    initBuckets();
    initButton();

});

function initButton()
{  
    game.buttonLayer = game.scene.Layer("buttons");
    buttonLabels = ["A","S","D","F"];

    for(var s in buttonLabels)
    {
        button  = game.scene.Sprite("img/btn-"+buttonLabels[s]+".png", game.buttonLayer);
        button.move(game.positions[s], 500);
        button.size(imageWidth, imageWidth);
        button.update();
        game.buttons.add(button);
    }

}

function loseGame()
{
    document.getElementById('nooo').play();
}

function buttonCheck(character, index)
{
    if(game.input.keyboard[character])
    {
        game.buttons.list[index].setYOffset(imageWidth);
        game.buttons.list[index].update();
        checkPresence(index);
    }
    else
    {
        game.buttons.list[index].setYOffset(0);
        game.buttons.list[index].update();
    }
}

function addSatisfaction(){
    if (game.satisfaction+1 <= 100) {
        game.satisfaction++;
    }
}

function draw()
{
    buttonCheck("a",0);
    buttonCheck("s",1);
    buttonCheck("d",2);
    buttonCheck("f",3);

    var  customer;
    while(customer = game.customerSprites.iterate()) 
    {
        //console.log(game.customerSprites.list.length);
        customer.applyVelocity();
        customer.update();

        if(customer.y > (game.size.height))
        {
            game.customerSprites.remove(customer);
            customer.remove();
            game.satisfaction -= game.values[customer.id].rep;
            delete game.values[customer.id];

            propagateSatisfaction();

            if(game.satisfaction < 0.5)
                loseGame();
        }
    }

    game.tickCounter++;
    if (game.tickCounter % 50 == 0) 
        addCustomers();

    for(var i in game.buckets){
        var bucket = game.buckets[i];
        
        if(bucket.visible){
            for(var j in game.customerSprites.list){
                var customer = game.customerSprites.list[j];
                if(bucket.sprite.y - customer.y <= 32 && bucket.sprite.y - customer.y > -64 && Math.abs(bucket.sprite.x - customer.x) < 1){
                    bucket.disappear();
                    bucket.sprite.update();

                    addSatisfaction();
                    propagateSatisfaction();
                    game.player.addCash(game.values[customer.id].cash);
                    
                    propagateCash();
                    
                    game.customerSprites.remove(customer);
                    customer.remove();         
                    delete game.values[customer.id];
                }
            }
        }else{
            if(bucket.shouldAppear()){
                bucket.appear();
                bucket.sprite.update();
            }    
        }
    }
}
function checkPresence(index)
{
    var button = game.buttons.list[index];
    while(customer = game.customerSprites.iterate())
    {
        if(button.y - customer.y <= 0 && button.y - customer.y > -64 && Math.abs(button.x - customer.x) < 1)
        {
            addSatisfaction();
            game.player.addCash(game.values[customer.id].cash);
            propagateSatisfaction();
            propagateCash();
            
            game.customerSprites.remove(customer);
            customer.remove();         
            delete game.values[customer.id];
        }
    }
}

function propagateSatisfaction() {
    game.ngScope.$apply(function(){game.ngScope.satisfaction = game.satisfaction;});
}

function propagateCash() {
    game.ngScope.$apply(function(){game.ngScope.player.cash = game.player.cash;});
}


    /*
    if(game.input.keyboard.a)
    {
        game.buttons.list[0].setYOffset(imageWidth);
        game.buttons.list[0].update();
    }
    else
    {
        game.buttons.list[0].setYOffset(0);
        game.buttons.list[0].update();
    }
    */
