export class Visualizer {
    constructor(width, height){
        this.container = d3.select('#visualization-container')
        .attr('width', width)
        .attr('height', height);
        this.strokeSize = 2.5;
    }

    //progromatically add svgs into the div as new data structures are added so you do not have to deal with structure counters
    //The first element is a little smaller of a separator than the other elements, not a big issue but maybe look into

    visualizeArr(arr){
        const squareWidth = 50;
        const marginSize = 10;
        const strokeSize = this.strokeSize

        const svg = this.container.append('svg')
            .attr('class', 'svgArr')
            .attr('width', 600)
            .attr('height', squareWidth + strokeSize + marginSize);

        this.drawSquares(svg, arr, squareWidth, marginSize, strokeSize);
        this.writeText(svg, arr, squareWidth, marginSize, strokeSize);
    }

    visualizeLinkedList(list){
        //circle attributes
        const circleDiameter = 50;
        const circleRadius = circleDiameter / 2;
        const marginSize = 10;
        const strokeSize = this.strokeSize;
        
        //arrow attributes
        const arrowLength = 10;

        this.container.append('br');
        const svg = this.container.append('svg')
            .attr('class', 'svgList')
            .attr('width', 600)
            .attr('height', circleDiameter + strokeSize + marginSize);
        
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
            .data(list)
            .enter()
            .append('line')
                .attr('x1', function(d, i) { return strokeSize/2 + i * (circleDiameter + arrowLength) + marginSize + circleDiameter; })
                .attr('y1', strokeSize/2 + marginSize + circleRadius)
                .attr('x2', function(d, i) { return strokeSize/2 + i * (circleDiameter + arrowLength) + marginSize + circleDiameter + arrowLength; })
                .attr('y2', strokeSize/2 + marginSize + circleRadius)
                .attr('stroke', 'black')
                .attr("marker-end", "url(#arrow-head)");
        
        this.drawCircles(svg, list, circleDiameter, marginSize, strokeSize, arrowLength);
        this.writeText(svg, list, circleDiameter, marginSize, strokeSize, arrowLength);
    }

    visualizeSet(set) {
        const squareWidth = 50;
        const marginSize = 10;
        const curveAmount = 10;
        const strokeSize = this.strokeSize;

        const svg = this.container.append('svg')
            .attr('class', 'svgArr')
            .attr('width', 600)
            .attr('height', squareWidth + strokeSize + marginSize);

        this.drawSquares(svg, set, squareWidth, marginSize, strokeSize, curveAmount);
        this.writeText(svg, set, squareWidth, marginSize, strokeSize);
    }

    visualizeHashmap(hashmap) {
        const keys = Object.keys(hashmap);
        let hashKeys = [];
        let hashValues = [];
        for (const key of keys) {
            hashKeys.push(key);
            hashValues.push(hashmap[key]);
        }

        const squareWidth = 50;
        const marginSize = 10;
        const strokeSize = this.strokeSize;
        const svg = this.container.append('svg')
            .attr('class', 'svgHashmap')
            .attr('width', 600)
            .attr('height', squareWidth * 2 + strokeSize + marginSize);
        const group = svg.append("g")
            .attr('class', 'hashmap');

        
        
        this.drawSquares(group, hashKeys, squareWidth, marginSize, strokeSize, 0, 0, ".keys");
        this.writeText(group, hashKeys, squareWidth, marginSize, strokeSize, 0, 0, ".keyText");
        this.drawSquares(group, hashValues, squareWidth, marginSize, strokeSize, 0, squareWidth, ".values");
        this.writeText(group, hashValues, squareWidth, marginSize, strokeSize, 0, squareWidth, ".valueText");
    }

    visualizeTree(root) { //create a 2d array that is full of each node's value and the amount of leaf nodes that it has (find
    //the leaf nodes through a recursive function that takes the amount of leaf nodes of each of its children then use the amount of leaf nodes to determine the spacing of the nodes)
        //node attributes
        const circleDiameter = 50;
        const circleRadius = circleDiameter / 2;
        const marginSize = 10;
        const strokeSize = this.strokeSize;
        
        //tree attributes
        const seperationSize = 10;
        //const treeWidth = countLeafNodes(root) * (circleDiameter + seperationSize) - seperationSize; //get rid of the last separator
        const treeDepth = findtreeDepth(root);
        let nodeMatrix = [];
        populateNodeMatrix(root);
        console.log(nodeMatrix);

        const treeWidth = nodeMatrix[0][0].leafNodes * (circleDiameter + seperationSize) + strokeSize; //find the amount of leaf nodes and multiply it
        const treeHeight = (circleDiameter + seperationSize) * treeDepth + strokeSize + marginSize;
        this.container.append('br') //might need to add breaks in a lot of other areas as well
        const svg = this.container.append('svg')
            .attr('class', 'svgTree')
            .attr('width', 1000) //treeWidth
            .attr('height', 800); //treeHeight

        drawNodeCircles(nodeMatrix);
        drawNodeArrows(nodeMatrix);
        
        function populateNodeMatrix(node){
            let previousLeafs = new Array(treeDepth);
            for(let i = 0; i < treeDepth; i++){
                nodeMatrix.push(new Array());
                previousLeafs[i] = 0;
            }
            recurseNodes(node, 0, 0);

            function recurseNodes(node,depth){
                let leafNodes = 0;
                if(node.children){
                    for(const child of node.children){
                        leafNodes += recurseNodes(child,depth + 1);
                    }
                } else {
                    leafNodes = 1;
                }
                const totalLeafs = previousLeafs[depth] + leafNodes / 2;
                //console.log(node.value + ", " + previousLeafs[depth] + ", " + leafNodes + ", " + totalLeafs);
                nodeMatrix[depth].push({"node": node, "xVal": strokeSize/2 + (circleDiameter + seperationSize) * (totalLeafs) + marginSize, "yVal": marginSize + circleRadius + (seperationSize + circleDiameter) *depth});//rewrite later as points instead of arrays
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
                        .text(d => d.node.value);
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
            for(let row = 0; row < nodeMatrix.length - 1; row++){
                for(let col = 0; col < nodeMatrix[row].length; col++){
                    const matrixElem = nodeMatrix[row][col];
                    console.log(matrixElem);
                    if(matrixElem.node.children){
                        svg.selectAll('.line-' + matrixElem.value)
                            .data(matrixElem.node.children)
                            .enter()
                            .append('line')
                                .attr('x1', matrixElem.xVal)
                                .attr('y1', matrixElem.yVal)
                                .attr('x2', function(d, i) { return matrixElem.node.children[i].xVal })
                                .attr('y2', function(d, i) { return matrixElem.node.children[i].yVal })
                                .attr("marker-end", "url(#arrow-head)");
                    }
                }
            }
        }
        /*function drawNodeCircles(nodeMatrix){
            for(let row = 0; row < treeDepth; row++){
                let leafNodes = 0;
                svg.selectAll('.circle' + row)
                    .data(nodeMatrix[row])
                    .enter()
                    .append('circle')
                        .attr('id', (d, i) => "circle-" + i)
                        .attr('cy', marginSize + circleRadius + (seperationSize + circleDiameter) * row)
                        .attr('cx', function(d, i) { 
                            leafNodes += nodeMatrix[row][i].leafNodes;
                            return strokeSize/2 + (circleDiameter + seperationSize) * (leafNodes - nodeMatrix[row][i].leafNodes/2) + marginSize; })
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
                        .attr('y', marginSize + circleRadius + (seperationSize + circleDiameter) * row)
                        .attr('x', function(d, i) { 
                            leafNodes += nodeMatrix[row][i].leafNodes;
                            return strokeSize/2 + (circleDiameter + seperationSize) * (leafNodes - nodeMatrix[row][i].leafNodes/2) + marginSize; })
                        .attr('text-anchor', 'middle')
                        .text(d => d.node.value);
            }
        }*/
        
        /*function populateNodeMatrix(node){
            for(let i = 0; i < treeDepth; i++){
                nodeMatrix.push(new Array());
            }
            recurseNodes(node, 0);

            function recurseNodes(node,depth){
                if(node.children){
                    let leafNodes = 0;
                    for(const child of node.children){
                        leafNodes += recurseNodes(child,depth + 1);
                    }
                    nodeMatrix[height].push({"value": node.node.value, "leafNodes": leafNodes});//rewrite later as points instead of arrays
                    return leafNodes;
                }
                else {
                    nodeMatrix[height].push({"value": node.node.value, "leafNodes":1});//rewrite later as points instead of arrays
                    return 1;
                }
            }
        }*/

        function findtreeDepth(node){//maybe rename to treeDepth
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
    }

    drawSquares(svg, data, squareWidth, marginSize, strokeSize, curveAmount = 0, yStart = 0, selectorType="rect"){
        //console.log(data)
        svg.selectAll(selectorType)
        .data(data)
        .enter()
        .append('rect')
            .attr('id', (d, i) => "square-" + i) //or function(d, i) { return "square-" + i}
            .attr('y',marginSize + yStart)
            .attr('x', function(d, i) { return strokeSize/2 + i * (squareWidth) + marginSize; }) //Extra this.strokeSize + added in order to prevent part of the border from being cut off
            .attr('width', squareWidth)
            .attr('height', squareWidth)
            .attr('fill', 'white')
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

    drawCircles(svg, data, circleDiameter, marginSize, strokeSize, seperationSize = 0) {
        const circleRadius = circleDiameter/2;

        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
                .attr('id', (d, i) => "circle-" + i)
                .attr('cy', marginSize + circleRadius)
                .attr('cx', function(d, i) { return strokeSize/2 + i * (circleDiameter + seperationSize) + marginSize + circleRadius; })
                .attr('r', circleRadius)
                .attr('fill', 'white')
                .attr('stroke', 'black')
                .attr('stroke-width', strokeSize);
    }
}