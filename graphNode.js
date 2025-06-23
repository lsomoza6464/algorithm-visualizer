export class GraphNode {
    /**
     * Creates an instance of TreeNode.
     * @param {any} val - The value to store in the node.
     * @param {GraphNode | null} neighbors
     */
    constructor(val, neighbors = []) {
        this.val = val;
        this.neighbors = neighbors;
    }
}