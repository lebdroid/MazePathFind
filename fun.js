function Mine(canvas, ctx, gridWidth, gridHight, speed, cellSize) {
    let dirEnum = { left: "left", right: "right", up: "up", down: "down", diagupleft: "diagupleft", diagdownleft: "diagdownleft", diagupright: "diagupright", diagdownright: "diagdownright" };
    let PathArray = [];
    let markedblocks = new Set();
    let working = false;
    let showCoordinates = false;
    let Notdragging = true;
    let Pickedtarget = null;
    let PickedstartNode = null;
    let Pickingstatus = { target: false, startNode: false };
    let alreadymazed = false;
    window.sizerange.onchange = (event) => {
        cellSize = event.target.value;
        grid.grid = [];
        window.sizerangelabel.innerText = `Cell Size: ${cellSize} x ${cellSize}`;
        grid = new Graph(gridWidth, gridHight, cellSize);

        reset();
    };

    window.speedrange.onchange = (event) => {
        speed = event.target.value;
        window.speedrangelabel.innerText = `Drawing Delay: ${speed}ms`;
    };

    window.ShowCordinates.onchange = (event) => {
        showCoordinates = event.target.checked;
        reset();
    };

    window.onresize = () => {
        canvas.width = innerWidth - innerWidth * 0.2;
        canvas.height = innerHeight - innerHeight * 0.29;
        gridWidth = canvas.width;
        gridHight = canvas.height;
        canvas.style.backgroundColor = "black";
        grid.grid = [];
        grid = new Graph(gridWidth, gridHight, cellSize);
        reset();
    };

    window.performanceSpan.innerText = "Click to select a start node";

    class Graph {
        static graph = [];
        constructor(w, h, cellSize) {
            this.grid = [];
            this.width = Math.floor((w - cellSize) / cellSize);
            this.height = Math.floor((h - cellSize) / cellSize);
            this.graph = {};
            this.node = null;
            this.makeGraph();
        }

        checkAndPush(X, Y, offsetX, offsetY, walldir) {
            let newX = X + offsetX;
            let newY = Y + offsetY;
            let adjname = `${newX},${newY}`;

            if (newX >= 0 && newX <= this.width && newY >= 0 && newY <= this.height) {
                this.node.adj.push(adjname);
            }
            if (walldir) {
                this.node.walls.push([walldir, adjname]);
            }
        }
        makeGraph() {
            for (let Y = 0; Y <= this.height; Y++) {
                for (let X = 0; X <= this.width; X++) {
                    this.node = new Node(X, Y, cellSize);
                    this.grid.push(this.node);
                    this.checkAndPush(X, Y, 1, 0, dirEnum.right); // right
                    this.checkAndPush(X, Y, -1, 0, dirEnum.left); // left
                    this.checkAndPush(X, Y, 0, -1, dirEnum.up); // up
                    this.checkAndPush(X, Y, 0, 1, dirEnum.down); // down
                    // this.checkAndPush(X, Y, -1, -1, null); // diagupleft
                    // this.checkAndPush(X, Y, -1, 1, null); // diagdownleft
                    // this.checkAndPush(X, Y, 1, -1, null); // diagupright
                    // this.checkAndPush(X, Y, 1, 1, null); // diagdownright
                }
            }
        }
    }

    class Node {
        constructor(X, Y, cellSize) {
            this.name = `${X},${Y}`;
            this.X = X;
            this.Y = Y;
            this.offsetX = X * cellSize;
            this.offsetY = Y * cellSize - cellSize * 0.29;
            this.adj = [];
            this.cellSize = cellSize;
            this.walls = [];
            this.distance = 0;
            this.highlight = false;
            this.targeted = false;
            this.spacebetween = 1;
        }

        draw() {
            const walls = this.walls.map((arr) => arr[0]);

            if (showCoordinates) {
                ctx.beginPath();
                ctx.font = "10px Arial";
                ctx.fillStyle = "red";
                ctx.fillText(`${this.X},${this.Y}`, this.offsetX + this.cellSize * 0.3, this.offsetY + this.cellSize * 0.8);
            }

            if (this.highlight || this.targeted) {
                ctx.save();
                ctx.beginPath();
                ctx.globalAlpha = this.targeted ? 0.2 : 0.5;
                ctx.fillStyle = this.targeted ? "red" : "green";
                ctx.fillRect(this.offsetX + this.cellSize * 0.05, this.offsetY + this.cellSize * 0.3, this.cellSize, this.cellSize);
                ctx.restore();
            }

            ///// this is for testing

            if (markedblocks.has(this.name)) {
                ctx.save();
                ctx.beginPath();
                ctx.globalAlpha = this.targeted ? 0.2 : 0.5;
                ctx.fillStyle = "gray";
                ctx.fillRect(this.offsetX + this.cellSize * 0.05, this.offsetY + this.cellSize * 0.3, this.cellSize, this.cellSize);
                ctx.restore();
            }

            ctx.save();
            ctx.strokeStyle = "green";
            ctx.lineWidth = 0.5;
            ctx.translate(this.offsetX + this.cellSize * 0.05, this.offsetY + this.cellSize * 0.3);
            //top

            if (walls.includes(dirEnum.up)) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.cellSize - this.spacebetween, 0);
                ctx.stroke();
            }

            //right
            if (walls.includes(dirEnum.right)) {
                ctx.beginPath();
                ctx.moveTo(this.cellSize - this.spacebetween, 0);
                ctx.lineTo(this.cellSize - this.spacebetween, this.cellSize - this.spacebetween);
                ctx.stroke();
            }

            //left
            if (walls.includes(dirEnum.left)) {
                ctx.beginPath();
                ctx.moveTo(0, this.cellSize - this.spacebetween);
                ctx.lineTo(0, 0);
                ctx.stroke();
            }

            // bottom
            if (walls.includes(dirEnum.down)) {
                ctx.beginPath();
                ctx.moveTo(0, this.cellSize - this.spacebetween);
                ctx.lineTo(this.cellSize, this.cellSize - this.spacebetween);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    let grid = new Graph(gridWidth, gridHight, cellSize);

    window.opensettingbtn.onclick = () => {
        window.settings.style.display = "flex";
    };

    window.closesettingbtn.onclick = () => {
        window.settings.style.display = "none";
    };

    window.mazebtn.onclick = (event) => {
        if (working) return;
        if (alreadymazed) HardReset();
        window.settings.style.display = "none";
        let rect = canvas.getBoundingClientRect();
        let X = Math.floor((event.clientX - rect.left) / cellSize);
        let Y = Math.floor((event.clientY - rect.top) / cellSize);

        depthFirstMaze(grid.grid);
        FindIt(PathArray);
    };

    canvas.onpointermove = (event) => {
        if (event.buttons == 1) {
            Notdragging = false;
            let markblocks = window.markblocks.checked;
            if (markblocks) {
                let rect = canvas.getBoundingClientRect();
                let X = Math.floor((event.clientX - rect.left) / cellSize);
                let Y = Math.floor((event.clientY - rect.top) / cellSize);
                let cell = grid.grid.find((cell) => cell.name == `${X},${Y}`);
                markedblocks.add(`${X},${Y}`);
                if (cell) cell.draw();
            }
        }
    };
    canvas.onpointerup = (e) => {
        setTimeout(() => {
            Notdragging = true;
        }, 20);
    };

    canvas.onpointerdown = (event) => {
        if (working) return;
        window.settings.style.display = "none";
        PathArray = [];
        const bfsbtn = window.bfs.checked;
        const dfsbtn = window.dfs.checked;
        let markblocks = window.markblocks.checked;

        let rect = canvas.getBoundingClientRect();
        let X = Math.floor((event.clientX - rect.left) / cellSize);
        let Y = Math.floor((event.clientY - rect.top) / cellSize);

        if (!markblocks) {
            if (Pickingstatus.startNode == true && PickedstartNode.name == `${X},${Y}`) {
                reset();
                window.performanceSpan.innerText = "Click to select a start node";
                console.log("start node deleted");
            } else if (Pickingstatus.startNode == false) {
                PickedstartNode = grid.grid.find((cell) => cell.name == `${X},${Y}`);
                Pickingstatus.startNode = true;
                PickedstartNode.highlight = true;
                PickedstartNode.draw();
                window.performanceSpan.innerText = "Click to select a target node";
            } else if (Pickingstatus.startNode && Pickingstatus.target == false) {
                Pickedtarget = grid.grid.find((cell) => cell.name == `${X},${Y}`);
                Pickedtarget.targeted = true;
                Pickedtarget.draw();
            }
        }

        if (Pickedtarget && PickedstartNode && !markblocks) {
            if (bfsbtn) {
                performance.mark("start");
                breadthFirst(grid.grid, PickedstartNode.name, { X, Y });
                performance.mark("end");
                window.performanceSpan.innerText = `Performance: ${Math.floor(performance.measure("bfs", "start", "end").duration)}ms`;
            } else if (dfsbtn) {
                performance.mark("start");
                depthFirst(grid.grid, PickedstartNode.name, { X, Y });
                performance.mark("end");
                window.performanceSpan.innerText = `Performance: ${Math.floor(performance.measure("dfs", "start", "end").duration)}ms`;
            } else {
                console.log("error");
            }

            FindIt(PathArray);
        }

        if (markblocks && Notdragging) {
            if (markedblocks.has(`${X},${Y}`)) {
                markedblocks.delete(`${X},${Y}`);
                let cell = grid.grid.find((cell) => cell.name == `${X},${Y}`);
                if (cell) cell.draw();
                reset();
            }
        }
    };

    function reset() {
        working = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        grid.grid.forEach((cell) => {
            cell.highlight = false;
            cell.targeted = false;
            cell.draw();
        });

        PathArray = [];
        Pickedtarget = null;
        startNode = null;
        Pickingstatus = { target: false, startNode: false };
        window.performanceSpan.innerText = "Click to select a start node";
    }

    function HardReset() {
        grid = new Graph(gridWidth, gridHight, cellSize);
        grid.grid.forEach((cell) => {
            cell.draw();
        });
        alreadymazed = false;
    }

    reset();
    function depthFirstMaze(graph) {
        if (alreadymazed) return;

        let getRandomNeighbor = (node) => {
            let neighbors = node.adj.filter((adjNodeName) => !visited[adjNodeName]);
            if (neighbors.length === 0) {
                return null;
            }
            let randomIndex = Math.floor(Math.random() * neighbors.length);
            return graph.find((n) => n.name === neighbors[randomIndex]);
        };

        let startNode = graph[0];
        let stack = [startNode];
        let visited = { [startNode.name]: true };

        PathArray.push(startNode);
        while (stack.length > 0) {
            let currentNode = stack[stack.length - 1];
            PathArray.push(currentNode);
            let randomNeighbor = getRandomNeighbor(currentNode);

            if (!randomNeighbor) {
                stack.pop();
                continue;
            }

            let currnetsharedWall = currentNode.walls.find((wall) => wall.includes(randomNeighbor.name));
            let neighborsharedWall = randomNeighbor.walls.find((wall) => wall.includes(currentNode.name));
            if (currnetsharedWall && neighborsharedWall) {
                currentNode.walls = currentNode.walls.filter((wall) => wall !== currnetsharedWall);
                randomNeighbor.walls = randomNeighbor.walls.filter((wall) => wall !== neighborsharedWall);

                visited[randomNeighbor.name] = true;
                stack.push(randomNeighbor);
            }
        }
        alreadymazed = true;
    }

    function sleep(milliseconds) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }

    async function FindIt(arr) {
        working = true;
        window.sizerange.disabled = true;
        window.mazebtn.disabled = true;
        for (const cell of arr) {
            cell.highlight = true;
            cell.draw();
            await sleep(speed);
        }

        await sleep(1500);
        window.sizerange.disabled = false;
        window.mazebtn.disabled = false;
        reset();
    }

    function breadthFirst(graph, source, target) {
        let startNode = graph.find((node) => node.name == source);
        if (!startNode) {
            console.log("couldnt find startNode");
            return;
        }
        let queue = [startNode];
        let visited = { [startNode.name]: true };
        let { X: targetX, Y: targetY } = target;
        let distances = { [source]: 0 };
        let previous = { [source]: null };
        let path = [];

        while (queue.length > 0) {
            let current = queue.shift();

            if (markedblocks.has(current.name)) {
                continue;
            }

            if (current.X === targetX && current.Y === targetY) {
                console.log("found it");
                while (current !== null) {
                    path.unshift(current);
                    current = previous[current.name];
                }
                PathArray = path;

                return;
            }

            PathArray.push(current);

            for (const neighbor of current.adj) {
                if (alreadymazed) {
                    let currnetsharedWall = current.walls.find((wall) => wall.includes(neighbor));
                    if (currnetsharedWall) {
                        continue;
                    }
                }
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    let neighborNode = graph.find((node) => node.name === neighbor);
                    queue.push(neighborNode);
                    let distance = distances[current.name] + 1;
                    if (!distances[neighborNode.name] || distance < distances[neighborNode.name]) {
                        distances[neighborNode.name] = distance;
                        previous[neighborNode.name] = current;
                    }
                }
            }
        }

        console.log("didnt find it");

        return null;
    }

    function depthFirst(graph, source, target) {
        let startNode = graph.find((node) => node.name == source);
        if (!startNode) {
            console.log("couldnt find startNode");
            return;
        }
        let stack = [startNode];
        let visited = { [startNode.name]: true };
        let { X, Y } = target;

        let distances = { [source]: 0 };
        let previous = { [source]: null };
        let path = [];

        while (stack.length > 0) {
            let current = stack.pop();

            if (markedblocks.has(current.name)) {
                continue;
            }
            if (current.X == X && current.Y == Y) {
                console.log("found it");

                while (current !== null) {
                    path.unshift(current);
                    current = previous[current.name];
                }
                PathArray = path;
                return;
            }

            PathArray.push(current);

            for (const neighbor of current.adj) {
                if (alreadymazed) {
                    let currnetsharedWall = current.walls.find((wall) => wall.includes(neighbor));
                    if (currnetsharedWall) {
                        continue;
                    }
                }

                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    stack.push(graph.find((arr) => arr.name == neighbor));
                    let distanceToNeighbor = distances[current.name] + 1;
                    if (!distances[neighbor] || distanceToNeighbor < distances[neighbor]) {
                        distances[neighbor] = distanceToNeighbor;
                        previous[neighbor] = current;
                    }
                }
            }
            // console.log(stack.map((e) => e.name));
        }

        console.log("didnt find it");
    }
}

let canvas = document.getElementById("Mycanvas");
let ctx = canvas.getContext("2d");

canvas.width = innerWidth - innerWidth * 0.2;
canvas.height = innerHeight - innerHeight * 0.29;
canvas.style.backgroundColor = "black";

let cellSize = window.sizerange.value;
let gridWidth = canvas.width;
let gridHight = canvas.height;
let speed = window.speedrange.value;

Mine(canvas, ctx, gridWidth, gridHight, speed, cellSize, true);
