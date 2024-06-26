let container = document.querySelector('#container'), controls = document.querySelector('#controls');
let timeSettings = document.querySelector('#time-settings'), resetButton = document.querySelector('#reset');
let turn = 'red', noMoves = -1, frozen = false, gameOver = false;
let vw, vh, containerWidth;
let selectedSquare = null;

//Timer variables
let timeUp = false, timerInitialMinutes = 5, timerInitialSeconds = 0, blueTimerId = null, redTimerId = null;
let centiseconds = { red: 0, blue: 0 }, seconds = { red: timerInitialSeconds, blue: timerInitialSeconds }, minutes = { red: timerInitialMinutes, blue: timerInitialMinutes };
let blueTimer = document.querySelector('#blue-timer'), redTimer = document.querySelector('#red-timer');

blueTimer.children[0].innerText = redTimer.children[0].innerText = `${timerInitialMinutes}:`;
blueTimer.children[1].innerText = redTimer.children[1].innerText = timerInitialSeconds > 9 ? `${timerInitialSeconds}` : `0${timerInitialSeconds}`;

//audios:
let bulletLaunchsfx = new Audio('audio/bullet-launch.mp3');
let ricochetBouncesfx = new Audio('audio/ricochet.mp3');
let canonHitsfx = new Audio('audio/canon-tank.mp3');
let breakSricochetSfx = new Audio('audio/break-sricochet.mp3');
let breakTitanSfx = new Audio('audio/break-titan.mp3');
let mouseClickSfx = new Audio('audio/mouse-click.mp3');
let timerOverSfx = new Audio('audio/timer-alarm.mp3');
let wooshSfx = new Audio('audio/woosh.mp3');

let timings = [], moves = [];
let undoButton = document.querySelector('#undo'), redoButton = document.querySelector('#redo');
//Format of each element of timings:
// {cs: {red: , blue: }, s: {red: , blue: }, m: {red: , blue: }}
let texts = [];
let movesHistory = document.querySelector('#moves-history');

const moveableSquares = [];
const positions = {
    'titanBlue': '',
    'titanRed': '',
    'tankBlue': '',
    'tankRed': '',
    'canonBlue': '',
    'canonRed': '',
    'ricochetBlue': '',
    'ricochetRed': '',
    'sricochetRed': '',
    'sricochetBlue': '',
    'ricochet1Blue': '',
    'ricochet1Red': ''
}

let rotations = {
    'ricochetRed': 0,
    'ricochetBlue': 0,
    'ricochet1Red': 0,
    'ricochet1Blue': 0,
    'sricochetRed': 0,
    'sricochetBlue': 0
}

function pieceNameFromId(id) {
    for (let x in positions) {
        if (positions[x] === id) {
            return x;
        }
    }
    return '';
}

function opponentOf(player) {
    player = player.toLowerCase();
    if (player === 'blue') return 'red';
    else return 'blue';
}

function setContainerSize() {
    let mult = 0.8, multRotate = .05, multControls = 0.275;
    ///800 till 1320
    vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    let vmore = vw, vless = vh;
    if (vw < vh) {
        vmore = vh;
        vless = vw;
    }

    if (800 < vw && vw <= 1320) {

        container.style.width = 0.65 * vless + 'px';
        container.style.height = 0.65 * vless + 'px';
    }
    else {

        container.style.width = mult * vless + 'px';
        container.style.height = mult * vless + 'px';
    }

    if (vw > 1320) {
        controls.classList.add('controls-border');
        controls.style.height = mult * vless + 'px';
        controls.style.width = multControls * vmore + 'px';
    }
    else {
        controls.classList.remove('controls-border');
        controls.style.width = mult * vless + 'px';
        controls.style.height = 0.85 * (vh - mult * vless) + 'px';
    }

    let rotateButtonSide = multRotate * vmore;
    for (let x of document.querySelectorAll('.rotate')) {
        // console.log(x);
        x.style.width = rotateButtonSide + 'px';
        x.style.height = rotateButtonSide + 'px';
    }


    timeSettings.style.height = .9 * rotateButtonSide + 'px';
    containerWidth = container.style.width;

}

setContainerSize();


function addTiles() {
    let alphas = 'abcdefgh';
    for (let i = 8; i >= 1; i--) {
        for (let j = 0; j < 8; j++) {
            let tile = document.createElement('div');
            tile.classList.add('tile');
            tile.setAttribute('id', alphas[j] + String(i));
            if (i % 2 === 0 && j % 2 === 0 || i % 2 && j % 2) tile.classList.add('light-tile');
            else tile.classList.add('dark-tile');
            container.appendChild(tile);
        }
    }
}

function createPiece(type, Alt = null) {
    //ACCEPTS PIECENAME LIKE 'sriccohetBlue' RETURNS IMG
    let piece = document.createElement('img');
    piece.src = `images/${type}.png`;
    piece.alt = (Alt) ? Alt : type;
    piece.classList.add('piece');
    if (type.indexOf('ricochet') === -1) {
        if (type.indexOf('Red') !== -1) piece.classList.add('red-piece');
        else piece.classList.add('blue-piece');
    }
    return piece;
}

function movePiece(piece, to) {
    //Piece is the IMAGE

    let square = document.querySelector(`#${to}`);
    square.append(piece);
    positions[piece.alt] = to;
}

function divOfId(id) {
    return document.querySelector(`#${id}`);
}


addTiles();

window.addEventListener('resize', setContainerSize);

function destroyPiece(div) {
    // console.log(div, 'destroyed');
    if (div.children[0].alt.indexOf('sricochet') !== -1) breakSricochetSfx.play();
    else if (div.children[0].alt.indexOf('titan') !== -1) breakTitanSfx.play();
    let intervalId = setInterval(() => {
        div.classList.remove('destroyed-tile-dark');
        div.classList.add('destroyed-tile-light');
        setTimeout(() => {
            div.classList.remove('destroyed-tile-light');
            div.classList.add('destroyed-tile-dark');

        }, 50);

    }, 100);

    setTimeout(() => {
        clearInterval(intervalId);
        setTimeout(() => {
            let pieceName = div.children[0].alt;
            delete positions[pieceName];
            div.children[0].remove();
            div.classList.remove('destroyed-tile-dark');

        }, 100);

    }, 500);
}

function randInt8() {
    return Math.floor(Math.random() * 8) + 1;
}

function setBoard(preset = null) {
    let pieces = document.querySelectorAll('.piece'), aPiece;

    for (aPiece of pieces) aPiece.remove();

    // aPiece = createPiece('tankRed');
    // movePiece(aPiece, 'c7');
    // aPiece = createPiece('tankBlue');
    // movePiece(aPiece, 'c2');
    // aPiece = createPiece('titanBlue');
    // movePiece(aPiece, 'd1');
    // aPiece = createPiece('titanRed');
    // movePiece(aPiece, 'd8');
    // aPiece = createPiece('canonRed');
    // movePiece(aPiece, 'e8');
    // aPiece = createPiece('canonBlue');
    // movePiece(aPiece, 'e1');
    // aPiece = createPiece('ricochetRed');
    // movePiece(aPiece, 'e7');
    // aPiece = createPiece('ricochetBlue');
    // movePiece(aPiece, 'e2');
    // aPiece = createPiece('sricochetRed');
    // movePiece(aPiece, 'd6');
    // aPiece = createPiece('sricochetBlue');
    // movePiece(aPiece, 'd3');
    // rotations['sricochetBlue'] = 180;
    // let temp = document.querySelector('#d3').children[0];
    // temp.classList.add('sricochet-180');
    // aPiece = createPiece('ricochetRed', 'ricochet1Red');
    // movePiece(aPiece, 'f6');
    // aPiece = createPiece('ricochetBlue', 'ricochet1Blue');
    // movePiece(aPiece, 'f3');

    let setPositions;

    if (preset) {
        setPositions = preset;
    }

    else {
        setPositions = {
            'titanBlue': '',
            'titanRed': '',
            'tankBlue': '',
            'tankRed': '',
            'canonBlue': '',
            'canonRed': '',
            'ricochetBlue': '',
            'ricochetRed': '',
            'sricochetRed': '',
            'sricochetBlue': '',
            'ricochet1Blue': '',
            'ricochet1Red': ''
        }

        let temp, alphas = 'abcdefgh';

        //Spawning titan and canon in middle

        setPositions['titanBlue'] = alphas[Math.floor(Math.random() * 4) + 2] + '1';
        setPositions['titanRed'] = setPositions['titanBlue'][0] + '8';

        do {
            setPositions['canonBlue'] = alphas[Math.floor(Math.random() * 4) + 2] + '1';
        } while (setPositions['canonBlue'][0] === setPositions['titanBlue'][0]);
        setPositions['canonRed'] = setPositions['canonBlue'][0] + '8';

        //Spawn tanks columns b to e to increase chance of allowing bullets to go through them
        setPositions['tankBlue'] = alphas[Math.floor(Math.random() * 4) + 1] + '2';
        setPositions['tankRed'] = setPositions['tankBlue'][0] + '7';

        //No ricochets in extreme columns

        let blueRicochets = ['ricochetBlue', 'sricochetBlue', 'ricochet1Blue'];
        for (let x of blueRicochets) {
            do {
                temp = alphas[Math.floor(Math.random() * 6) + 1] + String(Math.floor(Math.random() * 2) + 2);
            } while (Object.values(setPositions).includes(temp));
            setPositions[x] = temp;
        }

        let redRicochets = ['ricochetRed', 'sricochetRed', 'ricochet1Red'];
        for (let i in redRicochets) {
            let x = redRicochets[i];
            setPositions[x] = setPositions[blueRicochets[i]][0] + String(9 - parseInt(setPositions[blueRicochets[i]][1]));
        }
    }


    for (let i in setPositions) {
        if (i === 'ricochet1Blue') aPiece = createPiece('ricochetBlue', 'ricochet1Blue');
        else if (i === 'ricochet1Red') aPiece = createPiece('ricochetRed', 'ricochet1Red');
        else aPiece = createPiece(i);
        movePiece(aPiece, setPositions[i]);
    }

    temp = document.querySelector(`#${setPositions['sricochetBlue']}`).children[0];
    temp.classList.add('sricochet-180');
    rotations['sricochetBlue'] = 180;

    turn = 'red';
    noMoves = -1;

    establishTurn(undoing = false, redoing = false); //Makes it blues turn
}

setBoard();

resumeTimer('blue');

resetButton.addEventListener('click', () => {
    mouseClickSfx.play();
    let loading = document.querySelector('#loading');
    loading.innerText = 'LOADING...';
    frozen = true;
    moves = [];
    timings = [];
    texts = [];
    movesHistory.innerText = '';
    resetTimer();

    setTimeout(() => {

        frozen = false;
        gameOver = false;
        let text = document.querySelector('#winner');
        text.innerText = '';
        text.classList.remove(`red-won`);
        text.classList.remove(`blue-won`);
        setBoard();
        loading.innerText = '';
        resumeTimer('blue');
    }, 2500);


});

/*
Moving a piece involves:
1. Highlighting that square
2. Different highlight for moveable squares
3. Wait for user to click
a. User clicks same square: continue
b. User clicks moveable square: remove highlight from current square. move; 
c. User clicks on another piece: remove highlight from curSquare, Do This process for that new piece
d. Elsewhere: remove highlight from curSquare
*/


let body = document.querySelector('body');
body.addEventListener('click', handleClick);

function handleClick(e) {
    // console.dir(e.target);
    let id = e.target.id;
    let positionsValues = Object.values(positions);
    let ogSquare = null;

    if (selectedSquare !== null) {
        ogSquare = selectedSquare;
        unSelectSquare(selectedSquare);
        selectedSquare = null;
    }

    if (positionsValues.includes(id) && id !== null) {

        selectedSquare = divOfId(id);
    }
    else if (e.target.classList.contains('piece')) {
        selectedSquare = divOfId(e.target.parentElement.id);
    }
    // In both the above 2 cases, This time, the user clicked on a piece
    else {
        //This time user didn't click on a piece
        if (ogSquare !== null && e.target.classList.contains('moveable-tile')) {
            //Earlier user clicked on a piece
            movePiece(ogSquare.children[0], e.target.id);
            pauseTimer(turn);

            if (!e.detail.redoing){
                moves = moves.slice(0, noMoves);
                moves.push(`0+${ogSquare.id}+${e.target.id}++`);
                registerTime();
                establishTurn(undoing = false, redoing = false);
                // bullet motion takes max 1s (5 bounces), board change of turn name takes 2s
                setTimeout(()=>{
                    updateTexts();
                }, 1500);
            }
            
            else{
                
                establishTurn(undoing=false, redoing=true);
            }
        }
        removeMoveableSquares();
        toggleAllowRotation(selectedSquare);
        return;
    }

    let specialCase = false;
    if (selectedSquare.classList.contains('moveable-tile')) specialCase = true;

    //If the selected square is not the turn's piece OR the board is frozen donot select it
    // if (selectedSquare.children[0].alt.toLowerCase().indexOf(turn) === -1 || frozen) {
    //     selectedSquare = null;
    // }
    ///IF FROZEN: NULL ALWAYS; ELSE:
    // IF SPECIAL CASE: NO NULL ALWAYS
    // ELSE: IF OUR PIECE, NO NULL ELSE NULL

    if (frozen) selectedSquare = null;
    else if (!specialCase) {
        if (selectedSquare.children[0].alt.toLowerCase().indexOf(turn) === -1) selectedSquare = null;
    }

    //User has currently clicked on a piece, but it may not be accepted due to it not being their turn

    removeMoveableSquares();
    if (selectedSquare !== null) {
        let pieceName = (ogSquare !== null) ? pieceNameFromId(ogSquare.id) : null;

        if (pieceName !== null && pieceName.indexOf('ricochet') === 0 && specialCase) {
            let piece1 = selectedSquare.children[0];

            movePiece(ogSquare.children[0], selectedSquare.id);
            movePiece(piece1, ogSquare.id);
            pauseTimer(turn);

            if (!e.detail.redoing){
                //Normal: not redoing
                moves = moves.slice(0, noMoves);
                moves.push(`0+${ogSquare.id}+${selectedSquare.id}+swap+`);
                setTimeout(()=>{
                    updateTexts();
                }, 1500);

                registerTime();
                establishTurn(undoing = false, redoing = false);
            }
            //Redoing:
            else establishTurn(undoing = false, redoing = true);
        }
        else {

            selectSquare(selectedSquare);
            showMoveableSquares(selectedSquare);
            toggleAllowRotation(selectedSquare);
        }
    }
}


function selectSquare(square) {
    if (square.classList.contains('light-tile')) square.classList.add('highlighted-light-tile');
    else square.classList.add('highlighted-dark-tile')
}

function unSelectSquare(square) {
    square.classList.remove('highlighted-light-tile');
    square.classList.remove('highlighted-dark-tile');

}

function showMoveableSquares(square) {
    let s = 'abcdefgh', id = square.id;
    let x = s.indexOf(id[0]) + 1, y = parseInt(id[1]);
    for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {

            if (1 <= i && i <= 8 && 1 <= j && j <= 8 && (i != x || j != y)) {

                let pieceName = square.children[0].alt; //The piece being clicked
                let id = s[i - 1] + String(j);          // The id of the possibly moveable square

                if (pieceName.indexOf('ricochet') !== -1 && pieceName.indexOf('sricochet') === -1) {
                    if (pieceNameFromId(id).indexOf('titan') !== -1) continue;
                    else if (pieceNameFromId(id).indexOf('canon') !== -1 && j !== y) continue;

                }
                else {

                    if (Object.values(positions).includes(id) && id !== null) continue;

                    if (pieceName.indexOf('canon') !== -1) {
                        if (y == j) {
                            let sq = divOfId(id);
                            sq.classList.add('moveable-tile');
                            moveableSquares.push(id);
                        }
                        continue;
                    }
                }

                let sq = divOfId(id);
                sq.classList.add('moveable-tile');
                moveableSquares.push(id);
            }
        }
    }
}

function removeMoveableSquares() {
    for (let id of moveableSquares) {
        let sq = divOfId(id);
        sq.classList.remove('moveable-tile');
    }
    moveableSquares.length = 0;
}

let lrotate = document.querySelector('.rotate.left');
let rrotate = document.querySelector('.rotate.right');
lrotate.addEventListener('click', rotate);
rrotate.addEventListener('click', rotate);

function rotate(event) {
    let redoing;
    // console.log(event.detail.redoing);
    if (event.detail.redoing){
        redoing = true;
    }
    if (selectedSquare !== null && selectedSquare.children.length > 0) {

        moves = moves.slice(0, noMoves);

        let img = selectedSquare.children[0];
        let altText = img.alt;
        if (altText.indexOf('ricochet') === -1) return;
        if (altText.indexOf('sricochet') !== -1) {
            img.classList.remove(`sricochet-${rotations[altText]}`);

            if (event.target.classList.contains('left') || event.target.parentElement.classList.contains('left')){
                rotations[altText] += 270;

                if (!redoing) moves.push(`2+${selectedSquare.id}+++`);
            }
            else{
                rotations[altText] += 90;

                if (!redoing) moves.push(`1+${selectedSquare.id}+++`);
            }

            rotations[altText] %= 360;
            img.classList.add(`sricochet-${rotations[altText]}`);
        }
        else {
            img.classList.toggle('ricochet-90');
            moves.push(`1+${selectedSquare.id}+++`);
        }
        pauseTimer(turn);
        
        if (!redoing){
            setTimeout(()=>{
                updateTexts();
            }, 1500);
            registerTime();
            establishTurn(undoing = false, redoing = false);
        }
        else establishTurn(undoing = false, redoing = true);
    }
}

function toggleAllowRotation(square) {
    if (square !== null && square.children[0].alt.indexOf('ricochet') !== -1) {
        lrotate.classList.remove('left-blocked');
        rrotate.classList.remove('right-blocked');
        lrotate.classList.add('left-hover');
        rrotate.classList.add('right-hover');
    }
    else {
        lrotate.classList.add('left-blocked');
        rrotate.classList.add('right-blocked');
        lrotate.classList.remove('left-hover');
        rrotate.classList.remove('right-hover');
    }
}

toggleAllowRotation(null);
setContainerSize();

//! IMPLEMENT ROTATION OF SCREEN PER TURN:
/*
Rotate container
Rotate each non-ricochet piece
That's it!!!
*/


function establishTurn(undoing = false, redoing = false) {
    noMoves++;
    frozen = true;
    let waitTime = 2000, ogTurn = turn;
    if (noMoves === 0) waitTime = 0;

    if (undoing) {
        waitTime = 0;
        noMoves -= 2;
    }

    if (turn === 'red') turn = 'blue';
    else turn = 'red';

    // pauseTimer(ogTurn);

    setTimeout(() => {
        if (gameOver) return;
        let text = document.querySelector('#controls h2 span');
        if (ogTurn === 'red') {
            text.innerText = 'BLUE';
            text.classList.remove('reds-turn');
            text.classList.add('blues-turn');
            // turn = 'blue';
            container.classList.remove('rotate-container');
        }
        else {
            text.innerText = 'RED';
            text.classList.remove('blues-turn');
            text.classList.add('reds-turn');
            // turn = 'red';
            container.classList.add('rotate-container');
        }

        let pieces = document.querySelectorAll('.piece');

        for (let piece of pieces) {
            if (piece.alt.toLowerCase().indexOf(turn) === -1) {
                piece.classList.add('block-piece');
                piece.parentElement.classList.add('block-piece');
            }
            else {
                piece.classList.remove('block-piece');
                piece.parentElement.classList.remove('block-piece');
            }
        }

        for (let piece of pieces) {
            if (piece.alt.indexOf('ricochet') !== -1) continue;

            else if (piece.alt.indexOf('tank') !== -1) {
                if (turn === 'red') piece.classList.add('tank-rotateX');
                else piece.classList.remove('tank-rotateX');

            }
            else {
                if (turn === 'red') piece.classList.add('rotate-piece');
                else piece.classList.remove('rotate-piece');

            }
        }
        frozen = false;
        // let otherTurn = 'red';
        // if (turn ==='red') otherTurn = 'blue';
        // if (waitTime!==0) resumeTimer(otherTurn);
        // console.log(turn);
        resumeTimer(turn);

    }, waitTime);

    if (noMoves > 0 && !undoing) {
        //Temporary freeze all pieces:

        let pieces = document.querySelectorAll('.piece');

        for (let piece of pieces) {
            piece.classList.add('block-piece');
            piece.parentElement.classList.add('block-piece');
        }

        shootBullet(redoing = redoing);
    }


}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function endGame(winner = null) {

    if (!winner) console.error('No winner provided');
    let text = document.querySelector('#winner');
    text.innerText = `${capitalize(winner)} WINS!!!`;
    text.classList.add(`${winner}-won`);
    frozen = true;
    gameOver = true;

    if (minutes[turn] === -1) {
        if (turn === 'blue') {

            blueTimer.children[0].innerText = '0:';
            blueTimer.children[1].innerText = '00';
            return;
        }
        redTimer.children[0].innerText = '0:';
        redTimer.children[1].innerText = '00';
    }
}

function createBullet() {
    let opp = 'red';
    if (turn === 'red') opp = 'blue';

    let canon = document.querySelector(`#${positions[`canon${capitalize(opp)}`]}`);
    let bullet = document.createElement('img');
    // let canon = document.querySelector('#a4');
    bullet.src = 'images/bullet.png';
    bullet.alt = 'bullet';
    bullet.style.width = bullet.style.height = 0.07 * parseInt(containerWidth) + 'px';

    /*
    how to figure out the left: vaulue of bulletContainer in css:
    1. Eg: 0.07*parseInt(containerWidth) 
    2. This is same as saying 0.07*8*box height. That is, the bullet's width is 56% box width.
    3. hence, left value in percentage = 50 - (1/2)56 = 22% of box width
    */
    //original: bullet.style.width = bullet.style.height = 0.035 * parseInt(containerWidth) + 'px'; 

    bullet.style.zIndex = '1';
    bullet.classList.add('bullet');
    if (turn === 'blue') bullet.classList.add('bullet-180deg');

    let bulletContainer = document.createElement('div');
    bulletContainer.classList.add('bullet-container')
    bulletContainer.append(bullet);
    canon.prepend(bulletContainer);
    // bullet.style.left = ((1/16)*parseInt(container.style.width) - (1/2)*parseInt(bullet.style.width)) + 'px'; 
    //Because x.style.width returns '100px' for example
    return [bullet, bulletContainer];
}



function getNeighbours(specialId = null) {

    const neighbours = {
        left: { piece: '', distance: 0 },
        top: { piece: '', distance: 0 },
        right: { piece: '', distance: 0 },
        bottom: { piece: '', distance: 0 }
    }

    let opp = 'red', alphas = 'abcdefgh', curId, pos;
    if (turn === 'red') opp = 'blue';

    if (specialId === null) curId = positions[`canon${capitalize(opp)}`];
    else curId = specialId;

    for (pieceName in positions) {
        pos = positions[pieceName];
        if (pos !== curId) {

            if (pos[0] === curId[0]) {
                if (pos[1] > curId[1]) {
                    if (neighbours.top.piece === '') {
                        neighbours.top.piece = pieceName;
                        neighbours.top.distance = parseInt(pos[1]) - parseInt(curId[1]);
                    }
                    else if (neighbours.top.distance > parseInt(pos[1]) - parseInt(curId[1])) {
                        neighbours.top.piece = pieceName;
                        neighbours.top.distance = parseInt(pos[1]) - parseInt(curId[1]);
                    }
                }
                else {
                    if (neighbours.bottom.piece === '') {
                        neighbours.bottom.piece = pieceName;
                        neighbours.bottom.distance = parseInt(curId[1]) - parseInt(pos[1]);
                    }
                    else if (neighbours.bottom.distance > parseInt(curId[1]) - parseInt(pos[1])) {
                        neighbours.bottom.piece = pieceName;
                        neighbours.bottom.distance = parseInt(curId[1]) - parseInt(pos[1]);
                    }
                }
            }
            if (pos[1] === curId[1]) {
                if (pos[0] > curId[0]) {
                    if (neighbours.right.piece === '') {
                        neighbours.right.piece = pieceName;
                        neighbours.right.distance = alphas.indexOf(pos[0]) - alphas.indexOf(curId[0]);
                    }
                    else if (neighbours.right.distance > alphas.indexOf(pos[0]) - alphas.indexOf(curId[0])) {
                        neighbours.right.piece = pieceName;
                        neighbours.right.distance = alphas.indexOf(pos[0]) - alphas.indexOf(curId[0]);
                    }
                }
                else {
                    if (neighbours.left.piece === '') {
                        neighbours.left.piece = pieceName;
                        neighbours.left.distance = alphas.indexOf(curId[0]) - alphas.indexOf(pos[0]);
                    }
                    else if (neighbours.left.distance > alphas.indexOf(curId[0]) - alphas.indexOf(pos[0])) {
                        neighbours.left.piece = pieceName;
                        neighbours.left.distance = alphas.indexOf(curId[0]) - alphas.indexOf(pos[0]);
                    }
                }
            }
        }

    }
    // console.log(neighbours);
    return neighbours;
}

function move(bullet, direction, blocks, duration) {

    if (direction === 'top' || direction === 'bottom') {
        bullet.style.transition = `top ${duration}s ease-in-out`;
    }

    else if (direction === 'left' || direction === 'right') {
        bullet.style.transition = `left ${duration}s ease-in-out`;

    }

    let distance = blocks * parseInt(containerWidth) * (1 / 8);
    // if (direction ==='left' || direction === 'right') distance = (blocks) * parseInt(containerWidth) * (1 / 8);
    // else distance = (blocks - .5) * parseInt(containerWidth) * (1 / 8);

    setTimeout(() => {
        if (direction === 'top') bullet.style.top = (parseInt(bullet.style.top) - distance) + 'px';
        else if (direction === 'bottom') bullet.style.top = (parseInt(bullet.style.top) + distance) + 'px';
        else if (direction === 'left') {
            bullet.style.left = (parseInt(bullet.style.left) - distance) + 'px';
            // console.log('left');
        }
        else if (direction === 'right') {
            bullet.style.left = (parseInt(bullet.style.left) + distance) + 'px';
            // console.log('right');
        }

    }, 1);

}

function moveBullet(bullet, direction, specialId = null, redoing = false) {


    let neighbours, movementTime = .2;
    if (specialId) {
        neighbours = getNeighbours(specialId);
        movementTime = .2;
        ricochetBouncesfx.play();
    }
    else neighbours = getNeighbours();

    let blocks = neighbours[direction].distance;
    let hitPiece = neighbours[direction].piece;
    if (hitPiece === '') {
        blocks = 30;
        movementTime = .58;
    }
    // console.log('dirc:', direction, 'blocks:', blocks, 'hitPiece:', hitPiece);
    move(bullet, direction, blocks, movementTime);

    /*
    HANDLING moveBullet:
    CASES:
    Case 1: No piece - go till end, remove
    Case 2: Tank/Canon - go till piece, remove
    Case 3: Titan - go till piece, end game
    Case 4: Ricochet/sricochet - go till piece, rotate accordingly, loop
        Case 4a. sricochet - side area: destroy sricochet
    */
    //? HANDLING COLLISION:

    let dirToDeg = { left: 270, top: 0, right: 90, bottom: 180 };

    if (hitPiece.indexOf('titan') !== -1) {
        if (!redoing) moves[moves.length - 1] +=  `${hitPiece}-${positions[hitPiece]}`;
        destroyPiece(divOfId(positions[hitPiece]));
        endGame(opponentOf(hitPiece.slice(5)));
        saveGame();
    }
    // hitPiece eg: tankBlue, titanRed, etc.

    else if (hitPiece.indexOf('sricochet') !== -1) {
        let div = document.querySelector(`#${positions[hitPiece]}`);
        let img = div.children[0];
        let id = positions[hitPiece];
        let orientation = 'top-left'; //0 degrees
        if (img.classList.contains('sricochet-90')) orientation = 'top-right';
        else if (img.classList.contains('sricochet-180')) orientation = 'bottom-right';
        else if (img.classList.contains('sricochet-270')) orientation = 'bottom-left';
        let changedDirection = {};

        setTimeout(() => {
            if (orientation === 'top-left') {
                changedDirection = { left: 'bottom', top: 'right', right: '', bottom: '' };
            }
            else if (orientation === 'top-right') {
                changedDirection = { left: '', top: 'left', right: 'bottom', bottom: '' };
            }
            else if (orientation === 'bottom-right') {
                changedDirection = { left: '', top: '', right: 'top', bottom: 'left' };
            }
            else if (orientation === 'bottom-left') {
                changedDirection = { left: 'top', top: '', right: '', bottom: 'right' };
            }
            if (changedDirection[direction]) {
                for (let x of Object.values(dirToDeg)) {
                    bullet.classList.remove(`bullet-${x}deg`);
                }
                bullet.classList.add(`bullet-${dirToDeg[changedDirection[direction]]}deg`);
                moveBullet(bullet, changedDirection[direction], id);
            }
            else{
                if (!redoing){
                    moves[moves.length - 1] +=  `${hitPiece}-${positions[hitPiece]}`;
                }
                destroyPiece(divOfId(id));
            }

        }, movementTime * 1000);
    }

    else if (hitPiece.indexOf('ricochet') !== -1) {
        let div = document.querySelector(`#${positions[hitPiece]}`);
        let img = div.children[0];
        let id = positions[hitPiece];
        //hitPiece is piece name like 'ricochet'...
        let isRight = true;
        if (img.classList.contains('ricochet-90')) isRight = false;
        let changedDirection = {};

        setTimeout(() => {
            if (isRight) {
                changedDirection = { left: 'bottom', top: 'right', right: 'top', bottom: 'left' };

            }
            else {
                changedDirection = { left: 'top', top: 'left', bottom: 'right', right: 'bottom' }

            }
            for (let x of Object.values(dirToDeg)) {
                bullet.classList.remove(`bullet-${x}deg`);
            }
            bullet.classList.add(`bullet-${dirToDeg[changedDirection[direction]]}deg`);
            moveBullet(bullet, changedDirection[direction], id);

        }, movementTime * 1000);

    }
    else if (hitPiece.indexOf('canon') !== -1) {
        setTimeout(() => {
            canonHitsfx.play()
        }, movementTime * 1000 - 50);


    }

    else if (hitPiece.indexOf('tank') !== -1) {
        if (direction === 'left') {
            setTimeout(() => {
                wooshSfx.play();
                moveBullet(bullet, 'left', positions[hitPiece]);
            }, movementTime * 1000);
        }
        else setTimeout(() => canonHitsfx.play(), movementTime * 1000 - 50);
    }

}

function shootBullet(redoing = false) {
    let [bullet, bulletContainer] = createBullet();

    bullet.style.top = ((1 / 16) * parseInt(containerWidth) - (1 / 2) * parseInt(bullet.style.width)) + 'px';

    if (bullet.style.left === '') bullet.style.left = 0;
    else bullet.style.left = parseInt(bullet.style.left) + 'px';

    bulletLaunchsfx.play();
    setTimeout(() => {
        if (turn === 'blue') moveBullet(bullet, 'bottom', null, redoing = redoing);
        else moveBullet(bullet, 'top', null, redoing = redoing);

    }, 1);
    //Note: The max time moveBullet() could take to execute is about


    setTimeout(() => {
        bullet.remove();
        bulletContainer.remove();
    }, 1900);

}

function resumeTimer(color) {
    //First kill the current setInterval, otherwise timer would run fast
    pauseTimer(color);
    if (color === 'red') {
        redTimerId = setInterval(() => {
            updateTimer('red');
        }, 10)

    }
    else {
        blueTimerId = setInterval(() => {
            updateTimer('blue');
        }, 10)

    }
}

function pauseTimer(color) {
    if (color === 'red') clearInterval(redTimerId);
    else clearInterval(blueTimerId);
}
//Format of each element of timings:
// {cs: {red: , blue: }, s: {red: , blue: }, m: {red: , blue: }}

function resetTimer(timing) {
    let finalTiming = {cs: {red: 0, blue:0}, s:{red: timerInitialSeconds, blue: timerInitialSeconds}, m: {red: timerInitialMinutes, blue: timerInitialMinutes}};
    if (timing) finalTiming = timing;

    clearInterval(redTimerId);
    clearInterval(blueTimerId);

    centiseconds.red = finalTiming.cs.red;
    centiseconds.blue = finalTiming.cs.blue;
    seconds.red = finalTiming.s.red;
    seconds.blue = finalTiming.s.blue;
    minutes.red = finalTiming.m.red;
    minutes.blue = finalTiming.m.blue;

    blueTimer.children[0].innerText = `${minutes.blue}:`;
    blueTimer.children[1].innerText = seconds.blue > 9 ? `${seconds.blue}` : `0${seconds.blue}`;
    redTimer.children[0].innerText = `${minutes.red}:`;
    redTimer.children[1].innerText = seconds.red > 9 ? `${seconds.red}` : `0${seconds.red}`;
}

function updateTimer(color) {

    let whichTimer;
    if (color === 'blue') whichTimer = blueTimer;
    else whichTimer = redTimer;

    centiseconds[color]--;
    if (centiseconds[color] === -1) {
        centiseconds[color] = 99;
        seconds[color]--;
    }
    if (seconds[color] === -1) {
        seconds[color] = 59;
        minutes[color]--;
    }
    if (minutes[color] === -1) {
        if (color === 'blue') clearInterval(blueTimerId);
        else clearInterval(redTimerId);
        timerOverSfx.play();
        endGame(opponentOf(turn));
        return;
    }


    whichTimer.children[0].innerText = `${minutes[color]}:`;
    whichTimer.children[1].innerText = (seconds[color] > 9) ? seconds[color] : `0${seconds[color]}`;

}

function registerTime(){
    timings.push({cs:{red: centiseconds.red, blue: centiseconds.blue}, s: {red: seconds.red, blue: seconds.blue}, m: {red: minutes.red, blue: minutes.blue}});
}

let resumeButton = document.querySelector('#resume'), pauseButton = document.querySelector('#pause');

resumeButton.addEventListener('click', () => {
    resumeTimer(turn);
});

pauseButton.addEventListener('click', () => {
    pauseTimer('red');
    pauseTimer('blue');
});

/*
undo-redo system idea

1.Each motion is written using a code
(for time, maybe store time after each move in a list)

(NameColorRotation) + ?from + ?to  + ?swapNameColor + ?destroyNameColorPosition
where from and to are excluded for rotation | swapNameColor is the piece to be swapped with (ricochet) | destroyNameColor is the piece which was destroyed as a result of this move

['titan': 'K', 'tank': 'T', 'canon': 'C', 'ricochet': 'R', 'sricochet': 'S', 'ricochet1': 'r']

Color: B or R
Change in Rotation: [1: 0, 2: 90, 3: -90]

Eg: Move blue tank from g2 to g3
s1 = TB1+g2+g3+
So that s1.split() gives ['TB1', 'g2', 'g3', '']

How to redo s1: (So we assume same initial position)
    a. movePiece('tankBlue', 'g3')  

How to undo s1:
    movePiece('tankBlue', 'g2')

Eg: Clkwise Rotate blue ricochet in e3
s2 = RB2+++


*/

// function undo(move) {
    //     move = move.split('+');
    //     // const values = {'titan': 'K', 'tank': 'T', 'canon': 'C', 'ricochet': 'R', 'sricochet': 'S', 'ricochet1': 'r'}
    //     const vals = { 'K': 'titan', 'T': 'tank', 'C': 'canon', 'R': 'ricochet', 'r': 'ricochet1', 'S': 'sricochet' }
    //     let from = move[1], to = move[2];
    //     let piece = divOfId(to).children[0];
    //     //piece is the image
    //     console.log(move);
    //     movePiece(piece, from);
    //     pauseTimer(turn);
    //     establishTurn(true);
    //     //Handle plain movement of a piece:
    //     // 1. move back the piece 
    //     // !2. Handle timer (note that establishTurn has function resumeTimer(turn);)
    //     //3. Handle establishTurn();
    // }
    
    // new:
    // . Rotation + from + ?to  + ?swap + ?destroyNameColor-Position
//move = [rotation, from, to, swap, destroy]
//! from is compulsory
// Rotation: [0:0, 1: 90, 2: -90]
//swap is left empty for no swap, and any truthy value for swap
//format for destroy: Eg: titanRed-g3, sricochetBlue-a4

function undo(moveNo){
    if (moveNo===0) return false;
    moveNo--; // To get the index
    let move = moves[moveNo];
    let [rotation, from, to, swap, destroy] = move.split('+');

    if (destroy){
        let [piece, id] = destroy.split('-');
        let img = createPiece(piece);
        movePiece(img, id);
        if (piece.indexOf('sricochet')!==-1){
            //As the rotations list isn't modified when a piece is destroyed
            img.classList.add(`sricochet-${rotations[piece]}`);
        }
    }

    if (rotation=== '0'){
        //Movement
        let piece = divOfId(to).children[0], swapPiece;

        if (swap) {
            swapPiece = divOfId(from).children[0];
        }

        movePiece(piece, from);

        if (swap) movePiece(swapPiece, to);
    }
    
    else{
        //Rotation
        let img = divOfId(from).children[0];
        let piece = img.alt, isSricochet=false;

        if (piece.indexOf('sricochet')!==-1) isSricochet = true;

        if (isSricochet){
            img.classList.remove(`sricochet-${rotations[piece]}`);
        

            if (rotation === '1'){
                rotations[piece] += 270;
            }

            else if (rotation === '2'){
                rotations[piece] += 90;
            }
            rotations[piece] %= 360;

            img.classList.add(`sricochet-${rotations[piece]}`);
        }

        else{
            img.classList.toggle('ricochet-90');
        }

    }

    let timing = timings[moveNo];
    pauseTimer(turn);
    resetTimer(timing);

    
    establishTurn(undoing = true, redoing = false);

    if (gameOver){
        frozen = false;
        gameOver = false;
        let text = document.querySelector('#winner');
        text.innerText = '';
        text.classList.remove(`red-won`);
        text.classList.remove(`blue-won`);
    }
}

undoButton.addEventListener('click', ()=>{
    if (!frozen ||gameOver) undo(noMoves);
});


function redo(){
    
    let moveNo = noMoves;
    if (moveNo === moves.length){
        return false;
    }

    let move = moves[moveNo];
    let [rotation, from, to, swap, destroy] = move.split('+');
    
    let fromDiv = divOfId(from);
    let clickEvent = new CustomEvent('click', {bubbles: true, detail: {redoing: true}});
    fromDiv.dispatchEvent(clickEvent);

    if (rotation === '0'){
        let toDiv = divOfId(to);
        toDiv.dispatchEvent(clickEvent);
    }
    else{
        if (rotation === '1') rrotate.dispatchEvent(clickEvent);
        else if (rotation === '2') lrotate.dispatchEvent(clickEvent);
    }
    
}

redoButton.addEventListener('click', ()=>{
    if (!frozen || gameOver) redo();
});

// . Rotation + from + ?to  + ?swap + ?destroyNameColor-Position
//Format of each element of timings:
// {cs: {red: , blue: }, s: {red: , blue: }, m: {red: , blue: }}

// timings = [{cs: {red: 30, blue: 90}, s: {red : 35, blue: 49}, m: {red: 3, blue: 3}}]

function moveToText(move){
    // Function works when called immediately after move

    let [rotation, from, to, swap, destroy] = move.split('+');

    let text = '', destroyedText = '', fromDiv = divOfId(from), toDiv = null, fromName = pieceNameFromId(from), toName = null, destroyedName = null, destroyedId = null;
    //fromName is '' if no piece in from
    // toName and toDiv are null if no to provided
    // If to provided, no piece in to, toName is ''

    if (to){
        toDiv = divOfId(to);
        toName = pieceNameFromId(to);
    }

    if (destroy){
        [destroyedName, destroyedId] = destroy.split('-');
        if (destroyedId === from) fromName = destroyedName;
        else if (destroyedId === to) toName = destroyedName;
        destroyedText = ` and destroyed ${destroyedName} in ${destroyedId}`;
    }

    if (rotation === '0'){
        if (swap) text = `swapped ${toName} in ${from} with ${fromName} in ${to}`;
        else{
            text = `moved ${toName} from ${from} to ${to}`;
        }
    }
    else if (rotation === '1'){
        text = `rotated ${fromName} in ${from} clockwise`;
    }
    else if (rotation === '2'){
        text = `rotated ${fromName} in ${from} anti-clockwise`;
    }

    return text+destroyedText;
}

// function t(index){
//     console.log(moveToText(moves[index]));
// }

function updateTexts(){
    texts  = texts.slice(0, noMoves-1); 
    //-1 because func called 1.5 seconds after, so establish turn has incremented noMoves 

    texts.push(String(noMoves)+'. '+opponentOf(turn)+' '+moveToText(moves[moves.length-1]));
    
    movesHistory.innerHTML = texts[0];
    for (let i = 1; i<texts.length; i++){
        movesHistory.innerHTML += '<br>'+texts[i];
    }

}

function saveGame(){
    let game;
    if (localStorage.getItem('gameNo') === null){
        localStorage.setItem('gameNo', '1');
        game = 'game1';
    }
    else{
        game = String(parseInt(localStorage.getItem('gameNo'))+1)
        localStorage.setItem('gameNo', game);
        game = 'game'+game;
    }
    localStorage.setItem(game, JSON.stringify({moves: moves, timings: timings, texts: texts, noMoves: noMoves}));

}
