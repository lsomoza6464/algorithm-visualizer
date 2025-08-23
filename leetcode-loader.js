/**
 * LeetCode Problem Loader for Debug Visualizer
 * Handles loading LeetCode solutions and preparing them for visualization
 */

/**
 * Fetches the LeetCode problems list from the JSON file
 * @returns {Promise<Array>} Array of problem objects with id, title, and slug
 */
async function fetchLeetCodeProblemsList() {
    try {
        const response = await fetch('./leetcode-problems.json');
        if (!response.ok) {
            throw new Error('Failed to fetch problems list');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading LeetCode problems list:', error);
        return [];
    }
}

/**
 * Finds a problem by number in the problems list
 * @param {number} problemNumber - The LeetCode problem number
 * @param {Array} problemsList - Array of problem objects
 * @returns {Object|null} Problem object or null if not found
 */
function findProblemByNumber(problemNumber, problemsList) {
    return problemsList.find(problem => problem.id === parseInt(problemNumber)) || null;
}

/**
 * Loads the JavaScript solution file for a given problem slug
 * @param {string} slug - The problem slug (e.g., "two-sum")
 * @returns {Promise<string>} The JavaScript code content
 */
async function loadJavaScriptSolution(slug) {
    try {
        // Try to find the corresponding file
        const problemNumber = await getProblemNumberFromSlug(slug);
        const paddedNumber = String(problemNumber).padStart(4, '0');
        const filename = `${paddedNumber}-${slug}.js`;
        
        const response = await fetch(`./leetcode-solutions/javascript/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load solution file: ${filename}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading JavaScript solution:', error);
        return getDefaultCode(slug);
    }
}

/**
 * Gets the problem number from a slug by looking it up in the problems list
 * @param {string} slug - The problem slug
 * @returns {Promise<number>} The problem number
 */
async function getProblemNumberFromSlug(slug) {
    const problemsList = await fetchLeetCodeProblemsList();
    const problem = problemsList.find(p => p.slug === slug);
    return problem ? problem.id : 1;
}

/**
 * Extracts variables from JavaScript code that could be useful for visualization
 * @param {string} code - The JavaScript code
 * @returns {Object} Object containing suggested variables and mappings
 */
function extractVisualizationVariables(code) {
    const variables = new Set();
    const mappings = [];
    
    // Common patterns to look for
    const patterns = [
        // Arrays
        /(?:let|const|var)\s+(\w+)\s*=\s*\[/g,
        // Numbers/targets
        /(?:let|const|var)\s+(target|sum|k|n|length|size|count|index|curr|prev|next|start|end|left|right|mid|middle)\s*=/g,
        // Objects/Maps
        /(?:let|const|var)\s+(\w*(?:map|set|hash|cache|memo|dp|table)\w*)\s*=/g,
        // Pointers
        /(?:let|const|var)\s+(head|tail|curr|current|prev|previous|next|fast|slow|dummy)\s*=/g,
        // Tree/Graph nodes
        /(?:let|const|var)\s+(root|node|left|right|parent|child|neighbor)\s*=/g,
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(code)) !== null) {
            variables.add(match[1]);
        }
    });
    
    // Convert to arrays for easier handling
    const variableArray = Array.from(variables);
    
    // Create some intelligent mappings based on common LeetCode patterns
    if (variableArray.includes('nums') || variableArray.some(v => v.includes('arr'))) {
        const arrayVars = variableArray.filter(v => v.includes('arr') || v === 'nums');
        const pointerVars = variableArray.filter(v => ['left', 'right', 'start', 'end', 'i', 'j', 'k', 'index', 'curr', 'prev', 'next'].includes(v));
        if (arrayVars.length > 0 && pointerVars.length > 0) {
            mappings.push(`${arrayVars[0]}:${pointerVars.join(', ')}`);
        }
    }
    
    // Tree/Linked List mappings
    const nodeVars = variableArray.filter(v => ['head', 'tail', 'curr', 'current', 'prev', 'next', 'node'].includes(v));
    const treeVars = variableArray.filter(v => ['root', 'left', 'right', 'node'].includes(v));
    
    if (nodeVars.length > 0) {
        const listVar = variableArray.find(v => v.includes('list') || v === 'head');
        if (listVar) {
            mappings.push(`${listVar}:${nodeVars.join(', ')}`);
        }
    }
    
    if (treeVars.length > 0) {
        const treeVar = variableArray.find(v => v.includes('tree') || v === 'root');
        if (treeVar) {
            mappings.push(`${treeVar}:${treeVars.join(', ')}`);
        }
    }
    
    return {
        includedVariables: variableArray,
        selectedVariables: mappings
    };
}

/**
 * Processes the JavaScript code to make it visualizer-friendly
 * @param {string} originalCode - The original LeetCode solution
 * @param {string} problemSlug - The problem slug for context
 * @returns {string} Processed code ready for visualization
 */
function processCodeForVisualization(originalCode, problemSlug) {
    let processedCode = originalCode;
    
    // Add sample data based on problem type
    const sampleData = generateSampleData(problemSlug);
    processedCode = sampleData + '\n\n' + processedCode;
    
    // Add any necessary imports or utilities
    if (processedCode.includes('TreeNode') && !processedCode.includes('class TreeNode')) {
        processedCode = `// TreeNode class will be available from the visualizer\n` + processedCode;
    }
    
    if (processedCode.includes('ListNode') && !processedCode.includes('class ListNode')) {
        processedCode = `// ListNode class will be available from the visualizer\n` + processedCode;
    }
    
    return processedCode;
}

/**
 * Generates sample data for common LeetCode problem types
 * @param {string} problemSlug - The problem slug
 * @returns {string} Sample data code
 */
function generateSampleData(problemSlug) {
    const samples = {
        'two-sum': `const nums = [2, 7, 11, 15];
const target = 9;`,
        'add-two-numbers': `const l1 = new ListNode(2, new ListNode(4, new ListNode(3)));
const l2 = new ListNode(5, new ListNode(6, new ListNode(4)));`,
        'longest-substring-without-repeating-characters': `const s = "abcabcbb";`,
        'median-of-two-sorted-arrays': `const nums1 = [1, 3];
const nums2 = [2];`,
        'binary-search': `const nums = [-1, 0, 3, 5, 9, 12];
const target = 9;`,
        'reverse-linked-list': `const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));`,
        'maximum-depth-of-binary-tree': `const root = new TreeNode(3, new TreeNode(9), new TreeNode(20, new TreeNode(15), new TreeNode(7)));`,
    };
    
    return samples[problemSlug] || `// Sample data for ${problemSlug}
const nums = [1, 2, 3, 4, 5];
const target = 5;`;
}

/**
 * Returns default code when a specific solution can't be loaded
 * @param {string} slug - The problem slug
 * @returns {string} Default code template
 */
function getDefaultCode(slug) {
    return `// ${slug} - Solution not found, using default template
const nums = [1, 2, 3, 4, 5];
const target = 5;

// Add your solution here
function solution(nums, target) {
    for (let i = 0; i < nums.length; i++) {
        console.log("Processing:", nums[i]);
        if (nums[i] === target) {
            return i;
        }
    }
    return -1;
}

const result = solution(nums, target);
console.log("Result:", result);`;
}

/**
 * Main function to get LeetCode defaults for a problem number
 * This is the function called from leetcode.html
 * @param {number|string} problemNumber - The LeetCode problem number
 * @returns {Promise<Object>} Object containing parameters for manual.html
 */
async function getLeetCodeDefaults(problemNumber) {
    try {
        // Load the problems list
        const problemsList = await fetchLeetCodeProblemsList();
        
        // Find the problem
        const problem = findProblemByNumber(problemNumber, problemsList);
        if (!problem) {
            throw new Error(`Problem ${problemNumber} not found`);
        }
        
        console.log(`Loading problem ${problem.id}: ${problem.title}`);
        
        // Load the JavaScript solution
        const originalCode = await loadJavaScriptSolution(problem.slug);
        
        // Process the code for visualization
        const visualizerCode = processCodeForVisualization(originalCode, problem.slug);
        
        // Extract visualization variables
        const variableInfo = extractVisualizationVariables(visualizerCode);
        
        // Return parameters that manual.html expects
        return {
            'user-code': visualizerCode,
            'included-variables': variableInfo.includedVariables.join(', '),
            'selected-variables': variableInfo.selectedVariables.join('; '),
            'leetcode-problem': problem.slug,
            'problem-title': problem.title,
            'problem-id': problem.id
        };
        
    } catch (error) {
        console.error('Error in getLeetCodeDefaults:', error);
        
        // Return fallback defaults
        return {
            'user-code': getDefaultCode('fallback'),
            'included-variables': 'nums, target, i, result',
            'selected-variables': 'nums:i, target',
            'leetcode-problem': 'two-sum',
            'problem-title': 'Problem not found',
            'problem-id': problemNumber
        };
    }
}

// Make functions available globally
window.getLeetCodeDefaults = getLeetCodeDefaults;
window.fetchLeetCodeProblemsList = fetchLeetCodeProblemsList;
