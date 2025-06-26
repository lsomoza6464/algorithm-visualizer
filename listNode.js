export class ListNode {
    /**
     * Creates an instance of ListNode.
     * @param {any} val - The value to store in the node.
     * @param {ListNode | null} next - A reference to the next node in the list, or null if it's the last node.
     */
    constructor(val, next = null) {
        this.val = val;
        this.next = next;
    }
}