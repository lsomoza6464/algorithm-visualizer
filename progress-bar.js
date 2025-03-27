import { Visualizer } from "./visualizer.js";

export class ProgressBar {
    constructor(visualizer, snapshotObject, width = 50, height = 20) {
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
                this.value = this.updateProgressBar(event.x);
                console.log('val', this.value);
            })
            ).on('click', (event) => {
                this.value = this.updateProgressBar(event.x);
                console.log('val', this.value);
            });
        this.progressBarFill.call(d3.drag()
            .on('start drag', (event) => {
                this.value = this.updateProgressBar(event.x);
            })
            ).on('click', (event) => {
                this.value = this.updateProgressBar(event.x);
            });  

    }
    /*
    visualizeBar(maxValue = 20) {
        const selectedMap = this.selectedMap;
        const visualizer = this.visualizer;
        const snapshots = this.snapshots;
        const selectedSnapshots = this.selectedSnapshots;
        let value = 1
        const label = this.container.append('div')
            .style('position', 'absolute')
            .style('left', '50%')
            .style('top', '50%')
            .style('transform', 'translate(-50%, -50%)')
            .text(`${value}/${maxValue}`);
        const svg = this.container
        .append('svg')
        .attr('width', 300)
        .attr('height', 30)
        .attr('id', 'sliderSvg');

        // 2. Create progress bar background
        const progressBarBackground = svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 300)
        .attr('height', 30)
        .attr('fill', 'lightgray');

        // 3. Create progress bar fill (initially empty)
        const progressBarFill = svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', 30)
        .attr('fill', 'steelblue')
        .attr('width', 0Math.max(0, Math.min(300, clickedX))); 

        // 4. Attach click and drag behavior to the background
        progressBarBackground.call(d3.drag()
        .on('start drag', function(event) {
            this.value = updateProgressBar(event.x);
            console.log('val', this.value);
        })
        ).on('click', function(event) {
            this.value = updateProgressBar(event.x);
            console.log('val', this.value);
        });
        progressBarFill.call(d3.drag()
        .on('start drag', function(event) {
            this.value = updateProgressBar(event.x);
        })
        ).on('click', function(event) {
            this.this.value = updateProgressBar(event.x);
        }); 

        function updateProgressBar(clickedX) {
            console.log('val2', this.value);
            console.log(clickedX, 'click');
            const newWidth = Math.max(0, Math.min(300, clickedX));
            progressBarFill.attr('width', newWidth);
            let oldValue = value;
            value = Math.round(newWidth / 300 * (maxValue - 1)) + 1; 
            label.text(`${value}/${maxValue}`);
            if (oldValue != value) {
                visualizeValueChange(value);
            }
            return value;
            //console.log('Selected value:', value); 
        }
    
        function visualizeValueChange(value) {
            console.log('snapshots3', snapshots[value - 1]);
            console.log(selectedSnapshots)
            visualizer.clear();
            const selectedValueMap = getSelectedSnapshot(selectedSnapshots[value - 1], selectedMap)
            visualizer.visualizeAll(snapshots[value - 1], selectedValueMap);
        }

        function getSelectedSnapshot(selectedSnapshot, selectedMap) {
            console.log(selectedSnapshot)
            let snapshotMap = new Map();
            selectedSnapshot.forEach((value) => snapshotMap.set(value.name, value.value));
            console.log(snapshotMap);
            let valueMap = new Map();
            selectedMap.forEach((value, key) => {
                const selectedList = value;
                const valueList = selectedList.map((name) => {
                    if (snapshotMap.has(name)) {
                        return snapshotMap.get(name);
                    }
                });
                valueMap.set(key, valueList);
            });
            console.log(valueMap);
            return valueMap;
        }
    }
    */

    visualizeValueChange() {
        console.log('snapshots3', this.snapshots[this.value - 1]);
        console.log('heyo', this.selectedSnapshots, this.value);
        this.visualizer.clear();
        console.log(this.selectedSnapshots, this.value -1);
        const selectedValueMap = this.getSelectedSnapshot(this.selectedSnapshots[this.value - 1])
        this.visualizer.visualizeAll(this.snapshots[this.value - 1], selectedValueMap);
    }

    getSelectedSnapshot(selectedSnapshot) {
        let snapshotMap = new Map();
        selectedSnapshot.forEach((value) => snapshotMap.set(value.name, value.value));
        console.log(snapshotMap);
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
        console.log(valueMap);
        return valueMap;
    }
    updateProgressBar(clickedX) {
        console.log('val2', this.value);
        console.log(clickedX, 'click');
        const newWidth = Math.max(0, Math.min(300, clickedX));
        this.progressBarFill.attr('width', newWidth);
        let oldValue = this.value;
        this.value = Math.round(newWidth / 300 * (this.maxValue - 1)) + 1; 
        this.label.text(`${this.value}/${this.maxValue}`);
        if (oldValue != this.value) {
            this.visualizeValueChange();
        }
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