//import { createRequire } from './module.js';
//const require = createRequire(import.meta.url);

//const esprima = require('esprima');
//const escodegen = require('escodegen');
//const Interpreter = require('js-interpreter');

//import * as esprima from './node_modules/esprima/dist/esprima.js';
//import * as escodegen from './node_modules/escodegen/escodegen.js';
//import * as Interpreter from './node_modules/js-interpreter/lib/js-interpreter.js';

class Parser {
    parseCode(code){
        try {
            // Parse the user code using Esprima
            const parsedCode = esprima.parseScript(code, { tolerant: true, loc: true, comment: true});
            console.log(parsedCode);
            analyzeAST(parsedCode);
            //return JSON.stringify(parsedCode, null, 4);

            function traverseAst(node, callback) {
                callback(node);
                for (const key in node) {
                    if (node.hasOwnProperty(key)) {
                        const child = node[key];
                        if (typeof child === 'object' && child !== null) {
                            traverseAst(child, callback);
                        }
                    }
                }
            }

            function analyzeAST(ast) {
                // Analyze the AST to identify data structures
                const variables = [];
                const dataStructures = [];
                // Traverse the AST and update dataStructures
                // Example: Identifying array operations
            
                ast.body.forEach(statement => {
                    if (statement.type === 'VariableDeclaration') {
                        handleVariableDeclarations(statement);
                    }
                    if (statement.type === 'ExpressionStatement') {
                        const expression = statement.expression;
                        if (expression.type === 'CallExpression' && expression.callee.property.name === 'push') {
                            const arrayName = expression.callee.object.name;
                            const value = expression.arguments[0].value;
                            if (dataStructures[arrayName]) {
                                dataStructures[arrayName].push(value);
                            }
                        }
                    }
                });
                console.log(dataStructures);
                return dataStructures;
                
                function handleVariableDeclarations(statement){
                    statement.declarations.forEach(declaration => {
                        if (declaration.init && (declaration.init.type === 'ArrayExpression')) {
                            dataStructures.push({
                                name: declaration.id.name,
                                structure: declaration.init.elements.map(el => el.value),
                                type: declaration.init.type
                            });
                            //dataStructures[declaration.id.name] = declaration.init.elements.map(el => el.value);
                        }

                        if (declaration.init && declaration.init.type === 'NewExpression') {
                            dataStructures.push({
                                name: declaration.id.name,
                                structure: declaration.init.elements.map(el => el.value),
                                type: declaration.init.type
                            });
                            //dataStructures[declaration.id.name] = declaration.init.elements.map(el => el.value);
                        }
                    });
                    function handleArrayDeclarations(){

                    }
                }
            }

            //return parsedCode;
        } catch (error) {
            // Return error message if parsing fails
            return 'Error parsing code: ' + error.message;
        }
    }
}