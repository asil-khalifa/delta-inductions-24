let container = document.querySelector('#container'), controls = document.querySelector('#controls');
let timeSettings = document.querySelector('#time-settings'), resetButton = document.querySelector('#reset');
let turn = 'red', noMoves = -1, frozen=false, gameOver = false;
let vw, vh, containerWidth;
let selectedSquare = null;
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
    'sricochetBlue': ''
}

let rotations = {
    'ricochetRed': 0,
    'ricochetBlue': 0,
    'sricochetRed': 0,
    'sricochetBlue': 0
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
        controls.style.height = mult * vless + 'px';
        controls.style.width = multControls * vmore + 'px';
    }
    else {
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

function createPiece(type) {
    let piece = document.createElement('img');
    piece.src = `images/${type}.png`;
    piece.alt = type;
    piece.classList.add('piece');
    if (type.indexOf('ricochet') == -1) {
        if (type.indexOf('Red') !== -1) piece.classList.add('red-piece');
        else piece.classList.add('blue-piece');
    }
    return piece;
}

function movePiece(piece, to) {
    // let initPos = positions[piece.alt];
    let square = document.querySelector(`#${to}`);
    square.append(piece);

    positions[piece.alt] = to;
}

function divOfId(id) {
    return document.querySelector(`#${id}`);
}


addTiles();

window.addEventListener('resize', setContainerSize);

function setBoard() {
    let pieces = document.querySelectorAll('.piece'), aPiece;

    for (aPiece of pieces) aPiece.remove();

    aPiece = createPiece('tankRed');
    movePiece(aPiece, 'd7');
    aPiece = createPiece('tankBlue');
    movePiece(aPiece, 'd2');
    aPiece = createPiece('titanBlue');
    movePiece(aPiece, 'd1');
    aPiece = createPiece('titanRed');
    movePiece(aPiece, 'd8');
    aPiece = createPiece('canonRed');
    movePiece(aPiece, 'e8');
    aPiece = createPiece('canonBlue');
    movePiece(aPiece, 'e1');
    aPiece = createPiece('ricochetRed');
    movePiece(aPiece, 'c6');
    aPiece = createPiece('ricochetBlue');
    movePiece(aPiece, 'c3');
    aPiece = createPiece('sricochetRed');
    movePiece(aPiece, 'f6');
    aPiece = createPiece('sricochetBlue');
    movePiece(aPiece, 'f3');
    rotations['sricochetBlue'] = 180;
    let temp = document.querySelector('#f3').children[0];
    temp.classList.add('sricochet-180');

    turn = 'red';
    noMoves = -1;
    // for (aPiece of pieces) {
    //     if (aPiece.alt.indexOf('ricochet') === -1) aPiece.classList.add('rotate-piece');
    // }

    establishTurn(); //Makes it blues turn
}
setBoard();
resetButton.addEventListener('click', setBoard);

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

    if (positionsValues.includes(id)) {

        selectedSquare = divOfId(id);
    }
    else if (e.target.classList.contains('piece')) selectedSquare = divOfId(e.target.parentElement.id);
    else {
        //User earlier clicked a piece, and now didn't click on a piece

        if (ogSquare !== null && e.target.classList.contains('moveable-tile')) {
            movePiece(ogSquare.children[0], e.target.id);
            establishTurn();
        }
        removeMoveableSquares();
        toggleAllowRotation(selectedSquare);
        return;
    }

    //If the selected square is not the turn's piece OR the board is frozen donot select it
    if (selectedSquare.children[0].alt.toLowerCase().indexOf(turn) === -1 ||frozen) {
        selectedSquare = null;
    }

    //User has currently clicked on a piece, but it may not be accepted due to it not being their turn

    removeMoveableSquares();
    if (selectedSquare !== null) {

        selectSquare(selectedSquare);
        showMoveableSquares(selectedSquare);
        toggleAllowRotation(selectedSquare);
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

                let id = s[i - 1] + String(j);
                if (Object.values(positions).includes(id)) continue;

                let pieceName = square.children[0].alt;
                if (pieceName.indexOf('canon') !== -1) {
                    if (y == j) {
                        let sq = divOfId(id);
                        sq.classList.add('moveable-tile');
                        moveableSquares.push(id);
                    }
                    continue;
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
    if (selectedSquare !== null && selectedSquare.children.length > 0) {
        let img = selectedSquare.children[0];
        let altText = img.alt;
        if (altText.indexOf('ricochet') === -1) return;
        if (altText.indexOf('sricochet') !== -1) {
            img.classList.remove(`sricochet-${rotations[altText]}`);
            if (event.target.classList.contains('left') || event.target.parentElement.classList.contains('left')) rotations[altText] += 270;
            else rotations[altText] += 90;
            rotations[altText] %= 360;
            img.classList.add(`sricochet-${rotations[altText]}`);
        }
        else {
            img.classList.toggle('ricochet-90');
        }
        establishTurn();
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


function establishTurn() {
    noMoves++;
    frozen = true;
    let waitTime = 2500, ogTurn = turn;
    if (noMoves ===0) waitTime = 0;

    if (turn === 'red') turn = 'blue';
    else turn = 'red';

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
            if (piece.alt.indexOf('ricochet') === -1) {
                if (turn === 'red') piece.classList.add('rotate-piece');
                else piece.classList.remove('rotate-piece');

            }
        }
        frozen = false;

    }, waitTime);

    if (noMoves > 0) {
        //Temporary freeze all pieces:

        let pieces = document.querySelectorAll('.piece');

        for (let piece of pieces) {
            piece.classList.add('block-piece');
            piece.parentElement.classList.add('block-piece');
        }

        shootBullet();
    }
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function createBullet() {
    let opp = 'red';
    if (turn === 'red') opp = 'blue';

    console.log('Bullet shot');
    let canon = document.querySelector(`#${positions[`canon${capitalize(opp)}`]}`);
    let bullet = document.createElement('img');
    // let canon = document.querySelector('#a4');
    bullet.src = 'images/bullet.png';
    bullet.alt = 'bullet';
    bullet.style.width = bullet.style.height = 0.035 * parseInt(containerWidth) + 'px'; //bullet = .28 * box width
    bullet.style.zIndex = '1';
    bullet.classList.add('bullet');

    let bulletContainer = document.createElement('div');
    bulletContainer.classList.add('bullet-container')
    bulletContainer.append(bullet);
    canon.prepend(bulletContainer);
    // bullet.style.left = ((1/16)*parseInt(container.style.width) - (1/2)*parseInt(bullet.style.width)) + 'px'; 
    //Because x.style.width returns '100px' for example
    return [bullet, bulletContainer];
}



function getNeighbours() {

    const neighbours = {
        left: { piece: '', distance: 0 },
        top: { piece: '', distance: 0 },
        right: { piece: '', distance: 0 },
        bottom: { piece: '', distance: 0 }
    }

    let opp = 'red', alphas = 'abcdefgh';
    if (turn === 'red') opp = 'blue';

    let curId = positions[`canon${capitalize(opp)}`], pos;
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
    console.log(neighbours);
    return neighbours;
}

function move(bullet, direction, blocks, duration) {
    let whichCase = 'vertical';
    if (direction === 'top' || direction === 'bottom') {
        bullet.style.transition = `top ${duration}s ease-in-out`;
    }

    else if (direction === 'left' || direction === 'right') {
        bullet.style.transition = `left ${duration}s ease-in-out`;
        whichCase = 'horizontal'
    }

    let distance = (blocks - .5) * parseInt(containerWidth) * (1 / 8);

    if (direction === 'top') bullet.style.top = (parseInt(bullet.style.top) - distance) + 'px';
    else if (direction === 'bottom') bullet.style.top = (parseInt(bullet.style.top) + distance) + 'px';
    else if (direction === 'left') bullet.style.left = (parseInt(bullet.style.left) - distance) + 'px';
    else if (direction === 'right') bullet.style.left = (parseInt(bullet.style.left) + distance) + 'px';

}

function moveBullet(bullet, direction) {
    const neighbours = getNeighbours();
    // bullet.style.top = 0;
    // let multiplier = .83;
    // if (turn ==='red') multiplier = -.83;

    // setTimeout(()=>{
    //     bullet.style.top = (parseInt(bullet.style.top)+multiplier*parseInt(containerWidth)) + 'px';

    // }, 50);

    //! If red: negative
    let blocks = neighbours[direction].distance;
    let hitPiece = neighbours[direction].piece;
    if (hitPiece === '') blocks = 7.5;
    move(bullet, direction, blocks, .5);

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

    if (hitPiece.indexOf('titan')!==-1){
        let text = document.querySelector('#winner');
        text.innerText = `${capitalize(turn)} WINS!!!`;
        text.classList.add(`${turn}-won`);
        frozen = true;
        gameOver = true;
    }
    else if (hitPiece.indexOf('sricochet')!==-1){
        console.log('sricochet');
    }
    else if (hitPiece.indexOf('ricochet')!==-1){
        let div = document.querySelector(`#${positions[hitPiece]}`);
        let img = div.children[0];
        //hitPiece is piece name like 'ricochet'...
        let isRight = true;
        if (img.classList.contains('ricochet-90')) isRight = false;

        if(isRight){
            if (direction === 'top') moveBullet(bullet, 'right');
            else moveBullet(bullet, 'left');
        }
        else{
            if (direction === 'top') moveBullet(bullet, 'left');
            else moveBullet(bullet, 'right');
            
        }

    }
}

function shootBullet() {
    let [bullet, bulletContainer] = createBullet();

    bullet.style.top = -(1 / 2) * parseInt(bullet.style.width) + 'px';
    if (turn === 'blue') bullet.style.top = (parseInt(containerWidth) * (1 / 8) - (1 / 2) * parseInt(bullet.style.width)) + 'px';
    // bullet.style.transition = 'top .5s ease-in-out';

    setTimeout(() => {
        if (turn === 'blue') moveBullet(bullet, 'bottom');
        else moveBullet(bullet, 'top');

    }, 1);

    setTimeout(() => {
        bullet.remove();
        bulletContainer.remove();
    }, 5250);

}
