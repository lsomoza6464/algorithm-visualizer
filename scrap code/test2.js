const container = d3.select("#tree-container");
const nodes = [
    { id: 1, radius: 20 },
    { id: 2, radius: 20 },
    { id: 3, radius: 20 },
    { id: 4, radius: 20 },
    { id: 5, radius: 20 },
    { id: 6, radius: 20 }
];

const links = [
    { source: 1, target: 2 },
    { source: 1, target: 3 },
    { source: 2, target: 4 },
    { source: 2, target: 5 },
    { source: 3, target: 6 }
];

const width = 800;
const height = 600;

const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(0, 0))
    .force("collide", d3.forceCollide().radius(d => d.radius + 5)) // Add collision force
    .on("end", () => {
        // Step 2: Extract the node positions
        const nodePositions = nodes.map(node => ({
            id: node.id,
            x: node.x,
            y: node.y,
            radius: node.radius
        }));

        console.log(nodePositions);
        // Step 3: Draw the static graph using the extracted positions
        drawStaticGraph(nodePositions, links);
    });


function drawStaticGraph(nodes, links) {
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("x1", d => nodes.find(node => node.id === d.source).x)
        .attr("y1", d => nodes.find(node => node.id === d.source).y)
        .attr("x2", d => nodes.find(node => node.id === d.target).x)
        .attr("y2", d => nodes.find(node => node.id === d.target).y);

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 20)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    node.append("title")
        .text(d => d.id);
}
    
