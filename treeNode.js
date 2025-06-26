export class TreeNode {
    /**
     * Creates an instance of TreeNode.
     * @param {any} val - The value to store in the node.
     * @param {TreeNode | null} left - A reference to the left child node, or null if none.
     * @param {TreeNode | null} right - A reference to the right child node, or null if none.
     */
    constructor(val, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}