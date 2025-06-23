import { GraphNode } from "./graphNode.js";
import { ListNode } from "./listNode.js";
import { TreeNode } from "./treeNode.js";

export class Visualizer { //-- may want to switch to typescript, also lots of parameters which is very confusing, maybe include var names in the 
    constructor(width, height){
        this.container = d3.select('#visualization-container')
            .attr('width', width) //--not actually the minimum width, the container shrinks and expands with contents
            .attr('height', height);
        this.strokeSize = 2.5;
        this.marginSize = 10;
        this.colors = ['red', 'yellow', 'green', 'blue'];
        this.values = [];
    }
  
    //progromatically add svgs into the div as new data structures are added so you do not have to deal with structure counters
    //The first element is a little smaller of a separator than the other elements, not a big issue but maybe look into

    clear() {
        this.container.html('');
    }

    visualizeAll(snapshotArr, selectorMap) {
        console.log('here3', snapshotArr, selectorMap);
        for (let i = 0; i < snapshotArr.length; i++) {
            if (selectorMap.has(snapshotArr[i].name)) {
                console.log('here6', selectorMap.get(snapshotArr[i].name));
                this.visualize(snapshotArr[i].name, snapshotArr[i].value, selectorMap.get(snapshotArr[i].name));
            } else {
                this.visualize(snapshotArr[i].name, snapshotArr[i].value);
            }

            //this.visualize(snapshotArr[i].name, snapshotArr[i].value, selectorMap.get(snapshotArr[i].name));
        }
    }

    visualize(name, value, values=[]) {
        if (typeof value != 'object') {
            this.visualizeVariable(name, value);
        } else if(value instanceof Array) {
            this.visualizeArr(name, value, values);
        } else if(value instanceof Set) {
            this.visualizeSet(name, value);
        } else if(value instanceof ListNode || "next" in value ) {
            this.visualizeLinkedList(name, value, false, values)
        } else if(value instanceof TreeNode || "children" in value || "left" in value || "right" in value) {
            this.visualizeTree(name, value);
        } else if(value instanceof GraphNode || "neighbors" in value) {
            this.visualizeGraph(name, value, false);
        }
    }

    /*visualizeWithValues(name, value, values) {
        if (typeof value != 'object') {
            this.visualizeVariable(name, value);
        } else if(value instanceof Array) {
            console.log('here5', value, values)
            this.visualizeArr(name, value, values);
        } else if(value instanceof Set) {
            this.visualizeSet(name, value, values);
        }
    }*/

    visualizeVariable(name, value) {
        this.container.append('div')
            .style("margin-left", this.marginSize + 'px')
            .style('margin-top', '10px')
            .text(`${name}: ${value}`);
    }

    visualizeVariableArr(names, values) {
        this.drawDoubleArr(names, values);
    }

    visualizeArr(name, arr, values){
        //console.log('here-1', name, arr, 'vals:', values);
        const squareWidth = 50;
        const marginSize = 10;
        const strokeSize = this.strokeSize;
        const width = arr.length * squareWidth + strokeSize + marginSize * 2;
        const height = squareWidth + strokeSize + marginSize;
        this.container.append('br');
        this.writeVariableName(name, marginSize);

        const svg = this.container.append('svg')
            .attr('class', 'svgArr')
            .attr('width', width)
            .attr('height', height);
            //svg.append('text').text('arr');
            //svg.append('br');
        console.log("vals2:", values)
        this.drawSquares(svg, arr, squareWidth, marginSize, strokeSize, 0, 0, 'rect', values);
        this.writeText(svg, arr, squareWidth, marginSize, strokeSize);
    }

    visualizeMatrix(name, matrix, values) { //-- need better name than values (I think these are selected values)
        console.log('init matrix: name:', name, 'contents:', matrix, 'values:', values);
        const squareWidth = 50;
        const marginSize = 10;
        const strokeSize = this.strokeSize;
        const width = matrix[0].length * squareWidth + strokeSize + marginSize * 2;
        const height = matrix.length * squareWidth + strokeSize + marginSize; //assuming that this has the same size column arrays
        this.container.append('br'); //append line break?
        this.writeVariableName(name, marginSize);
        const svg = this.container.append('svg')
        .attr('class', 'svgMatrix') // Changed class name for better semantics
        .attr('width', width)
        .attr('height', height);

        // Bind matrix data to 'g' elements, each representing a row
        const rows = svg.selectAll(".matrix-row") // Select elements with class 'matrix-row'
            .data(matrix) // Bind the outer array (matrix)
            .enter()
            .append("g") // Append a group 'g' for each row
            .attr("class", "matrix-row")
            // Use transform to position each row group vertically
            .attr("transform", (d, rowIndex) => `translate(${marginSize}, ${marginSize + rowIndex * squareWidth})`);
            // The translate applies to the entire group, so elements inside
            // can be positioned relative to their group's top-left.

        // Now, for each 'g' (row group), draw the squares and text
        rows.each((rowData, rowIndex, nodes) => {
            const currentRowGroup = d3.select(nodes[rowIndex]); // Select the current 'g' element

            // Call drawSquares and writeText using the currentRowGroup as the selection.
            // The yStart parameter can now be 0, as the row's vertical position
            // is handled by the 'transform' on the group.
            this.drawSquares(currentRowGroup, rowData, squareWidth, 0, strokeSize, 0, 0, 'rect', values); // marginSize is now applied by the group's transform. Pass 0 for internal margin
            this.writeText(currentRowGroup, rowData, squareWidth, 0, strokeSize, 0, 0, ".valueText"); // Same for text
        });
        /*const svg = this.container.append('svg')
            .attr('class', 'svgArr')
            .attr('width', width)
            .attr('height', height);
        for (let i = 0; i < matrix.length; i++) {
            console.log('height:', squareWidth * i);
            this.drawSquares(svg, matrix[i], squareWidth, marginSize, strokeSize, 0, squareWidth * i, 'rect', values);
            this.writeText(svg, matrix[i], squareWidth, marginSize, strokeSize, 0, squareWidth * i, ".valueText");
        }*/
    }
  
    visualizeLinkedList(name, head, doubly = false, values = []){
        let list = [];
        let currNode = head;
        while(currNode != null){ //or while(currNode.next){}
            list.push(currNode.val);
            currNode = currNode.next;
        }

        //circle attributes
        const circleDiameter = 50;
        const circleRadius = circleDiameter / 2;
        const marginSize = 10;
        const strokeSize = this.strokeSize;
        
        //arrow attributes
        const arrowLength = 20;
        const height = circleDiameter + strokeSize + marginSize;
        const width = (circleDiameter + arrowLength) * list.length + strokeSize + marginSize * 2;
        const colors = this.colors;


        this.container.append('br');
        this.writeVariableName(name, marginSize);
        const svg = this.container.append('svg')
            .attr('class', 'svgList')
            .attr('width', width)
            .attr('height', height);
        
        svg.append("defs")
            .append("marker")
            .attr("id", "arrow-head")
            .attr("viewBox", "5 -5 10 10") //5 -5 10 10
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("markerWidth", 16)
            .attr("markerHeight", 16)
            .attr("orient", "auto")
                .append('path')
                .attr("fill", "black")
                .attr("d", "M 0 -5 L 10 0 L 0 5 z")
                .style("stroke", "none");
  
        svg.selectAll('line')
            .data(list.slice(0, list.length - 1))
            .enter()
            .append('line')
                .attr('x1', function(d, i) { return strokeSize/2 + i * (circleDiameter + arrowLength) + marginSize + circleDiameter; })
                .attr('y1', strokeSize/2 + marginSize + circleRadius)
                .attr('x2', function(d, i) { return strokeSize/2 + i * (circleDiameter + arrowLength) + marginSize + circleDiameter + arrowLength; })
                .attr('y2', strokeSize/2 + marginSize + circleRadius)
                .attr('stroke', 'black')
                .attr("stroke-width", 1)
                .attr("marker-end", "url(#arrow-head)");
        if(doubly){
            svg.selectAll('.line')
                .data(list.slice(0, list.length - 1))
                .enter()
                .append('line')
                    .attr('x1', function(d, i) { return strokeSize/2 + i * (circleDiameter + arrowLength) + marginSize + circleDiameter + arrowLength; })
                    .attr('y1', strokeSize/2 + marginSize + circleRadius)
                    .attr('x2', function(d, i) { return strokeSize/2 + i * (circleDiameter + arrowLength) + marginSize + circleDiameter; })
                    .attr('y2', strokeSize/2 + marginSize + circleRadius)
                    .attr('stroke', 'black')
                    .attr("stroke-width", 1)
                    .attr("marker-end", "url(#arrow-head)");
        }
        this.drawCircles(svg, list, circleDiameter, marginSize, strokeSize, arrowLength, values);
        this.writeText(svg, list, circleDiameter, marginSize, strokeSize, arrowLength);
    }
  
    visualizeSet(name, set) {
        const squareWidth = 50;
        const marginSize = 10;
        const curveAmount = 10;
        const strokeSize = this.strokeSize;
        this.container.append('br');
        this.writeVariableName(name, marginSize);
        const height = squareWidth + strokeSize + marginSize;
        const width = squareWidth * set.size + strokeSize + marginSize * 2;
  
        const svg = this.container.append('svg')
            .attr('class', 'svgArr')
            .attr('width', width)
            .attr('height', height);
  
        this.drawSquares(svg, set, squareWidth, marginSize, strokeSize, curveAmount);
        this.writeText(svg, set, squareWidth, marginSize, strokeSize);
    }
  
    visualizeHashmap(name, hashmap) {
        const keys = Object.keys(hashmap);
        let hashKeys = [];
        let hashValues = [];
        for (const key of keys) {
            hashKeys.push(key);
            hashValues.push(hashmap[key]);
        }
        this.drawDoubleArr(hashKeys, hashValues);
    }
  
    visualizeTree(name, root) { //create a 2d array that is full of each node's value and the amount of leaf nodes that it has (find
    //the leaf nodes through a recursive function that takes the amount of leaf nodes of each of its children then use the amount of leaf nodes to determine the spacing of the nodes)
        //node attributes
        console.log("root", root);
        const circleDiameter = 50;
        const circleRadius = circleDiameter / 2;
        const marginSize = 10;
        const strokeSize = this.strokeSize;
        
        //tree attributes
        const seperationSize = 10;
        this.container.append('br');
        this.writeVariableName(name, marginSize);
        //const treeWidth = countLeafNodes(root) * (circleDiameter + seperationSize) - seperationSize; //get rid of the last separator
        const treeDepth = findtreeDepth(root);
        let nodeMatrix = [];
        populateNodeMatrix(root);
  
        const treeWidth = nodeMatrix[0][0].xVal * 2 + strokeSize; //find the amount of leaf nodes and multiply it
        const treeHeight = (circleDiameter + seperationSize) * treeDepth + strokeSize + marginSize;
        const svg = this.container.append('svg')
            .attr('class', 'svgTree')
            .attr('width', treeWidth)
            .attr('height', treeHeight);
        console.log("nodeMatrix", nodeMatrix)
        drawNodeCircles(nodeMatrix);
        drawNodeArrows(nodeMatrix);
        
        function populateNodeMatrix(node){
            let previousLeafs = new Array(treeDepth);
            for(let i = 0; i < treeDepth; i++){
                nodeMatrix.push(new Array());
                previousLeafs[i] = 0;
            }
            recurseNodes(node, 0);
        
            function recurseNodes(node, depth){
                if (!node) return 0;
                let leafNodes = 0;
                let childAmt = 0;
                let leftLeafs = 0, rightLeafs = 0;
        
                if(node.left || node.right){
                    if(node.left){
                        leftLeafs = recurseNodes(node.left, depth + 1);
                        childAmt++;
                    }
                    if(node.right){
                        rightLeafs = recurseNodes(node.right, depth + 1);
                        childAmt++;
                    }
                    leafNodes = leftLeafs + rightLeafs;
                } else {
                    leafNodes = 1;
                }
        
                const totalLeafs = previousLeafs[depth] + leafNodes / 2;
                console.log("nodeMatrix", nodeMatrix);
                nodeMatrix[depth].push({
                    val: node.val,
                    childAmt: childAmt,
                    xVal: strokeSize/2 + (circleDiameter + seperationSize) * (totalLeafs) + marginSize,
                    yVal: marginSize + circleRadius + (seperationSize + circleDiameter) * depth
                });
                previousLeafs[depth] += leafNodes;
                if(!node.left && !node.right){
                    for(let i = depth + 1; i < treeDepth; i++){
                        previousLeafs[i] += 1;
                    }
                }
                return leafNodes;
            }
        }
        
        function populateMultiNodeMatrix(node){
            let previousLeafs = new Array(treeDepth);
            for(let i = 0; i < treeDepth; i++){
                nodeMatrix.push(new Array());
                previousLeafs[i] = 0;
            }
            recurseNodes(node, 0, 0);
  
            function recurseNodes(node,depth){
                let leafNodes = 0;
                let childAmt = 0;
                if(node.children){
                    for(const child of node.children){
                        leafNodes += recurseNodes(child,depth + 1);
                    }
                    childAmt = node.children.length;
                } else {
                    leafNodes = 1;
                }
                const totalLeafs = previousLeafs[depth] + leafNodes / 2;
                //console.log(node.value + ", " + previousLeafs[depth] + ", " + leafNodes + ", " + totalLeafs);
                nodeMatrix[depth].push({"value": node.val, "childAmt": childAmt, "xVal": strokeSize/2 + (circleDiameter + seperationSize) * (totalLeafs) + marginSize, "yVal": marginSize + circleRadius + (seperationSize + circleDiameter) *depth});//rewrite later as points instead of arrays
                previousLeafs[depth] += leafNodes;
                if(!node.children){
                    for(let i = depth + 1; i < treeDepth; i++){//a little inefficient, maybe want to fix
                        previousLeafs[i] += 1;
                    }
                }
                return leafNodes;
            }
        }
  
        function drawNodeCircles(nodeMatrix){
            for(let row = 0; row < treeDepth; row++){
                let leafNodes = 0;
                svg.selectAll('.circle' + row)
                    .data(nodeMatrix[row])
                    .enter()
                    .append('circle')
                        .attr('id', (d, i) => "circle-" + i)
                        .attr('cy', function(d) { return d.yVal; })
                        .attr('cx', function(d) { return d.xVal; })
                        .attr('r', circleRadius)
                        .attr('fill', 'white')
                        .attr('stroke', 'black')
                        .attr('stroke-width', strokeSize);
                leafNodes = 0;
                svg.selectAll('.text' + row)
                    .data(nodeMatrix[row])
                    .enter()
                    .append('text')
                        .attr('id', (d, i) => "circle-" + i)
                        .attr('y', function(d) { return d.yVal})
                        .attr('x', function(d) { return d.xVal; })
                        .attr('text-anchor', 'middle')
                        .text(d => d.val);
            }
        }

        function drawNodeArrows(nodeMatrix){
            svg.append("defs") //definition of arrows
                .append("marker")
                .attr("id", "arrow-head")
                .attr("viewBox", "5 -5 10 10")
                .attr("refX", 10)
                .attr("refY", 0)
                .attr("markerWidth", 16)
                .attr("markerHeight", 16)
                .attr("orient", "auto")
                    .append('path')
                    .attr("fill", "black")
                    .attr("d", "M 0 -5 L 10 0 L 0 5 z")
                    .style("stroke", "none");
            for(let row = 0; row < nodeMatrix.length - 1; row++){//could maybe do this differently by directly pointing to child nodes from tree
                let seenChildren = 0;
                for(let col = 0; col < nodeMatrix[row].length; col++){
                    const currNode = nodeMatrix[row][col];
                    for(let childNum = 0; childNum < currNode.childAmt; childNum++){
                        const x2 = nodeMatrix[row + 1][seenChildren].xVal; 
                        const y2 = nodeMatrix[row + 1][seenChildren].yVal;
                        const reductionRatio = Math.sqrt(Math.pow(x2 - currNode.xVal, 2) + Math.pow(y2- currNode.yVal, 2)) / circleRadius;
                        svg.append('line')
                            .attr('x1', currNode.xVal + (x2 - currNode.xVal)/reductionRatio)
                            .attr('y1', currNode.yVal + (y2 - currNode.yVal)/reductionRatio)
                            .attr('x2', x2 - (x2 - currNode.xVal)/reductionRatio)
                            .attr('y2', y2 - (y2 - currNode.yVal)/reductionRatio)
                            .attr("class", currNode.val)
                            .attr("stroke", "black")
                            .attr("stroke-width", 1)
                            .attr("marker-end", "url(#arrow-head)");
                        seenChildren += 1;
                    }
                }
            }
        }
  
        function findmultitreeDepth(node){//maybe rename to treeDepth
            let maxDepth = 1;
            recurseNodes(node, 1);
            return maxDepth;
  
            function recurseNodes(node,depth){
                if(depth >maxDepth){
                   maxDepth =depth;
                }
                if(node.children){
                    for(const child of node.children){
                        recurseNodes(child,depth + 1);
                    }
                }
                return;
            }
        }
        function findtreeDepth(node) {
            if (!node) return 0;  // Handle null node case
            let maxDepth = 1;
            recurseNodes(node, 1);
            return maxDepth;
        
            function recurseNodes(node, depth) {
                if (!node) return;  // Base case for null nodes
                
                if (depth > maxDepth) {
                    maxDepth = depth;
                }
                
                // Recurse on left and right children if they exist
                if (node.left) {
                    recurseNodes(node.left, depth + 1);
                }
                if (node.right) {
                    recurseNodes(node.right, depth + 1);
                }
            }
        }
    }

    visualizeGraph(name, startNode, directional = true) { //questionable name "rootNode"
        //node attributes
        const circleDiameter = 50;
        const circleRadius = circleDiameter / 2;
        const marginSize = 10;
        const strokeSize = this.strokeSize;
        
        //graph attributes
        const seperationSize = 10; //need to make larger probably
        let nodeSet = new Set();
        let nodeArr = [];
        let edgeArr = [];
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;
        this.container.append('br');
        this.writeVariableName(name, marginSize);
        const svg = this.container.append('svg')
            .attr('class', 'svgGraph')
            .attr('width', 800)
            .attr('height', 1000);
        
        populateNodeEdgeArr(startNode);
        drawGraph(nodeArr, edgeArr);

        function drawGraph(nodeArr, edgeArr, fast = false){
            if(fast){
                const simulation = d3.forceSimulation(nodeArr)
                    .force("link", d3.forceLink(edgeArr).id(d => d.id).distance(100))
                    .force("charge", d3.forceManyBody().strength(-300))
                    .force("center", d3.forceCenter(0, 0))
                    // Removed collision force for speed
                    .alphaDecay(0.2) // Much faster decay
                    .velocityDecay(0.6) // Higher velocity decay
                    .alphaMin(0.01) // Higher minimum alpha to stop earlier
                    .on("end", () => {
                    // Step 2: Extract the node positions
                    const nodePositions = nodeArr.map(node => ({
                        id: node.id,
                        x: node.x,
                        y: node.y,
                        val: node.val
                    }));
                    centerGraph(nodePositions);


                    const nodePositionsTable = {};
                    for(let i = 0; i < nodePositions.length; i++) {
                        nodePositionsTable[nodePositions[i].id] = nodePositions[i];
                    }
                    // Step 3: Draw the static graph using the extracted positions
                    drawNodes(nodePositions);
                    drawEdges(nodePositionsTable, edgeArr);
                });
            } else {
                const simulation = d3.forceSimulation(nodeArr)
                    .force("link", d3.forceLink(edgeArr).id(d => d.id).distance(100))
                    .force("charge", d3.forceManyBody().strength(-300))
                    .force("center", d3.forceCenter(0, 0))
                    .force("collide", d3.forceCollide().radius(circleRadius + 5))
                    .on("end", () => {
                    // Step 2: Extract the node positions
                    const nodePositions = nodeArr.map(node => ({
                        id: node.id,
                        x: node.x,
                        y: node.y,
                        val: node.val
                    }));
                    centerGraph(nodePositions);


                    const nodePositionsTable = {};
                    for(let i = 0; i < nodePositions.length; i++) {
                        nodePositionsTable[nodePositions[i].id] = nodePositions[i];
                    }
                    // Step 3: Draw the static graph using the extracted positions
                    drawNodes(nodePositions);
                    drawEdges(nodePositionsTable, edgeArr);
                });
            }

            function getMaxMin(nodePositions) {
                for(let i = 0; i < nodePositions.length; i++) {
                    minX = Math.min(minX, nodePositions[i].x);
                    minY = Math.min(minY, nodePositions[i].y);
                    maxX = Math.max(maxX, nodePositions[i].x);
                    maxY = Math.max(maxY, nodePositions[i].y);
                }
            }

            function centerGraph(nodePositions){
                getMaxMin(nodePositions);
                for(let i = 0; i < nodePositions.length; i++) {
                    nodePositions[i].x -= minX - circleRadius - marginSize - strokeSize/2;
                    nodePositions[i].y -= minY - circleRadius - marginSize - strokeSize/2
                }
                svg.attr('width', (maxX - minX) + circleDiameter + marginSize * 2)
                    .attr('height', (maxY - minY) + circleDiameter + marginSize * 2);
            }
            
            function drawNodes(nodePositions) {
                svg.selectAll('circle')
                    .data(nodePositions)
                    .enter()
                    .append('circle')
                        .attr('id', (d, i) => "circle-" + i)
                        .attr('cy', (d, i) => nodePositions[i].y)
                        .attr('cx', (d, i) => nodePositions[i].x)
                        .attr('r', circleRadius)
                        .attr('fill', 'white')
                        .attr('stroke', 'black')
                        .attr('stroke-width', strokeSize);
                svg.selectAll('text')
                    .data(nodePositions)
                    .enter()
                    .append('text')
                        .attr('id', (d, i) => "text-" + i)
                        .attr('y', (d, i) => nodePositions[i].y)
                        .attr('x', (d, i) => nodePositions[i].x)
                        .attr('text-anchor', 'middle') //text anchor middle vertically as well
                        .text((d, i) => nodePositions[i].val);
                    
            }
            function drawEdges(nodePositionsTable, edgeArr) {
                svg.append("defs")
                    .append("marker")
                    .attr("id", "arrow-head")
                    .attr("viewBox", "5 -5 10 10") //5 -5 10 10
                    .attr("refX", 10)
                    .attr("refY", 0)
                    .attr("markerWidth", 16)
                    .attr("markerHeight", 16)
                    .attr("orient", "auto")
                        .append('path')
                        .attr("fill", "black")
                        .attr("d", "M 0 -5 L 10 0 L 0 5 z")
                        .style("stroke", "none");
                
                const edgePositions = getEdgePositions(edgeArr, nodePositionsTable);
                svg.selectAll('line')
                    .data(edgePositions)
                    .enter()
                    .append('line')
                        .attr('x1', function(d, i) { return edgePositions[i][0]; })
                        .attr('y1', function(d, i) { return edgePositions[i][1]; })
                        .attr('x2', function(d, i) { return edgePositions[i][2]; })
                        .attr('y2', function(d, i) { return edgePositions[i][3]; })
                        .attr('stroke', 'black')
                        .attr("stroke-width", 1)
                    if(directional){
                        svg.selectAll('line')
                            .attr("marker-end", "url(#arrow-head)");
                    }

                function getEdgePositions(edgeArr, nodePositionsTable){ 
                    let edgePositions = [];
                    for(let i = 0; i < edgeArr.length; i++){
                        const x1 = nodePositionsTable[edgeArr[i].source.id].x;
                        const y1 = nodePositionsTable[edgeArr[i].source.id].y;
                        const x2 = nodePositionsTable[edgeArr[i].target.id].x;
                        const y2 = nodePositionsTable[edgeArr[i].target.id].y;
                        const reductionRatio = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2- y1, 2)) / circleRadius;
                        edgePositions.push([
                            x1 + (x2-x1)/reductionRatio, 
                            y1 + (y2 - y1)/reductionRatio,
                            x2 - (x2 - x1)/reductionRatio,
                            y2 - (y2 - y1)/reductionRatio
                        ]);
                    }
                    return edgePositions;
                }
            }
        }

        function populateNodeEdgeArr(node){
            addNode(node);
            recurseNeighbor(node);

            function recurseNeighbor(node){ //might need to use a set to determine if a node has been visited
                if(node.neighbors) {
                    for(let i = 0; i < node.neighbors.length; i++) {
                        addNode(node.neighbors[i]);
                        addEdge(node, node.neighbors[i]);
                        recurseNeighbor(node.neighbors[i]);
                    }
                    /*const angleIncrement = Math.PI * 2 / node.neightbors.length; //this assumes no loops, will have to change later!!!!!!
                    for(let i = 0; i < node.neighbors.length; i++) {
                        const angle = originAngle + angleIncrement * i;
                        const newX = originX + Math.cos(angle) * seperationSize;
                        const newY = originY + Math.sin(angle) * seperationSize;
                        recurseNeighbor(node.neighbors[i], newX, newY, angle + Math.PI); //need to add Math.PI because the angle will be opposite when it is going in rather than coming out
                    }*/
                }
            }
            function addNode(node){
                if(!node.id){
                    node.id = node.val;
                }
                if(!nodeSet.has(node.id)) {
                    nodeSet.add(node.id);
                    nodeArr.push(node)
                }
            }
            function addEdge(node1, node2) {
                edgeArr.push({ source:node1.id, target:node2.id })
            }
        }

    }
  
    drawSquares(svg, data, squareWidth, marginSize, strokeSize, curveAmount = 0, yStart = 0, selectorType="rect", values = []){
        console.log('here8', yStart)
        const colors = this.colors;
        svg.selectAll(selectorType)
        .data(data)
        .enter()
        .append('rect')
            .attr('id', (d, i) => "square-" + i) //or function(d, i) { return "square-" + i}
            .attr('y', marginSize + yStart)
            .attr('x', function(d, i) { return strokeSize/2 + i * (squareWidth) + marginSize; }) //Extra this.strokeSize + added in order to prevent part of the border from being cut off
            .attr('width', squareWidth)
            .attr('height', squareWidth)
            .attr('fill', function (d, i) {
                if (!values) {
                    return 'white'
                }
                for (let j = 0; j < Math.min(4, values.length); j++) {
                    if (values[j] == i) {
                        console.log(values, colors[j]);
                        return colors[j];
                    }
                }
                return 'white';
            })
            .attr('stroke', 'black')
            .attr('stroke-width', strokeSize)
            .attr('rx', curveAmount)
            .attr('ry', curveAmount);
    }
  
    writeText(svg, data, elementWidth, marginSize, strokeSize, seperationSize = 0, yStart = 0, selectorType = "text"){
        svg.selectAll(selectorType)
            .data(data)
            .enter()
            .append('text')
                .attr('y', (elementWidth)/2  + marginSize + yStart)
                .attr('x', function(d, i) { return i * (elementWidth + seperationSize) + elementWidth/2  + marginSize})
                .attr('text-anchor', 'middle') //text anchor middle vertically as well
                .text(d => d);
    }
  
    drawCircles(svg, data, circleDiameter, marginSize, strokeSize, seperationSize = 0, values = []) {
        const circleRadius = circleDiameter/2;
        const colors = this.colors;

        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
                .attr('id', (d, i) => "circle-" + i)
                .attr('cy', marginSize + circleRadius)
                .attr('cx', function(d, i) { return strokeSize/2 + i * (circleDiameter + seperationSize) + marginSize + circleRadius; })
                .attr('r', circleRadius)
                .attr('fill', function (d, i) {
                    if (!values) {
                        return 'white'
                    }
                    //console.log("here27", values, i)
                    for (let j = 0; j < Math.min(4, values.length); j++) {
                        //console.log("here28", values[j], i, data[i], values[j] != null, "val" in values[j], values[j].val == data[i]);
                        if (values[j] != null && "val" in values[j] && values[j].val == data[i]) {
                            return colors[j];
                        }
                    }
                    return 'white';
                })
                .attr('stroke', 'black')
                .attr('stroke-width', strokeSize);
    }

    drawDoubleArr(arr1, arr2) {
        const squareWidth = 50;
        const marginSize = 10;
        const strokeSize = this.strokeSize;
        const height = squareWidth * 2 + strokeSize + marginSize;
        const width = squareWidth * arr1.length + strokeSize + marginSize * 2;

        this.container.append('br');
        const svg = this.container.append('svg')
            .attr('class', 'svgHashmap')
            .attr('width', width)
            .attr('height', height);
        const group = svg.append("g")
            .attr('class', 'hashmap');
  
        this.drawSquares(group, arr1, squareWidth, marginSize, strokeSize, 0, 0, ".keys");
        this.writeText(group, arr1, squareWidth, marginSize, strokeSize, 0, 0, ".keyText");
        this.drawSquares(group, arr2, squareWidth, marginSize, strokeSize, 0, squareWidth, ".values"); //-- IDK why this is .values and not just values
        this.writeText(group, arr2, squareWidth, marginSize, strokeSize, 0, squareWidth, ".valueText");
    }

    writeVariableName(variable, marginSize){
        this.container.append('div')
            .style("margin-left", marginSize + 'px')
            .style('margin-top', '10px')
            .text(variable + ':');
    }
}