import * as acorn from './lib/acorn.mjs';
import { generate } from './lib/astring.js';
//import * as vm from 'vm';
//let vm = require('vm');
//import vm from 'vm';
//import * as estraverse from './node_modules/estraverse/estraverse.js';


const userCode2 = `
let me = 2;
let arr = [1, 2, 3];
me = 3;
arr.append(1); 
arr.slice(1, 4);
let dict = new Map();
me = arr[0];
arr[1] = 4;
arr.push(4);
arr.splice(1, 1); // Remove the element at index 1
`;
const userCode = `
let me = 4 + 3 + 2 + 1;
let arr = [[[1]], 1, 2, 3];
me = arr[2];
me = arr[0][0][0];//arr[0] = me + arr[1] + 2 + 4;
arr[0] = me;
me = arr[1];
`;
const test = `
let matrix = [[[1], 2], [4, 5]];
let value = matrix[0][0][1];
`
let requestedVars = [];
let snapshots = [[]];
let ast;
const snapshotCode = `
    //__PAUSE__//
    // Capture snapshots of relevant variables
    snapshot = [];
    for (const varIndex in context) {
        if(typeof context[varIndex] !== 'undefined'){
            if (context.hasOwnProperty(varIndex)) {
                try {
                    snapshot.push({ 
                        name: context[varIndex],
                        type: typeof eval(context[varIndex]),
                        value: structuredClone(eval(context[varIndex]))
                    });
                    /*snapshot[varIndex] = { 
                        name: context[varIndex],
                        type: typeof eval(context[varIndex]),
                        value: structuredClone(eval(context[varIndex]))
                    };*/
                } catch(error) {
                    if (error instanceof ReferenceError) {
                        snapshot[varIndex] = {
                            name: context[varIndex],
                            type: 'undefined',
                            value: undefined
                        }
                    }
                }
            }
        }
    }
    snapshots.push(snapshot);
    selectedSnapshot = [];
    for (const varIndex in selectedContext) {
        if(typeof selectedContext[varIndex] !== 'undefined'){
            if (selectedContext.hasOwnProperty(varIndex)) {
                try {
                    selectedSnapshot.push({ 
                        name: selectedContext[varIndex],
                        type: typeof eval(selectedContext[varIndex]),
                        value: structuredClone(eval(selectedContext[varIndex]))
                    });
                } catch(error) {
                    if (error instanceof ReferenceError) {
                        selectedSnapshot[varIndex] = {
                            name: selectedContext[varIndex],
                            type: 'undefined',
                            value: undefined
                        }
                    }
                }
            }
        }
    }
    selectedSnapshots.push(selectedSnapshot);
`;

  function improvedTraverseAndInjectSnapshots(node, includedVariables = [], selectedVariables = [], parentNode = null, parentkey = null) {
    let bodyArr = [];
    const snapshotAst = acorn.parse(snapshotCode);
    console.log(includedVariables);
    const originalVars = `
        let snapshots = [];
        let snapshot = new Map();
        const context = ${JSON.stringify(includedVariables)};
        let selectedSnapshots = [];
        let selectedSnapshot = new Map();
        const selectedContext = ${JSON.stringify(selectedVariables)};
    `;
    console.log('origin', originalVars);

    console.log(acorn.parse(originalVars));
    bodyArr.push(acorn.parse(originalVars));

    console.log('currNode', node);
    let currBody;
    if (node.body.body) {
        currBody = node.body.body
    } else {
        currBody = node.body
    }
    for (const line of currBody) {
        bodyArr.push(line);
        for (const snapLine of snapshotAst.body) {
            bodyArr.push(snapLine);
        }
        const loopTypes = new Set([
            'WhileStatement',
            'ForStatement',
            'ForInStatement',
            'ForOfStatement',
            'DoWhileStatement'
        ]);
        
        if (loopTypes.has(line.type)) {
            // For all loops
            traverseLoopsAndInjectSnapshots(line, includedVariables, selectedVariables, node.body, 'body');
        } /*else if (line.type === 'IfStatement') {
            // For if/else blocks
            traverseLoopsAndInjectSnapshots(line, includedVariables, selectedVariables, node.consequent, 'consequent');
            if (line.alternate) {
                traverseLoopsAndInjectSnapshots(line, includedVariables, selectedVariables, node.alternate, 'alternate');
            }
        }*/
    }
    const returnStatement = `console.log(snapshots);
    const variableMap = new Map()
    variableMap.set('snapshots', snapshots);
    variableMap.set('selectedSnaphots', selectedSnapshots);
    const snapshotObject = {snapshots: snapshots, selectedSnapshots: selectedSnapshots};
    console.log('booyeah', snapshotObject);`;
    bodyArr.push(acorn.parse(returnStatement));
    const returnStatementNode = {
        type: 'ReturnStatement',
        argument: {
          type: 'Identifier',
          //name: 'snapshots'
          name: 'snapshotObject'
        }
    };
    bodyArr.push(returnStatementNode);
    const iifeExpression = {
        type: 'CallExpression',
        callee: {
            type: 'FunctionExpression',
            id: null,
            params: [],
            body: {
                type: 'BlockStatement',
                body: bodyArr 
            }
        },
        arguments: []
    };
    const newStatement = {
        type: 'ExpressionStatement',
        expression: iifeExpression
    };
    node.body = [];
    console.log(node.body);
    node.body.push(newStatement);
    if (!parentNode && !parentkey) {
        const newBlock = {
            type:"BlockStatement",
            body: [node]
        }
        ast = newBlock;
    }
  }

  function traverseLoopsAndInjectSnapshots(node, includedVariables = [], selectedVariables = [], parentNode = null, parentkey = null) {

    let bodyArr = [];
    const snapshotAst = acorn.parse(snapshotCode);
    console.log(includedVariables);
    /*const originalVars = `
        //let snapshot = new Map();
        const context = ${JSON.stringify(includedVariables)};
        let selectedSnapShot = new Map();
        const selectedContext = ${JSON.stringify(selectedVariables)};
    `;
    console.log('origin', originalVars);

    console.log(acorn.parse(originalVars));
    bodyArr.push(acorn.parse(originalVars));*/

    console.log('currNode', node);
    let statements;
    /*if (node.type === 'IfStatement') {
        // For if statements, we need to handle consequent and alternate separately
        statements = node.consequent.body || [node.consequent];
    } else {*/
        // For loops, use the body property
        statements = node.body.body || node.body;
    //}
    for (const line of statements) {
        bodyArr.push(line);
        for (const snapLine of snapshotAst.body) {
            bodyArr.push(snapLine);
        }
        const loopTypes = new Set([
            'WhileStatement',
            'ForStatement',
            'ForInStatement',
            'ForOfStatement',
            'DoWhileStatement'
        ]);
        
        if (loopTypes.has(line.type)) {
            // For all loops
            traverseLoopsAndInjectSnapshots(line, includedVariables, selectedVariables, node.body, 'body');
        }
    }
   node.body.body = bodyArr;
  }

  /*function traverseAndInjectSnapshots(node, parentNode = null, parentKey = null) {
    const snapshotCode = `
        //__PAUSE__//
        
        // Capture snapshots of relevant variables
        let snapshot = {};
        for (const varName in this) {
          if (this.hasOwnProperty(varName)) {
            snapshot[varName] = { 
              type: typeof this[varName],
              value: structuredClone(this[varName])
            };
          }
        }
        snapshots.push(snapshot);
      `;

    // Identify points where you want to inject the snapshot code
    if (node.type === 'ExpressionStatement' || 
        node.type === 'VariableDeclaration') {

        // Parse the snapshotCode into an AST
        const snapshotAst = acorn.parse(snapshotCode);
        console.log('snapshot', snapshotAst);

        // If the current node is a BlockStatement, append the snapshot code to its body
        if (node.type === 'BlockStatement') {
            console.log('here');
            for (const line of snapshotAst.body) {
                node.body.push(line);
            }
        } else {
            // Otherwise, create a new BlockStatement to wrap the current node and the snapshot code
            let bodyArr = [];
            for (const line of snapshotAst.body) {
                bodyArr.push(line);
            }
            const newBlock = {
                type: 'BlockStatement',
                body: [node, ...snapshotAst.body]
            };

            if (parentNode && parentKey) {
                if (Array.isArray(parentNode[parentKey])) {
                    // If the child is in an array, find its index and replace it
                    const index = parentNode[parentKey].indexOf(node);
                    if (index !== -1) {
                        parentNode[parentKey][index] = newBlock;
                    }
                } else {
                    // If the child is a direct property, replace it directly
                    parentNode[parentKey] = newBlock;
                }
            } else {
                // If there's no parent (root node), replace the entire AST
                ast = newBlock; 
            }
        }
    }*
  
    // Recursively traverse child nodes
    for (const key in node) {
      if (node.hasOwnProperty(key)) {
        const child = node[key];
        if (typeof child === 'object' && child !== null) {
          if (Array.isArray(child)) {
            child.forEach(childNode => traverseAndInjectSnapshots(childNode, node, key));   
          } else {
            traverseAndInjectSnapshots(child, node, key);
          }
        }
      }
    }
  }*/

/*function executeCodeWithPauses(instrumentedCode) {
    const context = { 
      // ... your sandbox context
    };
  
    return new Promise(async (resolve) => {
      const codeChunks = instrumentedCode.split('//__PAUSE__//\n'); // Split based on your custom delimiter
  
      for (const chunk of codeChunks) {
        eval(chunk); // Execute the current chunk in the context
        await new Promise(resolve => setTimeout(resolve, 0)); 
      }
  
      resolve();
    });
  }*/




let variableStates = [];
const snapShot = new Map();

//parseCode(userCode);


/*const worker = new Worker('worker.js');
worker.onmessage = function(event) {
    const { snapshots } = event.data;
    // ... Use the snapshots for visualization (e.g., update your D3.js visualization)
}; */

export function parseCode(userCode, includedVariables = [], selectedVariables = []) {
    const parser = acorn.Parser;
    ast = parser.parse(userCode, { sourceType: 'module' });
    improvedTraverseAndInjectSnapshots(ast, includedVariables, selectedVariables);
    const instrumentedCode = generate(ast);
    console.log('new code', instrumentedCode);
    const snapshots = eval(instrumentedCode);
    console.log(snapshots);
    return snapshots
}

function getVariableStates(ast) {
    let i = 0;
    ast.body.forEach(node => {
        console.log(i);
        if (isInitialization(node)) {
            initializeVar(node);
        } else if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression') {
            modifyVar(node);
        }
        i += 1;
        console.log(snapShot);
    });
}

function getSnapCopy(snapShot) {
    let snapCopy = new Map();
    snapShot.forEach((value, key) => {
        const copiedKey = (typeof key === 'object' && key !== null) ? structuredClone(key) : key;
        const copiedValue = (typeof value === 'object' && value !== null) ? structuredClone(value) : value;
        snapCopy.set(copiedKey, copiedValue);
    });
    return snapCopy;
}

function modifyVar(node) {

    const name = (node.expression.left.type === "Identifier") ? node.expression.left.name : node.expression.left.object.name;
    let value = getValue(node.expression.right);
    //console.log('val', snapShot, value);
    if (node.expression.right === "Identifier") {

    }
    snapShot.set(name, value);
    const snapCopy = getSnapCopy(snapShot);
    variableStates.push(snapCopy);
}


function initializeVar(node) {
    node.declarations.forEach(decl => {
        const varName = decl.id.name;
        const variable = eval(generate(decl.init)); // Infer type
        snapShot.set(varName, variable);
        const snapCopy = getSnapCopy(snapShot);
        variableStates.push(snapCopy);
    });
}

function getValue(node, largerStructure = null) {
    //eval(generate(right));
    if (node.type == 'Literal') {
        return node.value;
    } else if (node.type == 'Identifier' && !largerStructure) {
        return snapShot.get(node.name);
    } else if (node.type == 'Identifier' && largerStructure) {
        return largerStructure
    }else if (node.type == 'MemberExpression' && !largerStructure) {
        let obj = node.object;
        while (obj.object) {
            obj = obj.object;
        }
        const dataStructure = snapShot.get(obj.name);
        console.log(dataStructure);
        return getValue(node.object, dataStructure[node.property.value]);
    } else if (node.type == 'MemberExpression' && largerStructure) {
        let value;
        if (node.object.type == "Identifier") {
            value = largerStructure[getValue(node.property)];
        } else {
            value = getValue(node.object, largerStructure[getValue(node.property)]);
        }
        console.log('val', value, largerStructure);
        return value; //will need a getValue recursion
    }
}

function isInitialization(node){
    return node.type === 'VariableDeclaration';
}

function isModifyVar(node) {
    return node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression';
}