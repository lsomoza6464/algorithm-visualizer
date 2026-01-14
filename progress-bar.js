import { Visualizer } from "./visualizer.js";

export class ProgressBar {
    constructor(visualizer, snapshotObject, window, width = 50, height = 20) {
        this.container = d3.select('#slider-container')
            .style('position', 'relative')
            .style('box-sizing', 'border-box')
            .attr('width', 300)
            .attr('height', 30);
        this.visualizer = visualizer;
        this.snapshots = snapshotObject.snapshots;
        this.selectedMap = snapshotObject.selectedMap;
        this.selectedSnapshots = snapshotObject.selectedSnapshots;
        console.log('blah2', this.selectedSnapshots);
        this.value = 1;
        this.maxValue = snapshotObject.snapshots.length;
        this.window = window;

        this.label = this.container.append('div')
            .style('position', 'absolute')
            .style('left', '50%')
            .style('top', '50%')
            .style('transform', 'translate(-50%, -50%)')
            .text(`${this.value}/${this.maxValue}`);

        this.svg = this.container
            .append('svg')
            .attr('width', 300)
            .attr('height', 30)
            .attr('id', 'sliderSvg');

        this.progressBarBackground = this.svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 300)
            .attr('height', 30)
            .attr('fill', 'lightgray');

        this.progressBarFill = this.svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', 30)
        .attr('fill', 'steelblue')
        .attr('width', 0/*Math.max(0, Math.min(300, clickedX))*/);

        this.progressBarBackground.call(d3.drag()
            .on('start drag', (event) => {
                this.updateProgressBar(event.x);
                console.log('val', this.value);
            })
            ).on('click', (event) => {
                this.updateProgressBar(event.x);
                console.log('val', this.value);
            });
        this.progressBarFill.call(d3.drag()
            .on('start drag', (event) => {
                this.updateProgressBar(event.x);
            })
            ).on('click', (event) => {
                this.updateProgressBar(event.x);
            });  

    }
    updateSnapshotDisplay(snapshotIndex) {
        const currentSnapshot = snapshots[snapshotIndex];
        if (currentSnapshot && currentSnapshot.line) {
            this.window.highlightLine(currentSnapshot.line);
        }
    }
    visualizeValueChange() {
        console.log('snapshots3', this.snapshots[this.value - 1].data);
        console.log('heyo', this.selectedSnapshots, this.value);
        this.visualizer.clear();
        console.log(this.selectedSnapshots, this.value -1);
        const selectedValueMap = this.getSelectedSnapshot(this.selectedSnapshots[this.value - 1].data)
        this.visualizer.visualizeAll(this.snapshots[this.value - 1].data, selectedValueMap);
        if (this.snapshots[this.value - 1].data && this.snapshots[this.value - 1].line) {
            this.window.highlightLine(this.snapshots[this.value - 1].line);
        }
    }

    getSelectedSnapshot(selectedSnapshot) {
        let snapshotMap = new Map();
        console.log("selectedSnapshot", selectedSnapshot)
        selectedSnapshot.forEach((value) => snapshotMap.set(value.name, value.value));
        let valueMap = new Map();
        this.selectedMap.forEach((value, key) => {
            const selectedList = value;
            const valueList = selectedList.map((name) => {
                if (snapshotMap.has(name)) {
                    return snapshotMap.get(name);
                }
            });
            valueMap.set(key, valueList);
        });
        console.log('valueMap', valueMap);
        return valueMap;
    }
    updateProgressBar(clickedX) {
        //console.log('val2', this.value);
        //console.log(clickedX, 'click');
        const newWidth = Math.max(0, Math.min(300, clickedX));
        this.progressBarFill.attr('width', newWidth);
        let oldValue = this.value;
        this.value = Math.round(newWidth / 300 * (this.maxValue - 1)) + 1; 
        this.label.text(`${this.value}/${this.maxValue}`);
        if (oldValue != this.value) {
            this.visualizeValueChange();
        }
        //console.log("currval", this.value)
    }
    iterateProgressBar() {
        console.log('here4')
        console.log('firstVal', this.value);
        if (this.value < this.maxValue) {
            this.value += 1;
            this.visualizeValueChange();
        }
        console.log(this.value);
        this.progressBarFill.attr('width', this.value * (300/this.maxValue));
        this.label.text(`${this.value}/${this.maxValue}`);
    }
    deterateProgressBar() {
        console.log('lastVal', this.value);
        if (this.value > 1) {
            this.value -= 1;
            this.visualizeValueChange();
        }
        this.progressBarFill.attr('width', this.value * (300/this.maxValue));
        this.label.text(`${this.value}/${this.maxValue}`);
    }
    clearContainer() {
        this.container.html('');
    }
}