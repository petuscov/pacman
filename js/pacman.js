// Variables globales de utilidad
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var w = canvas.width; //sólo se usan para borrar canvas.
var h = canvas.height;

// GAME FRAMEWORK 
var GF = function(){
	var tamanoNivelWidth =21;
	var tamanoNivelHeight =25; /*Lo trampeamos para poder setear dimensiones correctas del canvas, 
	lo suyo sería cogerlos tras cargar 1.txt pero por algún motivo no funciona*/
	var over;
	var GLOBAL_TILE_SIDE = 20; //BALDOSAS CUADRADAS //se puede poner a 22,21,etc sin problemas //24
	var GLOBAL_PACMAN_VEL = 3; //3
	var GLOBAL_GHOST_HOME_RETURN_SPEED = 4; //4
	var GLOBAL_GHOST_VULNERABLE_SPEED = 2; //2
	var GLOBAL_GHOST_SPEED = 3; //3
	var columnaPac;
	var filaPac;
	var pelletsCargados;
	// variables para contar frames/s, usadas por measureFPS
    var frameCount = 0;
    var lastTime;
    var fpsContainer;
    var pointsContainer;
    var lifesContainer
    var fps; 
 	var casaXBaldosa; //dentro de la casa de los fantasmas, baldosa, no coordenada.
	var casaYBaldosa;
    inputStates = {};
    var mapaEstrella = [];
    var mapaPelletsCargados;
    var numGhosts = 4;
	var ghostcolor = {};
	ghostcolor[0] = "rgba(255, 0, 0, 255)";
	ghostcolor[1] = "rgba(255, 128, 255, 255)";
	ghostcolor[2] = "rgba(128, 255, 255, 255)";
	ghostcolor[3] = "rgba(255, 128, 0,   255)";
	ghostcolor[4] = "rgba(50, 50, 255,   255)"; // blue, vulnerable ghost
	ghostcolor[5] = "rgba(255, 255, 255, 255)"; // white, flashing ghost
	var idPlayer;
	// hold ghost objects
	var ghosts = {};

    var Ghost = function(id, ctx){

		this.x = 0;
		this.y = 0;
		this.velX = 0;
		this.velY = 0;
		this.state = Ghost.NORMAL;
		this.nearestRow = 0;
		this.nearestCol = 0;
		this.baldosaOrigenX;
		this.baldosaOrigenY;
		this.ctx = ctx;
		this.id = id;

		this.draw = function(){
			var color = ghostcolor[this.id];
			// Nos aseguramos de pintar el fantasma de un color u otro dependiendo del estado del fantasma y de thisGame.ghostTimer
			if(this.state == Ghost.VULNERABLE){
				if(thisGame.ghostTimer>100){
					color = ghostcolor[4];
				}else{//parpadear
					if(thisGame.ghostTimer % 40 >20){
						color = ghostcolor[4];
					}else{
						color = ghostcolor[5];
					}
				}
			}
			// Pintamos cuerpo de fantasma (sólo debe dibujarse cuando el estado del mismo es distinto a Ghost.SPECTACLES)
			if(this.state != Ghost.SPECTACLES){
				var r = GLOBAL_TILE_SIDE/2-3;
				ctx.beginPath();
				strokeStyle = 'black';
				ctx.arc(this.x+thisGame.TILE_WIDTH/2,this.y+thisGame.TILE_HEIGHT/2,r,0,Math.PI,true);
				ctx.lineTo(this.x+thisGame.TILE_WIDTH/2,this.y+thisGame.TILE_HEIGHT);
				ctx.closePath();
				ctx.lineWidth = 4;
				ctx.stroke();  
				ctx.fillStyle = color; 
			    ctx.fill();
			}
			// Pintamos ojos 
			ctx.beginPath();
			ctx.arc(this.x+thisGame.TILE_WIDTH/2-thisGame.TILE_WIDTH/6,this.y+thisGame.TILE_HEIGHT/2,1,0,Math.PI*2,true);
			ctx.closePath();
			ctx.lineWidth = 1;
			ctx.stroke(); 
			ctx.fillStyle = 'white';
		    ctx.fill();
		    ctx.beginPath();
			ctx.arc(this.x+thisGame.TILE_WIDTH/2+thisGame.TILE_WIDTH/6,this.y+thisGame.TILE_HEIGHT/2,1,0,Math.PI*2,true);
			ctx.closePath();
			ctx.lineWidth = 1;
			ctx.stroke(); 
			ctx.fillStyle = 'white';
		    ctx.fill();
 
		}; // draw

    	this.calcularPosiblesDirecciones = function(x,y){
	    	var posiblesDirecciones = [];
			if((x % thisGame.TILE_WIDTH) == 0 && (y % thisGame.TILE_HEIGHT) == 0){ //en baldosa exacta.
				if(!thisLevel.isWall(getRow(y),getCol(x-1))){
					tile = thisLevel.getMapTile(getRow(y),getCol(x-1));//
					if(tile!=20){// tile!=11 && ){ //11 se considera wall
						posiblesDirecciones.push(0); //izquierda
					}
				}
				if(!thisLevel.isWall(getRow(y-1),getCol(x))){
					tile = thisLevel.getMapTile(getRow(y-1),getCol(x));
					if(tile!=21){
						posiblesDirecciones.push(1); //arriba
					}
				}
				if(!thisLevel.isWall(getRow(y),getCol(x+thisGame.TILE_WIDTH))){
					tile = thisLevel.getMapTile(getRow(y),getCol(x+thisGame.TILE_WIDTH));
					if(tile!=20){ //&& tile!=13){ //13 se considera wall
						posiblesDirecciones.push(2); //derecha
					}
				}
				if(!thisLevel.isWall(getRow(y+thisGame.TILE_HEIGHT),getCol(x))){
					tile = thisLevel.getMapTile(getRow(y+thisGame.TILE_HEIGHT),getCol(x));
					if(tile!=1 && tile!=21){
						posiblesDirecciones.push(3); //abajo
					}else{
						if(this.state==Ghost.SPECTACLES){posiblesDirecciones.push(3);}
					}
				}
			}
			return posiblesDirecciones;
	    };
     
	    this.movimientoEstrella = function(){
	    	var MAPWIDTH = thisLevel.lvlWidth;
        	var MAPHEIGHT = thisLevel.lvlHeight;
        	var BaldosaWidth = thisGame.TILE_WIDTH;
        	var BaldosaHeight = thisGame.TILE_HEIGHT;
	    	var baldosaX = Math.floor(this.x/BaldosaWidth);
	    	var baldosaY = Math.floor(this.y/BaldosaHeight);

	    	var valorBaldosaFantasma = mapaEstrella[baldosaX+baldosaY*MAPWIDTH];
	    	var direccion = "";
	    	var direcciones = this.calcularPosiblesDirecciones(this.x,this.y);
	    	var encontrado = false;

	    	if(baldosaX==casaXBaldosa && baldosaY==casaYBaldosa){
	    		this.state = Ghost.NORMAL;

	    	}else{

		    	while(direcciones.length>0 && !encontrado){ 

		    		switch(direcciones[0]){
		    			case 0: if(valorBaldosaFantasma>mapaEstrella[baldosaX-1+baldosaY*MAPWIDTH]){encontrado = true;direccion=0;}break; //izquierda
		    			case 1: if(valorBaldosaFantasma>mapaEstrella[baldosaX+(baldosaY-1)*MAPWIDTH]){encontrado = true;direccion=1;}break; //arriba
		    			case 2: if(valorBaldosaFantasma>mapaEstrella[baldosaX+1+baldosaY*MAPWIDTH]){encontrado = true;direccion=2;}break; //derecha
		    			case 3: if(valorBaldosaFantasma>mapaEstrella[baldosaX+(baldosaY+1)*MAPWIDTH]){encontrado = true;direccion=3;}break; //abajo
		    		}
		    		direcciones.shift();
		    	}
		    	switch(direccion){
					case 0: this.velX = -GLOBAL_GHOST_HOME_RETURN_SPEED; this.velY = 0;this.x = this.x + this.velX;this.y = this.y + this.velY; break;
					case 1: this.velX = 0; this.velY = -GLOBAL_GHOST_HOME_RETURN_SPEED;this.x = this.x + this.velX;this.y = this.y + this.velY; break;
					case 2: this.velX = GLOBAL_GHOST_HOME_RETURN_SPEED; this.velY = 0;this.x = this.x + this.velX;this.y = this.y + this.velY; break;
					case 3: this.velX = 0; this.velY = GLOBAL_GHOST_HOME_RETURN_SPEED;this.x = this.x + this.velX;this.y = this.y + this.velY; break;
					default:{ //se entra aquí si el array con direcciones está vacio porque el fantasma no se encontraba EXACTAMENTE en una baldosa
						nuevX = this.x + this.velX;nuevY = this.y + this.velY;
						baldosaXNueva = Math.floor(nuevX/BaldosaWidth);
		    			baldosaYNueva = Math.floor(nuevY/BaldosaHeight);
						if(baldosaXNueva != baldosaX || baldosaYNueva!=baldosaY){ //al actualizar posición se cambiaria de casilla. ajustar EXACTA a la que deba ser.
							if(this.velX > 0 || this.velY > 0){
								this.x = baldosaXNueva*BaldosaWidth;
								this.y = baldosaYNueva*BaldosaHeight;
							}else{
								if(this.velX < 0 || this.velY < 0){
									this.x = baldosaX*BaldosaWidth;
									this.y = baldosaY*BaldosaHeight;
								}else{
									console.log("comportamiento extraño");
								}
							}
						}else{
							this.x = nuevX;
							this.y = nuevY; 
						}
						break;
					}
				}
			}
	    }

	    this.move = function() {
		    var posiblesDirecciones;
		    var direccion;
		    // Si el estado del fantasma es Ghost.SPECTACLES el fantasma regresa a casa por el camino más corto
		    if(this.state == Ghost.SPECTACLES){
		    	
		    	if(this.velX == this.velY){//para los tests.
		    		posiblesDirecciones = this.calcularPosiblesDirecciones(this.x,this.y);
		    		direccion = Math.floor(Math.random()*posiblesDirecciones.length); 
					switch(posiblesDirecciones[direccion]){
						case 0: this.velX = -GLOBAL_GHOST_HOME_RETURN_SPEED; this.velY = 0; break;
						case 1: this.velX = 0; this.velY = -GLOBAL_GHOST_HOME_RETURN_SPEED; break;
						case 2: this.velX = GLOBAL_GHOST_HOME_RETURN_SPEED; this.velY = 0; break;
						case 3: this.velX = 0; this.velY = GLOBAL_GHOST_HOME_RETURN_SPEED; break;
					}
		    	}
		    	this.movimientoEstrella();
		    }else{

				
				if(this.x % thisGame.TILE_WIDTH == 0 && this.y % thisGame.TILE_HEIGHT == 0){ //en baldosa exacta.
					posiblesDirecciones = [];
					posiblesDirecciones=this.calcularPosiblesDirecciones(this.x,this.y);
					
					if( posiblesDirecciones.length>2){//si hay bifurcación
						var previousDir;
						var index;
						if(this.velX < 0){
							//previousDir=0; //izquierda
							//quitamos el 2 del array de posibles direcciones si está.
							index = posiblesDirecciones.indexOf(2);
							if(index>-1){posiblesDirecciones.splice(index,1);}
						}
						if(this.velX > 0){
							//previousDir=2; //derecha
							//quitamos el 0 del array de posibles direcciones si está.
							index = posiblesDirecciones.indexOf(0);
							if(index>-1){posiblesDirecciones.splice(index,1);}
						}
						if(this.velY < 0){
							//previousDir=1; //arriba 
							//quitamos el 3 del array de posibles direcciones si está.
							index = posiblesDirecciones.indexOf(3);
							if(index>-1){posiblesDirecciones.splice(index,1);}
						}
						if(this.velY > 0){
							//previousDir=3; //abajo
							//quitamos el 1 del array de posibles direcciones si está.
							index = posiblesDirecciones.indexOf(1);
							if(index>-1){posiblesDirecciones.splice(index,1);}
						}
						direccion = Math.floor(Math.random()*posiblesDirecciones.length); 
						switch(posiblesDirecciones[direccion]){
							case 0: this.velX = -GLOBAL_GHOST_SPEED; this.velY = 0; break;
							case 1: this.velX = 0; this.velY = -GLOBAL_GHOST_SPEED; break;
							case 2: this.velX = GLOBAL_GHOST_SPEED; this.velY = 0; break;
							case 3: this.velX = 0; this.velY = GLOBAL_GHOST_SPEED; break;
						}
					}else{
						var possiblePlayerX = this.x;
						var possiblePlayerY = this.y;
						if(this.velX < 0){
							possiblePlayerX= this.x + this.velX;
						}
						if(this.velX > 0){
							possiblePlayerX= this.x + this.velX + thisGame.TILE_WIDTH;
						}
						if(this.velY < 0){
							possiblePlayerY = this.y + this.velY;
						}
						if(this.velY > 0){
							possiblePlayerY = this.y + this.velY + thisGame.TILE_HEIGHT;
						}
						var columna = Math.floor(possiblePlayerX / thisGame.TILE_WIDTH);
						var fila = Math.floor(possiblePlayerY / thisGame.TILE_HEIGHT);
						var tile = thisLevel.getMapTile(fila,columna);
						if(thisLevel.isWall(fila,columna) || tile ==20 || tile ==21){
							direccion = Math.floor(Math.random()*posiblesDirecciones.length); 
							switch(posiblesDirecciones[direccion]){
								case 0: this.velX = -GLOBAL_GHOST_SPEED; this.velY = 0; break;
								case 1: this.velX = 0; this.velY = -GLOBAL_GHOST_SPEED; break;
								case 2: this.velX = GLOBAL_GHOST_SPEED; this.velY = 0; break;
								case 3: this.velX = 0; this.velY = GLOBAL_GHOST_SPEED; break;
							}
						}
					}
					this.x = this.x + this.velX;
					this.y = this.y + this.velY;
				}else{ 
					//Si no se encuentra en baldosa exacta
					//Si el tamaño de la baldosa es p.e 24 la velocidad normal de los fantasmas debe ser multiplo de ese numero para todo ok
					//Por eso corregimos movimiento:
					
					var BaldosaWidth = thisGame.TILE_WIDTH;
        			var BaldosaHeight = thisGame.TILE_HEIGHT;
					var baldosaX = Math.floor(this.x/BaldosaWidth);
	    			var baldosaY = Math.floor(this.y/BaldosaHeight);
					var nuevX = this.x + this.velX;
					var nuevY = this.y + this.velY;
					var baldosaXNueva = Math.floor(nuevX/BaldosaWidth);
	    			var baldosaYNueva = Math.floor(nuevY/BaldosaHeight);
					if(baldosaXNueva != baldosaX || baldosaYNueva!=baldosaY){ //al actualizar posición se cambiaria de casilla. ajustar EXACTA a la que deba ser.
						if(this.velX > 0 || this.velY > 0){
							this.x = baldosaXNueva*BaldosaWidth;
							this.y = baldosaYNueva*BaldosaHeight;
						}else{
							if(this.velX < 0 || this.velY < 0){
								this.x = baldosaX*BaldosaWidth;
								this.y = baldosaY*BaldosaHeight;
							}else{
								console.log("comportamiento extraño");
							}
						}
					}else{
						this.x = nuevX;
						this.y = nuevY; 
					}
				}
			}
		};
	}; // fin clase Ghost

	 // static variables
	  Ghost.NORMAL = 1;
	  Ghost.VULNERABLE = 2;
	  Ghost.SPECTACLES = 3;

	var Level = function(ctx) {
		this.ctx = ctx;
		this.lvlWidth = 0;
		this.lvlHeight = 0;
		this.map = [];
		this.pellets = 0;
		this.powerPelletBlinkTimer = 0;

	this.setMapTile = function(row, col, newValue){
		this.map[row*this.lvlWidth+col]=newValue;
	};

	this.getMapTile = function(row, col){	
		return this.map[row*this.lvlWidth+col];	
	};

	this.printMap = function(){
		console.log(this.map);
	};

	this.loadLevel = function(){
		// leemos res/levels/1.txt y lo guardamos en el atributo map con setMapTile
		$.get("res/levels/1.txt", function(data){ 
			var lineas = data.split("\n");
			var numFila = 0;
			var arrayFilas = [];
        	for (i = 0; i < lineas.length; i++) {//Por cada linea
            	elementosL = lineas[i].split(" ");
            	
				if(elementosL[0] == "#"){
        			if(elementosL[1] == "lvlwidth"){thisLevel.lvlWidth=elementosL[2];} 
        			if(elementosL[1] == "lvlheight"){thisLevel.lvlHeight=elementosL[2];}
        		}else if(elementosL[0]== ""){//para evitar interpretar lineas en blanco, se ignoran
        		}else{
	            	arrayFilas.push(elementosL);
	            }
	            
        	} //codigo optimizado, antes era ineficiente.
        	for(var numFila =0; numFila < arrayFilas.length; numFila++){
	        	for(j = 0; j < arrayFilas[0].length;j++){ //cojemos el 0 porque es irrelevante que fila coger puesto que tienen la misma longitud.
	    			thisLevel.setMapTile((numFila),j,arrayFilas[numFila][j]);
	    			if(arrayFilas[numFila][j] == "4"){
						columnaPac= j;
						filaPac = numFila;
	    			}
	    			if(arrayFilas[numFila][j] == "3"){
	    				thisLevel.pellets+=1;
	    			}
	    			if(arrayFilas[numFila][j] == "2"){
	    				thisLevel.pellets+=1;
	    			}
	    			//inicializamos posiciones origen fantasmas:
					if(arrayFilas[numFila][j] == "10"){
						ghosts[0].baldosaOrigenX = j;
						ghosts[0].baldosaOrigenY = numFila;
					}
					if(arrayFilas[numFila][j] == "11"){
						ghosts[1].baldosaOrigenX = j;
						ghosts[1].baldosaOrigenY = numFila;
					}
					if(arrayFilas[numFila][j]== "12"){
						ghosts[2].baldosaOrigenX = j;
						ghosts[2].baldosaOrigenY = numFila;
						casaXBaldosa = j; //inicializamos casilla "casa" de los fantasmas.
						casaYBaldosa = numFila;
					}
					if(arrayFilas[numFila][j] == "13"){
						ghosts[3].baldosaOrigenX = j;
						ghosts[3].baldosaOrigenY = numFila;
					}
	    		}
    		}
		}, 'text'); //Importantísimo, sin esto lo interpreta como html o xml y da error.
		
	};

	this.cargarMapaEstrella = function(){
        var MAPWIDTH = thisLevel.lvlWidth;
        var MAPHEIGHT = thisLevel.lvlHeight;
        var casillasAComprobar = [];
		var casillasVisitadas = thisLevel.map.slice(); //creamos copia
		for(var i=0;i<casillasVisitadas.length;i++){
			if(casillasVisitadas[i]<100 || mapaEstrella[i]>199){
                casillasVisitadas[i]=1; //las casillas que se pueden visitar a 1, las visitadas a 2.
			}else{
				casillasVisitadas[i]=-1; //ponemos -1 en las paredes.
			}
		}
        
        mapaEstrella = casillasVisitadas.slice(); //creamos copia

        mapaEstrella[casaXBaldosa + casaYBaldosa*MAPWIDTH] = 1; //la casa de los fantasmas tiene un valor de 1. (el más bajo)
        casillasVisitadas[casaXBaldosa + casaYBaldosa*MAPWIDTH] = 2;
        casillaInicial = casaXBaldosa + casaYBaldosa*MAPWIDTH;
		casillasAComprobar.push(casillaInicial);
		while(casillasAComprobar.length > 0){
			casillaAComprobar = casillasAComprobar.shift();
			valorCasilla = mapaEstrella[casillaAComprobar];
			//izquierda
			if(casillaAComprobar%MAPWIDTH!=0){ //si el resto es 0 no hay nada a la izquierda (borde del mapa)
				casIzRow = Math.floor(casillaAComprobar/MAPWIDTH);
                casIzCol = casillaAComprobar%MAPWIDTH-1;
                if(!this.isWall(casIzRow,casIzCol)){
                	if(casillasVisitadas[casIzCol+casIzRow*MAPWIDTH] != 2){
                        casillasAComprobar.push(casIzCol + casIzRow * MAPWIDTH);
                        mapaEstrella[casIzCol + casIzRow * MAPWIDTH] = valorCasilla+1;
                        casillasVisitadas[casIzCol + casIzRow * MAPWIDTH] = 2;
                    }
                }
			}
            //derecha 
            if(casillaAComprobar%MAPWIDTH!=MAPWIDTH-1){ //si el resto es igual al ancho del mapa no hay nada a la derecha(borde del mapa)
                casIzRow = Math.floor(casillaAComprobar/MAPWIDTH);
                casIzCol = casillaAComprobar%MAPWIDTH+1;
                if(!this.isWall(casIzRow,casIzCol)){
                    if(casillasVisitadas[casIzCol+casIzRow*MAPWIDTH] != 2){
                        casillasAComprobar.push(casIzCol + casIzRow * MAPWIDTH);
                        mapaEstrella[casIzCol + casIzRow * MAPWIDTH] = valorCasilla+1;
                        casillasVisitadas[casIzCol + casIzRow * MAPWIDTH] = 2;
                    }
                }
            }
            //arriba
            if(Math.floor(casillaAComprobar/MAPWIDTH)!=0){ //si la división es 0 no hay nada arriba (borde del mapa)
                casIzRow = Math.floor(casillaAComprobar/MAPWIDTH)-1;
                casIzCol = casillaAComprobar%MAPWIDTH;
                if(!this.isWall(casIzRow,casIzCol)){
                    if(casillasVisitadas[casIzCol+casIzRow*MAPWIDTH] != 2){
                        casillasAComprobar.push(casIzCol + casIzRow * MAPWIDTH);
                        mapaEstrella[casIzCol + casIzRow * MAPWIDTH] = valorCasilla+1;
                        casillasVisitadas[casIzCol + casIzRow * MAPWIDTH] = 2;
                    }
                }
            }
            //abajo
            if(Math.floor(casillaAComprobar/MAPWIDTH)!=MAPHEIGHT-1){ //si la división es igual a la altura no hay nada debajo (borde del mapa)
                casIzRow = Math.floor(casillaAComprobar/MAPWIDTH)+1;
                casIzCol = casillaAComprobar%MAPWIDTH;
                if(!this.isWall(casIzRow,casIzCol)){
                    if(casillasVisitadas[casIzCol+casIzRow*MAPWIDTH] != 2){
                        casillasAComprobar.push(casIzCol + casIzRow * MAPWIDTH);
                        mapaEstrella[casIzCol + casIzRow * MAPWIDTH] = valorCasilla+1;
                        casillasVisitadas[casIzCol + casIzRow * MAPWIDTH] = 2;
                    }
                }
            }
		}
       /*//tenemos en mapaEstrella el mapa estrella hasta casa de los fantasmas.
		for(var j =0;j<MAPHEIGHT;j++){
			fila = "";
			for(var i=0;i<MAPWIDTH;i++){
				fila = fila + mapaEstrella[j*MAPWIDTH+i] +" ";
			}
			console.log(fila);
        }*/
	}
	this.preDrawMap = function(){
    	var TILE_WIDTH = thisGame.TILE_WIDTH;
    	var TILE_HEIGHT = thisGame.TILE_HEIGHT;
		for(var i=0;i<thisLevel.map.length;i++){
			fila = Math.floor(i/thisLevel.lvlWidth);
			columna = i%thisLevel.lvlWidth;
			tile = thisLevel.getMapTile(fila,columna);
			if(tile==1){//puerta fantasmas
				ctx.beginPath();
				ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT,TILE_WIDTH,TILE_HEIGHT/8);
				ctx.fillStyle = 'blue'; 
			    ctx.fill();  
			    ctx.closePath();
			    ctx.beginPath();
				ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT+TILE_HEIGHT/4,TILE_WIDTH,TILE_HEIGHT/8);
				ctx.fillStyle = 'blue'; 
			    ctx.fill();  
			    ctx.closePath();
			    ctx.beginPath();
				ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT+TILE_HEIGHT/2,TILE_WIDTH,TILE_HEIGHT/8);
				ctx.fillStyle = 'blue'; 
			    ctx.fill();  
			    ctx.closePath();
			    ctx.beginPath();
				ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT+TILE_HEIGHT/4*3,TILE_WIDTH,TILE_HEIGHT/8);
				ctx.fillStyle = 'blue'; 
			    ctx.fill();  
			    ctx.closePath();
			}
			if(tile==21 || tile==20){//teletransporte
				ctx.beginPath();
				ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT,TILE_WIDTH,TILE_HEIGHT);
				ctx.fillStyle = 'black'; 
			    ctx.fill();  
			    ctx.closePath();
			}
		}
	}

    this.drawMap = function(){

    	var TILE_WIDTH = thisGame.TILE_WIDTH;
    	var TILE_HEIGHT = thisGame.TILE_HEIGHT;

		var tileID = {
	    		'door-h' : 20,
			'door-v' : 21,
			'pellet-power' : 3
		};
		var fila;
		var columna;

		for(var i=0;i<thisLevel.map.length;i++){
			thisLevel.powerPelletBlinkTimer+=1;
			if(thisLevel.powerPelletBlinkTimer>60*60*2){thisLevel.powerPelletBlinkTimer=0;}
			fila = Math.floor(i/thisLevel.lvlWidth);
			columna = i%thisLevel.lvlWidth;
			tile = thisLevel.getMapTile(fila,columna);
			switch(tile){
				case "2":{//pellet
					ctx.beginPath();
					ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT,TILE_WIDTH,TILE_HEIGHT);
				    ctx.fillStyle = 'black'; 
				    ctx.fill();  
				    ctx.closePath();

					ctx.beginPath();
					strokeStyle = 'black';
				    ctx.arc(columna*TILE_WIDTH+TILE_WIDTH/2,fila*TILE_HEIGHT+TILE_HEIGHT/2,TILE_HEIGHT/5,0,2*Math.PI,false);
				    ctx.lineWidth = 2;
				    ctx.fillStyle = 'white'; 
				    ctx.fill();  
				    ctx.closePath();
				    break; 
				}
				case "3":{//pellet powah'

					ctx.beginPath();
					ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT,TILE_WIDTH,TILE_HEIGHT);
				    ctx.fillStyle = 'black'; 
				    ctx.fill();  
				    ctx.closePath();

					if(thisLevel.powerPelletBlinkTimer<30*60*2){
						ctx.beginPath();
						strokeStyle = 'black';
					    ctx.arc(columna*TILE_WIDTH+TILE_WIDTH/2,fila*TILE_HEIGHT+TILE_HEIGHT/2,TILE_HEIGHT/4,0,2*Math.PI,false);
					    ctx.lineWidth = 2;
					    ctx.stroke();
					    ctx.fillStyle = 'red'; 
					    ctx.fill();  
					    ctx.closePath();
					}
				    break; 
				}
				case "20":{//"portal" de derecha a izquierda o viceversa
					ctx.fillStyle = "rgba(0,0,0,0)";
					ctx.beginPath();
					ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT,TILE_WIDTH,TILE_HEIGHT);
				    ctx.fill();  
				    ctx.closePath();
					break;
				}
				case "21":{//"portal" de abajo a arriba o viceversa
					ctx.fillStyle = 'rgba(0,0,0,0)';
					ctx.beginPath();
					ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT,TILE_WIDTH,TILE_HEIGHT);
				    ctx.fill();  
				    ctx.closePath();
					break;
				}
				case "0":{//casilla vacia
					ctx.beginPath();
					ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT,TILE_WIDTH,TILE_HEIGHT);
					ctx.fillStyle = "black";//"rgba(0,0,0,0)";
				    ctx.fill();  
				    ctx.closePath();
					break;
				}
				case "1":{//puerta de los fantasmas //se pinta en pre drawMap para quedar por debajo de fantasmas.
					
					ctx.beginPath();
					ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT,TILE_WIDTH,TILE_HEIGHT);
					ctx.fillStyle = 'black'; 
				    ctx.fill();  
				    ctx.closePath();
			
				    break;
				}
				case "10":{//fantasma1   //el flujo baja hasta el código del pacman, en posiciones del pacman y fantasmas pintar baldosa negra.
				}
				case "11":{//fantasma2
				}
				case "12":{//fantasma3
				}
				case "13":{//fantasma4
				}
				case "4":{//pacman
					ctx.beginPath();
					ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT,TILE_WIDTH,TILE_HEIGHT);
					ctx.fillStyle = 'black'; 
				    ctx.fill();  
				    ctx.closePath();
					break;
				}
				default:
					//Resto nros interpretados como pared, (del 100 al 199).
					ctx.beginPath();
					ctx.rect(columna*TILE_WIDTH,fila*TILE_HEIGHT,TILE_WIDTH,TILE_HEIGHT);
					ctx.fillStyle = 'blue'; 
				    ctx.fill();  
				    ctx.closePath();
					break;
				
			}
		}
	};

	this.isWall = function(row, col) { 
		var tile = thisLevel.getMapTile(row,col);
		tile = parseInt(tile, 10);
		var wall = false;
		if(tile>=100 && tile <=199){
			wall = true;
		}
		//if(isNaN(tile)){//fuera del mapa (No nos es necesario)
		//	wall=true;
		//}
		if(tile==11||tile==13){
			wall=true;
		}
		return wall;
	};


	this.checkIfHitWall = function(possiblePlayerX, possiblePlayerY, row, col){
		// Determinar si el jugador va a moverse a una fila,columna que tiene pared 
		var colision = false;
		//se comprueba si hay colisión al moverse normalmente, movimiento rectilíneo uniforme, sin pulsar tecla
		if(row == null && col == null){ 
			columna = Math.floor(possiblePlayerX / thisGame.TILE_WIDTH);
			fila = Math.floor(possiblePlayerY / thisGame.TILE_HEIGHT);
			if(thisLevel.isWall(fila,columna)){
				colision = true;
			}
		}else{
			//codigo para mirar si hay colision al pulsar tecla, row y col solo se pasan si se pulsa tecla
			
			columna = Math.floor(possiblePlayerX / thisGame.TILE_WIDTH); 
			fila = Math.floor(possiblePlayerY / thisGame.TILE_HEIGHT);

			if(thisLevel.isWall(fila,columna)){
				colision = true;
			}else{
				if(columna == col){ //pacman moviendose en eje vertical y se pulsa tecla arriba ó abajo.
					if(possiblePlayerX!=col*thisGame.TILE_WIDTH){//si las coordenadas de la columna a la que se entra no coinciden exactamente colisión.
						colision = true;
					}
				}else{	
					if(fila == row){  //pacman moviendose en eje horizontal y se pulsa tecla derecha o izquierda.
						if(possiblePlayerY!=row*thisGame.TILE_HEIGHT){//si las coordenadas de la fila a la que se entra no coinciden exactamente colisión.
							colision = true;
						}
					}else{	
						console.log("comportamiento inesperado");
						console.log(possiblePlayerX +" , "+possiblePlayerY);
					}

				}
			}
		}
		//Colision con fantasmas se mira en método move.
		return colision;  
	};

	this.checkIfHit = function(playerX, playerY, x, y, holgura){
		// Tu código aquí	
		var proyeccionX = false;
		var proyeccionY = false;
		var hit = false;
		if(Math.abs(playerX - x)<holgura){
			proyeccionX = true;
		}	
		if(Math.abs(playerY - y)<holgura){
			proyeccionY = true;
		}
		if(proyeccionY && proyeccionX){hit = true;}
		return hit;	
	};


	this.checkIfHitSomething = function(playerX, playerY, row, col){
		var tileID = {
    		'door-h' : 20,
			'door-v' : 21,
			'pellet-power' : 3,
			'pellet': 2
		};

		//  Gestiona la recogida de píldoras
		columna = Math.floor(playerX / thisGame.TILE_WIDTH); 
		fila = Math.floor(playerY / thisGame.TILE_HEIGHT);
		//No se hace USO DE ROW Y COL
		if(columna==playerX / thisGame.TILE_WIDTH && fila==playerY / thisGame.TILE_HEIGHT){
			/*igual se puede mejorar, pues no se come la pildora hasta que se está totalmente encima, 
			pero es visualmente igual en todas direcciones*/

			if(thisLevel.getMapTile(fila,columna)=="2"){ 
				thisLevel.setMapTile(fila,columna,"0");
				thisLevel.pellets-=1; 
				player.points+=10;
				pointsContainer.innerHTML = "Puntos: "+player.points;
				if(thisLevel.pellets == 0){
					thisGame.modeTimer = 90;
					thisLevel.pellets = pelletsCargados;
					thisLevel.map = mapaPelletsCargados.slice();
					thisGame.setMode(thisGame.WAIT_TO_START);

				}
			}
		}

		//  Gestiona las puertas teletransportadoras
		if(thisLevel.getMapTile(fila,columna)=="20"){ //|| thisLevel.getMapTile(fila,columna+1)=="20"){  // || para detectar antes puerta lateral derecha. (y pasar el test.)
			if(columna==playerX / thisGame.TILE_WIDTH && fila==playerY / thisGame.TILE_HEIGHT){
				if(getCol(playerX)==0){//"teletransporte" de izquierda a derecha
					player.x = thisLevel.lvlWidth * thisGame.TILE_WIDTH-1-2*thisGame.TILE_WIDTH; //2* para evitar bucle debido a detectar antes puerta lateral derecha.
					player.velX = -GLOBAL_PACMAN_VEL;
				}else{//"teletransporte" de derecha a izquierda
					player.x = 1+thisGame.TILE_WIDTH;
					player.velX = GLOBAL_PACMAN_VEL;
				}
			}
			
		}
		if(thisLevel.getMapTile(fila,columna)=="21"){//|| thisLevel.getMapTile(fila+1,columna)=="21"){ // || para detectar antes puerta inferior. (y pasar el test.)
			if(columna==playerX / thisGame.TILE_WIDTH && fila==playerY / thisGame.TILE_HEIGHT){
				if(getRow(playerY)==0){//"teletransporte" de arriba a abajo
					player.y = thisLevel.lvlHeight* thisGame.TILE_HEIGHT-1-2*thisGame.TILE_HEIGHT; //2* para evitar bucle debido a detectar antes puerta inferior.
					player.velY = -GLOBAL_PACMAN_VEL;
				}else{//"teletransporte" de abajo a arriba

					player.y = 1+thisGame.TILE_HEIGHT;
					player.velY = GLOBAL_PACMAN_VEL;
				}
			}
		}
		// Gestionamos la recogida de píldoras de poder (cambiamos estado de los fantasmas)
		if(thisLevel.getMapTile(fila,columna)=="3"){ 
			thisLevel.setMapTile(fila,columna,"0");
			thisLevel.pellets-=1; //Contamos también las pildoras de poder
			player.points+=10;
			pointsContainer.innerHTML = "Puntos: " +player.points;
			if(thisLevel.pellets == 0){
				thisGame.modeTimer = 90;
				thisLevel.map = mapaPelletsCargados.slice();
				thisLevel.pellets = pelletsCargados;
				thisGame.setMode(thisGame.WAIT_TO_START);
			}
			thisGame.ghostTimer = 360;
			for(var i=0;i<numGhosts;i++){
				if (ghosts[i].state == Ghost.NORMAL){
					ghosts[i].state = Ghost.VULNERABLE;
				}
				
			}
		}
	};
	this.mapaBordes =function(){
		map = [];
		for(var i=0;i<thisLevel.lvlWidth;i++){ //borde superior
			map.push(100);
		}
		for(var i=1;i<thisLevel.lvlHeight-1;i++){
			map.push(100);
			for(var j=1;j<thisLevel.lvlWidth-1;j++){
				map.push(0);
			}
			map.push(100);
		}
		for(var i=0;i<thisLevel.lvlWidth;i++){ //borde inferior
			map.push(100);
		}
		return map;
	}
	this.drawGameOver = function(){
		if(!over){
			over = true;
			thisLevel.map = this.mapaBordes();
			for(var i =0;i<numGhosts;i++){
				ghosts[i].velX=0;
				ghosts[i].velY=-GLOBAL_GHOST_SPEED; //hacia arriba
				ghosts[i].x=ghosts[i].baldosaOrigenX*thisGame.TILE_WIDTH;
				ghosts[i].y=ghosts[i].baldosaOrigenY*thisGame.TILE_HEIGHT;
				ghosts[i].state = Ghost.NORMAL;
			}
			thisGame.ghostTimer = 0;
		}
		ctx.clearRect(0, 0, w, h);
		//ctx.beginPath();
		//ctx.rect(0,0,thisGame.TILE_WIDTH*thisLevel.lvlwidth,thisGame.TILE_HEIGHT*thisLevel.lvlheight);
		//ctx.fillStyle = 'black'; 
	    //ctx.fill();  
	    //ctx.closePath();
		for(var i=0;i<numGhosts;i++){
			ghosts[i].move();
		}
		for(var i=0;i<numGhosts;i++){
			ghosts[i].draw();
		}
		ctx.fillStyle = 'black'; 
		ctx.font = "30px Arial";
		ctx.fillText("Press space to restart!",55,70);
		ctx.font = "25px Arial";
		ctx.fillText("Puntuaciones: ",60,130);
		ctx.font = "20px Arial";
		for(var i=0;i<arrayJug.length;i++){
			ctx.fillText(arrayJug[i].name +" : "+ arrayJug[i].points,70,170+20*i);
		}
	}

	}; // end Level 

	var Pacman = function(id) {
		this.radius = GLOBAL_TILE_SIDE/2-2;
		this.x = 0;
		this.y = 0;
		this.angle1 = 0.25;
		this.angle2 = 1.75;
		this.velX;
		this.velY;
		this.lastDirection = 3;
		this.id = id;
		this.name = id; //de momento
		this.lifes =3;
		this.points =0;
	};
	Pacman.prototype.move = function() {

		var BaldosaWidth = thisGame.TILE_WIDTH;
		var BaldosaHeight = thisGame.TILE_HEIGHT;
		var baldosaX = Math.floor(this.x/BaldosaWidth);
		var baldosaY = Math.floor(this.y/BaldosaHeight);
		var balExacta = false;
		if(baldosaX == this.x/BaldosaWidth && baldosaY == this.y/BaldosaHeight){
			balExacta = true;
		}
		//corregir movimientos izquierda arriba que hacen que se pare, y que se pare.
		if(player.velX>0){ 
			if(thisLevel.checkIfHitWall(player.x+thisGame.TILE_WIDTH+player.velX,player.y)){
				player.velX=0;
				player.velY=0; //opcional, pero evita posibles complicaciones 
				var tilePreWallX = Math.floor((player.x+thisGame.TILE_WIDTH+player.velX)/thisGame.TILE_WIDTH)*thisGame.TILE_WIDTH; //que se pegue a la pared.
				player.x = tilePreWallX; 
			}else{
				player.x=player.x+player.velX;
			}
		}else if(player.velX<0){
			if(thisLevel.checkIfHitWall(player.x+player.velX,player.y)){
				player.velX=0;
				player.velY=0; //opcional, pero evita posibles complicaciones 
				var tilePreWallX = Math.floor((player.x+player.velX)/thisGame.TILE_WIDTH)*thisGame.TILE_WIDTH; //que se pegue a la pared.
				player.x = tilePreWallX; 
			}else{
				player.x=player.x+player.velX;
			}
		}

		//EJE Y
		if(player.velY>0){
			if(thisLevel.checkIfHitWall(player.x,player.y+thisGame.TILE_HEIGHT+player.velY)){
				player.velY=0;
				player.velX=0; //opcional, pero evita posibles complicaciones 
				var tilePreWallY = Math.floor((player.y+thisGame.TILE_HEIGHT+player.velY)/thisGame.TILE_HEIGHT)*thisGame.TILE_HEIGHT; //que se pegue a la pared.
				player.y = tilePreWallY; 
			}else{
				player.y=player.y+player.velY;
			}
		}else if(player.velY<0){
			if(thisLevel.checkIfHitWall(player.x,player.y+player.velY)){
				player.velY=0;
				player.velX=0; //opcional, pero evita posibles complicaciones 
				var tilePreWallY = Math.floor((player.y+player.velY)/thisGame.TILE_HEIGHT)*thisGame.TILE_HEIGHT; //que se pegue a la pared.
				player.y = tilePreWallY; 
			}else{
				player.y=player.y+player.velY;
			}
		}
		//Esto puede parecer redundante pero corrige fallos en movimiento al cambiar tamaño de baldosa del mapa.
		//Se ha hecho igual en movimiento fantasmas.
		var baldosaXNueva = Math.floor(this.x/BaldosaWidth);
		var baldosaYNueva = Math.floor(this.y/BaldosaHeight);
		if( (baldosaXNueva != baldosaX || baldosaYNueva!=baldosaY) && !balExacta){ //al actualizar posición se cambiaria de casilla. ajustar EXACTA a la que deba ser.
			if(this.velX > 0 || this.velY > 0){
				this.x = baldosaXNueva*BaldosaWidth;
				this.y = baldosaYNueva*BaldosaHeight;
			}else{
				if(this.velX < 0 || this.velY < 0){
					this.x = baldosaX*BaldosaWidth;
					this.y = baldosaY*BaldosaHeight;
				}
			}
		}



		// tras actualizar this.x  y  this.y... 
		// check for collisions with other tiles (pellets, etc)
		thisLevel.checkIfHitSomething(this.x, this.y, this.nearestRow, this.nearestCol);
		//Si chocamos contra un fantasma y su estado es Ghost.VULNERABLE cambiamos velocidad fantasma y lo pasamos a modo Ghost.SPECTACLES
		for(var i =0;i<numGhosts;i++){ //comprobamos si hay contacto con los fantasmas.
			if(thisLevel.checkIfHit(player.x,player.y,ghosts[i].x,ghosts[i].y,thisGame.TILE_WIDTH/2)){
				if(ghosts[i].state == Ghost.VULNERABLE){
					ghosts[i].state = Ghost.SPECTACLES;
					if(ghosts[i].velX > 0 ){//actualizamos velocidad X fantasma.
						ghosts[i].velX = GLOBAL_GHOST_VULNERABLE_SPEED;
					}else{
						if(ghosts[i].velX < 0){
							ghosts[i].velX = -GLOBAL_GHOST_VULNERABLE_SPEED;
						}
					}
					if(ghosts[i].velY > 0 ){//actualizamos velocidad Y fantasma.
						ghosts[i].velY = GLOBAL_GHOST_VULNERABLE_SPEED;
					}else{
						if(ghosts[i].velY < 0){
							ghosts[i].velY = -GLOBAL_GHOST_VULNERABLE_SPEED;
						}
					}
				}else{
					if(ghosts[i].state == Ghost.NORMAL){
						if(thisGame.mode != thisGame.HIT_GHOST){
							// Si chocamos contra un fantasma cuando éste esta en estado Ghost.NORMAL --> cambiar el modo de juego a HIT_GHOST
							thisGame.setMode(thisGame.HIT_GHOST);
							if(thisLevel.pellets>0){
								player.lifes--;
							}
							lifesContainer.innerHTML = "Vidas: "+player.lifes;

						}
						
					}
				}
			}
			
		}
	};

	// Función para pintar el Pacman
	Pacman.prototype.draw = function(x, y) {  
	    y = player.y;
	 	x = player.x;
	    r = player.radius; 
	    dx = thisGame.TILE_WIDTH - 2*r; //para centrarlo en el bloque en la coordenada x.
	    dx = dx/2;
	    dy = thisGame.TILE_HEIGHT - 2*r; //para centrarlo en el bloque en la coordenada y.
	    dy = dy/2;
	    ctx.beginPath();
		strokeStyle = 'black';
		if(player.velX!=0||player.velY!=0){
			if(player.velX<0){
				player.lastDirection=1;
			}else{
				if(player.velX>0){
					player.lastDirection=3;
				}else{
					if(player.velY>0){
						player.lastDirection=2;
					}else{
						player.lastDirection=0;
					}
				} 
			}
		}
		switch(player.lastDirection){
			case 0: ctx.arc(x+r+dx,y+r+dy,r,(player.angle1+1.5)*Math.PI,(player.angle2+1.5)*Math.PI,false); ctx.lineTo(x+r+dx,y+r+dy); break; //arriba
			case 1: ctx.arc(x+r+dx,y+r+dy,r,(player.angle1+1)*Math.PI,(player.angle2+1)*Math.PI,false); ctx.lineTo(x+r+dx,y+r+dy); break; //izquierda
			case 2: ctx.arc(x+r+dx,y+r+dy,r,(player.angle1+0.5)*Math.PI,(player.angle2+0.5)*Math.PI,false); ctx.lineTo(x+r+dx,y+r+dy); break; //abajo
			case 3: ctx.arc(x+r+dx,y+r+dy,r,player.angle1*Math.PI,player.angle2*Math.PI,false); ctx.lineTo(x+r+dx,y+r+dy); break; //derecha
		}
	    ctx.closePath();
	    ctx.lineWidth = 4;
	    ctx.stroke();
	    ctx.fillStyle = 'yellow';
	    ctx.fill();      
	    if(player.id==0){//lazo

		    switch(player.lastDirection){
				case 0: 
					ctx.beginPath();ctx.moveTo(x +r/2,y+thisGame.TILE_HEIGHT); ctx.lineTo(x+r/2,y+thisGame.TILE_HEIGHT-r);ctx.lineTo( x+r,y+thisGame.TILE_HEIGHT-r/2); 
					ctx.lineTo(x,y+thisGame.TILE_HEIGHT-r/2);ctx.closePath();ctx.fillStyle = 'red';ctx.fill();break; //arriba
				case 1: 
					ctx.beginPath();ctx.moveTo(x +thisGame.TILE_WIDTH-r/2,y+r); ctx.lineTo(x+thisGame.TILE_WIDTH-r/2,y);ctx.lineTo(x+thisGame.TILE_WIDTH,y+r/2); 
					ctx.lineTo(x+thisGame.TILE_WIDTH-r,y+r/2);ctx.closePath();ctx.fillStyle = 'red';ctx.fill();break; //izquierda
				case 2: 
					ctx.beginPath();ctx.moveTo(x +thisGame.TILE_WIDTH-r/2,y+r); ctx.lineTo(x+thisGame.TILE_WIDTH-r/2,y);ctx.lineTo(x+thisGame.TILE_WIDTH,y+r/2); 
					ctx.lineTo(x+thisGame.TILE_WIDTH-r,y+r/2);ctx.closePath();ctx.fillStyle = 'red';ctx.fill();break; //abajo
				case 3: 
					ctx.beginPath();ctx.moveTo(x +r/2,y+r); ctx.lineTo(x+r/2,y);ctx.lineTo(x,y+r/2); 
					ctx.lineTo(x+r,y+r/2);ctx.closePath();ctx.fillStyle = 'red';ctx.fill();break; //derecha
			}  
		}
    };//end Pacman

	var player = new Pacman(0);
	player.name = localStorage.getItem("pacman_name"); 
	if(player.name==undefined ||player.name ==""){if(player.id==0){player.name = "Mrs. Pacman"}else{player.name = "Pacman"}}
	var arrayJug = [];
	arrayJug.push(player); //TODOTODOTODO
	for (var i=0; i< numGhosts; i++){
		ghosts[i] = new Ghost(i, canvas.getContext("2d"));
	}

	var thisGame = {
		getLevelNum : function(){
			return 0;
		},
	    setMode : function(mode) {
			this.mode = mode;
			if(mode == thisGame.HIT_GHOST){
				thisGame.modeTimer = 90; //90 Frames, 1,5 segundos.
				congelado = false;
			}
		},
		TILE_WIDTH: GLOBAL_TILE_SIDE, 
		TILE_HEIGHT: GLOBAL_TILE_SIDE,
		ghostTimer: 0,
		NORMAL : 1,
		HIT_GHOST : 2,
		GAME_OVER : 3,
		WAIT_TO_START: 4,
		modeTimer: 0,
		pantalla: undefined,
		congelado: false
	};

	

	var measureFPS = function(newTime){
		// la primera ejecución tiene una condición especial

		if(lastTime === undefined) {
			lastTime = newTime; 
			return;
		}
		// calcular el delta entre el frame actual y el anterior
		var diffTime = newTime - lastTime; 

		if (diffTime >= 1000) {

			fps = frameCount;    
			frameCount = 0;
			lastTime = newTime;
		}

		// mostrar los FPS en su capa 
		fpsContainer.innerHTML = 'FPS: ' + fps; 
		frameCount++;
	};

	// clears the canvas content
	var clearCanvas = function() {
		ctx.clearRect(0, 0, w, h);
	};

	
	var getRow = function(y){
		return Math.floor(y/thisGame.TILE_HEIGHT);
	}

	var getCol = function(x){
		return Math.floor(x/thisGame.TILE_WIDTH);
	}
	
	var checkInputs = function(){
		//No se tiene en cuenta el delineado del pacman (stroke)
		//row y col para mirar si se entra demasiado pronto o demasiado tarde por pasillo lateral.
		var velocidadPosible = GLOBAL_PACMAN_VEL;
		if(inputStates["up"] == true){ //miramos si en el lugar donde se va a mover hay muro.
			if(!thisLevel.checkIfHitWall(player.x,player.y-velocidadPosible,getRow(player.y),getCol(player.x))){
				player.velY = -velocidadPosible;
				player.velX = 0;
			}
	    }
	    if(inputStates["down"] == true){
	    	if(!thisLevel.checkIfHitWall(player.x,player.y+thisGame.TILE_HEIGHT+velocidadPosible,getRow(player.y),getCol(player.x))){
	      		if(thisLevel.getMapTile(getRow(player.y+thisGame.TILE_HEIGHT),getCol(player.x))!=1){
	      			player.velY = velocidadPosible;
	      			player.velX = 0;
	      		}
	      		
	      	}
	    }
	    if(inputStates["left"] == true){
	    	if(!thisLevel.checkIfHitWall(player.x-velocidadPosible,player.y,getRow(player.y),getCol(player.x))){
	      		player.velX = -velocidadPosible;
	      		player.velY = 0;
	      	}
	    }
	    if(inputStates["right"] == true){
	    	if(!thisLevel.checkIfHitWall(player.x+thisGame.TILE_WIDTH+velocidadPosible,player.y,getRow(player.y),getCol(player.x))){
	      		player.velX = +velocidadPosible;
	      		player.velY = 0;
	      	}
	    }
	    if(inputStates["espacio"] == true){//"espacio" in inputStates){
			
	    	if(thisGame.mode == thisGame.GAME_OVER){
	    		//thisGame.state = thisGame.WAIT_TO_START;
	    		//thisGame.modeTimer = 90; 
	    		partida();
	    	}
	      //inputStates = {};
	    }
	};
	
    var updateTimers = function(){
        // Actualizamos thisGame.ghostTimer (y el estado de los fantasmas)
	    if(thisGame.ghostTimer>0){ 
			thisGame.ghostTimer--;
			if(thisGame.ghostTimer==0){
				for(var i=0;i<numGhosts;i++){
					if(ghosts[i].state == Ghost.VULNERABLE){
						ghosts[i].state = Ghost.NORMAL;
					}
				}
			}
		}
	    // actualizamos modeTimer
	     if(thisGame.modeTimer>0){ 
			if(thisGame.modeTimer==1){
				thisGame.congelado = false;
				//reset();
				thisGame.setMode(thisGame.NORMAL);
			}else{
				if(thisGame.modeTimer==31){ //30Frames, 0,5 Segundos
					thisGame.congelado = false;
					reset();
					thisGame.setMode(thisGame.WAIT_TO_START);
				}
			}
			thisGame.modeTimer--;
		}
		//if(thisGame.ghostTimer==0){

		//}
    };

    var mainLoop = function(time){
    	//en modo NORMAL
    	measureFPS(time);
    	if(thisGame.mode == thisGame.NORMAL){ 
			//main function, called each frame 
			


			checkInputs();


			// Movemos fantasmas
			for(var i=0;i<numGhosts;i++){
				ghosts[i].move();
			}
			player.move();
		}
		//en modo HIT_GHOST
		if(thisGame.mode == thisGame.HIT_GHOST){ 
			//se debería quedar todo parado durande 1.5 segs.
			

			if(thisGame.congelado == false){
				thisGame.pantalla = ctx.getImageData(0,0,thisGame.TILE_WIDTH*thisLevel.lvlWidth,thisGame.TILE_HEIGHT*thisLevel.lvlHeight);
				thisGame.congelado = true;
			}
			clearCanvas();
			ctx.putImageData(thisGame.pantalla,0,0);
		}
		//en modo WAIT_TO_START
		if(thisGame.mode == thisGame.WAIT_TO_START){

			//se debería mostrar el pacman en su casilla de inicio y los fantasmas en sus posiciones y todo parado durande medio seg.
			if(thisGame.congelado == false){

			
				if(player.lifes==0){
					thisGame.setMode(thisGame.GAME_OVER);
				}else{
					clearCanvas();
					//se ha hecho reset cuando quedan 30 Frames para volver a empezar en updateTimers.
					thisLevel.drawMap();
					player.draw();
					for(var i=0;i<numGhosts;i++){
						ghosts[i].draw();
					}

					thisLevel.preDrawMap();
					thisGame.pantalla = ctx.getImageData(0,0,thisGame.TILE_WIDTH*thisLevel.lvlWidth,thisGame.TILE_HEIGHT*thisLevel.lvlHeight);
					thisGame.congelado = true;
				}
			}
			ctx.putImageData(thisGame.pantalla,0,0);		
		}
		if(thisGame.mode == thisGame.NORMAL){ 
			// Clear the canvas
			clearCanvas();
			thisLevel.drawMap();
			// Pintamos fantasmas
			for(var i=0;i<numGhosts;i++){
				ghosts[i].draw();
			}
			player.draw();
			thisLevel.preDrawMap();
		} 
		checkInputs();
		if(thisGame.mode == thisGame.GAME_OVER){ 
		
			thisLevel.drawGameOver();
			//mostrar puntuacion de jugador(es)
			//comenzar partida de nuevo al pulsar tecla.
		}else{
			updateTimers();
			
		}
		// call the animation loop every 1/60th of second
		requestAnimationFrame(mainLoop);
    };

    var addListeners = function(){
	    //add the listener to the main, window object, and update the states
	    document.addEventListener('keydown', function(event) {
	      if(event.keyCode == 37) {
	      	inputStates = {};
	        inputStates["left"] = true;
	      }
	      else if(event.keyCode == 38) {
	      	inputStates = {};
	        inputStates["up"] = true;
	      }
	      else if(event.keyCode == 39) {
	      	inputStates = {};
	        inputStates["right"] = true;
	      }
	      else if(event.keyCode == 40) {
			inputStates = {};
			inputStates["down"] = true;
	      }
	      else if(event.keyCode == 32) {
	          inputStates["espacio"] = true;
	      }
   		});
    };

    var reset = function(){ //al comenzar nueva vida
		// Inicialmente Pacman se mueve en horizontal hacia la derecha

	    player.x = columnaPac*thisGame.TILE_WIDTH;
		player.y = filaPac*thisGame.TILE_HEIGHT;
		inputStates = {};
		player.velY = 0;
		player.velX = GLOBAL_PACMAN_VEL;

		// Inicializamos los atributos x,y, velX, velY de los fantasmas de forma conveniente
		for(var i =0;i<numGhosts;i++){
			ghosts[i].velX=0;
			ghosts[i].velY=-GLOBAL_GHOST_SPEED; //hacia arriba
			ghosts[i].x=ghosts[i].baldosaOrigenX*thisGame.TILE_WIDTH;
			ghosts[i].y=ghosts[i].baldosaOrigenY*thisGame.TILE_HEIGHT;
			ghosts[i].state = Ghost.NORMAL;
		}
		thisGame.ghostTimer = 0;
	   
    };

    var thisLevel = new Level(canvas.getContext("2d"));
	thisLevel.loadLevel( thisGame.getLevelNum() );

	var partida = function(){ //al comenzar partida
		thisGame.setMode(thisGame.WAIT_TO_START); 
		thisGame.modeTimer = 30; 
		over = false;
		player.points=0;
		reset();
		player.lifes=3;
		lifesContainer.innerHTML = "Vidas: "+player.lifes;
   		pointsContainer.innerHTML = "Puntos: "+player.points;
   		thisLevel.map = mapaPelletsCargados.slice(); //en la primera ejecucion no es necesario, pero si se reinicia la partida si
   		thisLevel.pellets = pelletsCargados;

	}

    var start = function(){ //al cargar página
       	
        canvas.width = thisGame.TILE_WIDTH*tamanoNivelWidth; //trampeado, se debería usar thisLevel.lvlWidth
        canvas.height = thisGame.TILE_HEIGHT*tamanoNivelHeight;
        w = canvas.width; //sólo se usan para borrar canvas.
		h = canvas.height;

		// adds a div for displaying the fps value
        fpsContainer = document.getElementById("fps");// createElement('div');
        lifesContainer = document.getElementById("vidas");
        pointsContainer = document.getElementById("puntuacion");

       	


        //document.body.appendChild(fpsContainer);
		addListeners();
		var reloj = setTimeout(function esperarCargaMapaYLecturaPosPacman(){
			pelletsCargados = thisLevel.pellets;
			mapaPelletsCargados = thisLevel.map.slice();
			
			partida();

			// start the animation
	    	requestAnimationFrame(mainLoop);
	    
	    	thisLevel.cargarMapaEstrella();

		}, 500); 
		/*esperamos a conocer la fila y columna del pacman para establecer 
		sus coordenadas en el método reset, y tras cargar sus coordenadas comenzar el juego.
		Lo mismo para copiar el mapa al comienzo.*/
		
		
		
    };

    //our GameFramework returns a public API visible from outside its scope
    return {
        start: start,
		thisGame: thisGame
    };
};


  var game = new GF();
  game.start();


