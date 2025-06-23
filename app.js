import { Visualizer } from './visualizer.js';
import { parseCode } from './parser.js';
import { ProgressBar } from './progress-bar.js';
import { DirectionButton } from './direction-button.js'
import { ListNode } from './listNode.js';
import { TreeNode } from './treeNode.js';
import { GraphNode } from './graphNode.js';
//import React from 'react';
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
let progressBar = null;
const userCodeform = document.getElementById('user-code-form');
userCodeform.addEventListener('submit', handleFormSubmit);
//const sliderForm = document.getElementById('slider-form');
//sliderForm.addEventListener('submit', handleSliderDirection);

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
    const userCode = userCodeTextarea.value;
    const selectedMap = getSelectedMap()
    console.log(selectedMap);
    const selectedVariables = getSelectedVariables(selectedMap);
    const includedVariables = document.getElementById('included-variables').value.split(',').map((value) => value.trim());
    let snapshotObject = parseCode(userCode, includedVariables, selectedVariables);
    snapshotObject.selectedMap = selectedMap;
    console.log(snapshotObject);
    const visualizer = new Visualizer(600, 600);
    clearContainers();
    progressBar = new ProgressBar(visualizer, snapshotObject);
    let leftButton = new DirectionButton('left', progressBar);
    let rightButton = new DirectionButton('right', progressBar);
    progressBar.visualizeValueChange();
    return userCode;
}

function getSelectedVariables(selectedMap) {
    let selectedSet = new Set();
    selectedMap.forEach((value) => {
        for (const variable of value) {
            selectedSet.add(variable)
        }
    });
    return new Array(...selectedSet);
}

function getSelectedMap() {
    const selectedVariablesRaw = document.getElementById('selected-variables').value.split(';').map((value) => value.trim());
    const selectedVariables = selectedVariablesRaw.map((variable) => {
        const variableObject = {name: variable.split(':')[0].trim()};
        const selected = variable.split(':')[1].split(',').map((value) => value.trim());
        variableObject.selected = selected;
        return variableObject;
    });
    console.log('selected', selectedVariables);
    let selectedMap = new Map();
    for (let j = 0; j < selectedVariables.length; j++) {
        selectedMap.set(selectedVariables[j].name, selectedVariables[j].selected);
    }
    return selectedMap;
}

function clearContainers() {
    d3.select('#slider-container').html('');
    d3.select('#left-container').html('');
    d3.select('#right-container').html('');
    //d3.select('visualization-container').html('');
}

/*function handleSliderDirection(event) {
    event.preventDefault();
    const sliderSvg = document.getElementById('sliderSvg');
    console.log(sliderSvg);
    console.log('innertext', event); //big bug innertext undefined (fix later)
    if (event.innerText === 'left') {
        progressBar.deterateProgressBar();
        //xprogressBar.visualizeValueChange();
        //progressBar.clearContainer()
        //progressBar.visualizeBar();
    } else {
        progressBar.iterateProgressBar();
        //progressBar.visualizeValueChange();
        //progressBar.clearContainer();
        //progressBar.visualizeBar();
    }
}*/

export function handleLeftClicked() {
    progressBar.deterateProgressBar();
}

export function handleRightClicked() {
    progressBar.iterateProgressBar();
}

const userArr = [1, 2, 3, 10, 20, 30 , 40, 50, 60, 100, 10, 1, 1, 1,1,1,11,1,1,1,1,11,1,1];
const myArr = [40, 20 , 10000];
const mySet = new Set([1, 2, 3, 5, 6]);
/*const myLinkedList = {
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
}*/
const myLinkedList = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4))));
console.log("myLinkedList", myLinkedList);
let hashmap = {
    "key":"value",
    1:10,
    23:4
}
const tree = new TreeNode("A", new TreeNode("B", new TreeNode("D"), new TreeNode("T")), new TreeNode("F", new TreeNode("G"), new TreeNode("H"), new TreeNode("I"), new TreeNode("J"), new TreeNode("K", new TreeNode("R"), new TreeNode("Q", new TreeNode("W")))));
/*const graph = new GraphNode("A", [
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
);*/
const graph = new GraphNode("A", [
    new GraphNode("B", [new GraphNode("D", [new GraphNode("G")])]),
    new GraphNode("C", [new GraphNode("E"), new GraphNode("F"), new GraphNode("A")]),
    new GraphNode("G"),
    new GraphNode("H"),
    new GraphNode("I"),
    new GraphNode("J"),
    new GraphNode("K"),
    new GraphNode("L")
]);
const graph2 = new GraphNode("A", [new GraphNode("B")]);
const matrix = [[0, 1, 2, 3], [4, 4, 4, 4], [5, 4, 3, 2]];
//visualizer.visualize('userArr', userArr);
//progressBar.visualizeBar(snapshots.length);
const visualizer = new Visualizer(600, 600);
visualizer.visualize('ha', 'here');
visualizer.visualizeArr('userArr', userArr);
visualizer.visualizeSet('mySet', mySet);
visualizer.visualizeLinkedList('myLinkedList', myLinkedList);
visualizer.visualizeLinkedList('myLinkedList', myLinkedList, true);
visualizer.visualizeHashmap('hashmap', hashmap);
visualizer.visualizeMatrix('matrix', matrix);
visualizer.visualizeTree('tree', tree);
visualizer.visualizeGraph('graph', graph);
visualizer.visualizeGraph('graph2', graph2, false);

document.getElementById("user-code-form").addEventListener('submit', async(event) => {
    event.preventDefault();
    //const userCode = document.getElementById("user-code");
    //visualizer.visualize();
});