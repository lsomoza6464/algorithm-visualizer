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
`;
*/
let progressBar = null;

// Wait for DOM to be ready before accessing elements
document.addEventListener('DOMContentLoaded', () => {
    const userCodeform = document.getElementById('user-code-form');
    if (userCodeform) {
        userCodeform.addEventListener('submit', handleFormSubmit);
    }
});
// generateLeetCodeProblemsList(); // Remove - Node.js only

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
    const userCodeTextarea = document.getElementById('user-code-hidden-input');
    //const userCode = userCodeTextarea;
    //console.log('uCode', userCode);
    const userCode = window.getMonacoCode(); 
    console.log("user code:", userCode);
    const selectedMap = getSelectedMap()
    console.log(selectedMap);
    const selectedVariables = getSelectedVariables(selectedMap);
    const includedVariables = document.getElementById('included-variables').value.split(',').map((value) => value.trim());
    let snapshotObject = parseCode(userCode, includedVariables, selectedVariables);
    snapshotObject.selectedMap = selectedMap;
    console.log(snapshotObject);
    const visualizer = new Visualizer(600, 600);
    clearContainers();
    progressBar = new ProgressBar(visualizer, snapshotObject, window);
    let leftButton = new DirectionButton('left', progressBar);
    let rightButton = new DirectionButton('right', progressBar);
    progressBar.visualizeValueChange();

    // Save to localStorage for history page
    localStorage.setItem('lastCode', userCode);
    localStorage.setItem('lastIncludedVars', includedVariables.join(','));
    localStorage.setItem('lastSelectedVars', selectedVariables.join(','));

    // Show the save visualization button
    const saveBtn = document.getElementById('save-visualization-btn');
    if (saveBtn) {
        saveBtn.classList.remove('hidden');
    }

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
    d3.select('#visualization-container').html('');
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