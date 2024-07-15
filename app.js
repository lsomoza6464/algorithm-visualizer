import { Visualizer } from './visualizer.js';
import { Parser } from './parser.js';
const form = document.getElementById('user-code-form');
form.addEventListener('submit', handleFormSubmit);
const visualizer = new Visualizer(600, 600);
const parser = new Parser();
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
    console.log('here');
    event.preventDefault();
    const userCodeTextarea = document.getElementById('user-code-textarea');
    const userCode = userCodeTextarea.value;
    const result = parser.parseCode(userCode);
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