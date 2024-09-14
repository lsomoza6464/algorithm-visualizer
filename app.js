import { Visualizer } from './visualizer.js';
import { parseCode } from './parser.js';
import { ProgressBar } from './progress-bar.js';
//import { map } from './lib/';
//const Visualizer = require('./visualizer.js');
//const Parser = require('./parser.js');
/*
const userCode = `
let me = 4 + 3 + 2 + 1;
let arr = [[[1]], 1, 2, 3];
me = arr[2];
me = arr[0][0][0];//arr[0] = me + arr[1] + 2 + 4;
arr[0] = me;
me = arr[1];
for (let i = 0; i < 4; i++) {
    arr.push(i);
}
`;
*/

const userCodeform = document.getElementById('user-code-form');
userCodeform.addEventListener('submit', handleFormSubmit);
const sliderForm = document.getElementById('slider-form');
sliderForm.addEventListener('submit', handleSliderDirection);
let progressBar = null;

//const snapshots = parseCode(userCode);
//console.log(snapshots);
//const visualizer = new Visualizer(600, 600);
//const progressBar = new ProgressBar(visualizer, snapshots);
//const parser = new Parser();
/*
const escodegen = require('escodegen');
const estraverse = require('estraverse');
const acorn = require('acorn');

// Example usage
const code = 'function sayHello() { console.log("Hello, world!"); } sayHello();';
const ast = acorn.parse(code);

estraverse.traverse(ast, {
    enter(node) {
        console.log(node.type);
    }
});

const generatedCode = escodegen.generate(ast);
console.log(generatedCode);
*/

function handleFormSubmit(event) {
    event.preventDefault();
    const userCodeTextarea = document.getElementById('user-code-textarea');
    const includedVariables = document.getElementById('included-variables').value.split(',').map((value) => value.trim());
    console.log('included', includedVariables)
    const userCode = userCodeTextarea.value;
    const snapshots = parseCode(userCode, includedVariables);
    const visualizer = new Visualizer(600, 600);
    clearSlider();
    progressBar = new ProgressBar(visualizer, snapshots);
    progressBar.visualizeBar(snapshots.length);
    return userCode;
}

function clearSlider() {
    d3.select('#slider-container').html('');
}

function handleSliderDirection(event) {
    event.preventDefault();
    const sliderSvg = document.getElementById('sliderSvg');
    console.log(sliderSvg);
    if (event.innerText === 'left') {
        progressBar.iterateProgressBar();
        progressBar.clearContainer()
        progressBar.visualizeBar();
    } else {
        console.log('right');
        progressBar.iterateProgressBar();
        progressBar.clearContainer();
        progressBar.visualizeBar();
    }
}

const userArr = [1, 2, 3, 10, 20, 30 , 40, 50, 60, 100, 10, 1, 1, 1,1,1,11,1,1,1,1,11,1,1];
const myArr = [40, 20 , 10000];
const mySet = new Set([1, 2, 3, 5, 6]);
const myLinkedList = {
    value:1,
    next:{
        value:2, 
        next:{
            value:3,
            next:{
                value:4
            }
        }
    }
}
let hashmap = {
    "key":"value",
    1:10,
    23:4
}
const tree = {
    value: "A",
    children: [
        {
            value:"B",
            children: [
                {value: "D"}, 
                {value: "T"}
            ]
        }, 
        {
            value: "F",
            children: [
                {value: "G"},
                {value: "H"},
                {value: "I"},
                {value: "J"},
                {value: "K",
                    children: [
                        {value: "R"},
                        {   
                            value: "Q",
                            children: [{value:"W"}]
                        }
                    ]
                }
            ]
        }
    ]
}
const graph = {
    value: "A",
    neighbors: [
        {
            value: "B",
            neighbors: [
                {
                    value:"D",
                    neighbors: [
                        {value:"G"}
                    ]
                }
            ]
        },
        {
            value: "C",
            neighbors: [
                {value: "E"},
                {value: "F"},
                {value: "A"}
            ]
        },
        {value:"G"},
        {value:"H"},
        {value:"I"},
        {value:"J"},
        {value:"K"},
        {value:"L"}
    ]
}
const graph2 = {
    value: "A",
    neighbors: [
        {value:"B"}
    ]
}
const visualizer = new Visualizer(600, 600);
//visualizer.visualize('userArr', userArr);
//progressBar.visualizeBar(snapshots.length);
visualizer.visualize('ha', 'here');
visualizer.visualizeArr('userArr', userArr);
visualizer.visualizeSet('mySet', mySet);
visualizer.visualizeLinkedList('myLinkedList', myLinkedList);
visualizer.visualizeLinkedList('myLinkedList', myLinkedList, true);
visualizer.visualizeHashmap('hashmap', hashmap);
visualizer.visualizeTree('tree', tree);
visualizer.visualizeGraph('graph', graph);
visualizer.visualizeGraph('graph2', graph2, false);

document.getElementById("user-code-form").addEventListener('submit', async(event) => {
    event.preventDefault();
    //const userCode = document.getElementById("user-code");
    //visualizer.visualize();
});